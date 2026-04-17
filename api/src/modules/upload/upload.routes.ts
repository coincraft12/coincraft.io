import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/require-role';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { uploadFile } from '../../lib/storage';
import { db } from '../../db';
import { courses, users, instructors, vimeoBulkUploads, chapters, lessons } from '../../db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { env } from '../../config/env';

const VIMEO_TOKEN = env.VIMEO_ACCESS_TOKEN ?? '';

export const UPLOADS_DIR =
  process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads');

// ─── Vimeo 헬퍼 ───────────────────────────────────────────────────────────────

async function vimeoFetch(path: string, options: RequestInit = {}) {
  return fetch(`https://api.vimeo.com${path}`, {
    ...options,
    headers: {
      Authorization: `bearer ${VIMEO_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.vimeo.*+json;version=3.4',
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

// 루트 폴더 목록에서 name 매칭 — 없으면 생성
async function findOrCreateRootFolder(name: string): Promise<string> {
  const listRes = await vimeoFetch(`/me/projects?per_page=100&fields=uri,name`);
  const listData = await listRes.json() as { data: { uri: string; name: string }[] };
  const existing = listData.data?.find((p) => p.name === name);
  if (existing) return existing.uri; // e.g. /me/projects/12345

  const createRes = await vimeoFetch('/me/projects', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  const created = await createRes.json() as { uri: string };
  return created.uri;
}

// 부모 폴더 내에서 name 매칭 서브폴더 — 없으면 생성
async function findOrCreateSubFolder(parentUri: string, name: string): Promise<string> {
  const parentId = parentUri.split('/').pop()!;
  const listRes = await vimeoFetch(`/me/projects/${parentId}/items?per_page=100&fields=folder.uri,folder.name,type`);
  const listData = await listRes.json() as { data: { type: string; folder?: { uri: string; name: string } }[] };
  const existing = listData.data
    ?.filter((item) => item.type === 'folder')
    .find((item) => item.folder?.name === name);
  if (existing?.folder) return existing.folder.uri;

  // 서브폴더 생성: POST /me/folders + parent_folder_uri (올바른 Vimeo API 엔드포인트)
  const createRes = await vimeoFetch('/me/folders', {
    method: 'POST',
    body: JSON.stringify({ name, parent_folder_uri: parentUri }),
  });
  const created = await createRes.json() as { uri: string };
  return created.uri;
}

// 영상을 특정 폴더에 추가
async function addVideoToFolder(videoUri: string, folderUri: string): Promise<void> {
  const folderId = folderUri.split('/').pop()!;
  const videoId = videoUri.split('/').pop()!;
  await vimeoFetch(`/me/projects/${folderId}/videos/${videoId}`, { method: 'PUT' });
}

// ─── 라우트 ───────────────────────────────────────────────────────────────────

export async function uploadRoutes(app: FastifyInstance): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  // POST /api/v1/instructor/upload/image
  app.post('/image', {
    preHandler: [authenticate, requireRole('instructor', 'admin')],
  }, async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({
        success: false,
        error: { code: 'NO_FILE', message: '파일이 없습니다.' },
      });
    }

    const ext = path.extname(data.filename).toLowerCase() || '.jpg';
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      return reply.code(400).send({
        success: false,
        error: { code: 'INVALID_TYPE', message: 'JPG, PNG, WEBP만 허용됩니다.' },
      });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length > 10 * 1024 * 1024) {
      return reply.code(400).send({
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: '파일 크기는 10MB 이하여야 합니다.' },
      });
    }

    // MIME magic byte 검증 (확장자 위조 방지)
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer.length > 12 && buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
    if (!isJpeg && !isPng && !isWebp) {
      return reply.code(400).send({
        success: false,
        error: { code: 'INVALID_MIME', message: '실제 이미지 파일만 업로드할 수 있습니다.' },
      });
    }

    const filename = `${randomUUID()}${ext}`;
    const key = `images/${filename}`;

    // S3 키가 설정돼 있으면 Hetzner Object Storage, 아니면 로컬 fallback
    let url: string;
    if (process.env.S3_ACCESS_KEY_ID) {
      url = await uploadFile(key, buffer, `image/${ext.slice(1)}`);
    } else {
      await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);
      const publicBase = process.env.API_PUBLIC_URL
        ? process.env.API_PUBLIC_URL.replace(/\/$/, '')
        : `${request.protocol}://${request.hostname}:${process.env.PORT ?? 4000}`;
      url = `${publicBase}/api/v1/files/${filename}`;
    }

    return reply.send({ success: true, data: { url, filename } });
  });

  // POST /api/v1/instructor/upload/vimeo-init
  app.post('/vimeo-init', {
    preHandler: [authenticate, requireRole('instructor', 'admin')],
    schema: {
      body: {
        type: 'object',
        required: ['size', 'name', 'courseId'],
        properties: {
          size: { type: 'number' },
          name: { type: 'string' },
          courseId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    if (!VIMEO_TOKEN) {
      return reply.code(500).send({ success: false, error: { code: 'NO_TOKEN', message: 'Vimeo 토큰이 설정되지 않았습니다.' } });
    }

    const { size, name, courseId } = request.body as { size: number; name: string; courseId: string };
    const userId = request.user!.id;

    // size 유효성 검사 (음수/0/과대 방지)
    if (!Number.isInteger(size) || size <= 0 || size > 50 * 1024 * 1024 * 1024) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 파일 크기입니다.' } });
    }

    // 강사 소유 강좌인지 확인
    const [ownedCourse] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.instructorId, userId)))
      .limit(1);
    if (!ownedCourse) {
      return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: '해당 강좌에 대한 권한이 없습니다.' } });
    }

    // 강사명 + 강의명 조회
    let instructorName = '강사';
    let courseTitle = '미분류';
    try {
      const [row] = await db
        .select({ courseTitle: courses.title, instructorName: users.name })
        .from(courses)
        .leftJoin(instructors, eq(courses.instructorId, instructors.userId))
        .leftJoin(users, eq(instructors.userId, users.id))
        .where(eq(courses.id, courseId))
        .limit(1);
      if (row) {
        instructorName = row.instructorName ?? '강사';
        courseTitle = row.courseTitle ?? '미분류';
      }
    } catch {
      // 조회 실패 시 기본값 사용
    }

    // Vimeo 업로드 슬롯 생성
    const res = await vimeoFetch('/me/videos', {
      method: 'POST',
      body: JSON.stringify({
        upload: { approach: 'tus', size },
        name,
        privacy: { view: 'disable', embed: 'whitelist' },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return reply.code(502).send({ success: false, error: { code: 'VIMEO_ERROR', message: err } });
    }

    const data = await res.json() as { uri: string; upload: { upload_link: string } };

    // 강사 폴더 → 강의 폴더 생성/조회 후 영상 배치 + 허용 도메인 등록 (비동기)
    setImmediate(async () => {
      try {
        const videoId = data.uri.split('/').pop()!;

        // 허용 도메인 whitelist 등록
        const allowedDomains = ['coincraft.io', 'staging.coincraft.io', 'localhost'];
        await Promise.all(
          allowedDomains.map((domain) =>
            vimeoFetch(`/videos/${videoId}/privacy/domains/${domain}`, { method: 'PUT' })
          )
        );

        // 폴더 배치
        const instructorFolder = await findOrCreateRootFolder(instructorName);
        const courseFolder = await findOrCreateSubFolder(instructorFolder, courseTitle);
        await addVideoToFolder(data.uri, courseFolder);
      } catch (e) {
        app.log.error({ err: e }, '[vimeo-folder] 폴더 배치 실패');
      }
    });

    return reply.send({
      success: true,
      data: {
        uploadLink: data.upload.upload_link,
        videoUri: data.uri,
      },
    });
  });

  // GET /api/v1/instructor/upload/vimeo-status?videoUri=/videos/12345
  app.get('/vimeo-status', {
    preHandler: [authenticate, requireRole('instructor', 'admin')],
  }, async (request, reply) => {
    if (!VIMEO_TOKEN) {
      return reply.code(500).send({ success: false, error: { code: 'NO_TOKEN', message: 'Vimeo 토큰이 설정되지 않았습니다.' } });
    }

    const { videoUri } = request.query as { videoUri?: string };
    if (!videoUri) {
      return reply.code(400).send({ success: false, error: { code: 'MISSING_URI', message: 'videoUri가 필요합니다.' } });
    }

    // SSRF 방지: /videos/<numeric_id> 형식만 허용
    if (!/^\/videos\/\d+$/.test(videoUri)) {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_URI', message: '유효하지 않은 videoUri 형식입니다.' } });
    }

    const res = await vimeoFetch(`${videoUri}?fields=uri,link,status`);

    if (!res.ok) {
      return reply.code(502).send({ success: false, error: { code: 'VIMEO_ERROR', message: 'Vimeo 상태 조회 실패' } });
    }

    const data = await res.json() as { uri: string; link: string; status: string };

    return reply.send({
      success: true,
      data: {
        status: data.status,
        vimeoUrl: data.link ?? null,
      },
    });
  });

  // ─── 일괄 업로드 ──────────────────────────────────────────────────────────────

  // POST /api/v1/instructor/upload/bulk-vimeo-init
  app.post('/bulk-vimeo-init', {
    preHandler: [authenticate, requireRole('instructor', 'admin')],
    schema: {
      body: {
        type: 'object',
        required: ['size', 'filename', 'courseId'],
        properties: {
          size: { type: 'number' },
          filename: { type: 'string' },
          courseId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    if (!VIMEO_TOKEN) {
      return reply.code(500).send({ success: false, error: { code: 'NO_TOKEN', message: 'Vimeo 토큰이 설정되지 않았습니다.' } });
    }

    const { size, filename, courseId } = request.body as { size: number; filename: string; courseId: string };
    const userId = request.user!.id;

    // size 유효성 검사
    if (!Number.isInteger(size) || size <= 0 || size > 50 * 1024 * 1024 * 1024) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 파일 크기입니다.' } });
    }

    // 강사 소유 강좌인지 확인
    const [ownedCourseBulk] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.instructorId, userId)))
      .limit(1);
    if (!ownedCourseBulk) {
      return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: '해당 강좌에 대한 권한이 없습니다.' } });
    }

    let instructorName = '강사';
    let courseTitle = '미분류';
    try {
      const [row] = await db
        .select({ courseTitle: courses.title, instructorName: users.name })
        .from(courses)
        .leftJoin(instructors, eq(courses.instructorId, instructors.userId))
        .leftJoin(users, eq(instructors.userId, users.id))
        .where(eq(courses.id, courseId))
        .limit(1);
      if (row) {
        instructorName = row.instructorName ?? '강사';
        courseTitle = row.courseTitle ?? '미분류';
      }
    } catch { /* 기본값 사용 */ }

    // Vimeo 업로드 슬롯 생성
    const res = await vimeoFetch('/me/videos', {
      method: 'POST',
      body: JSON.stringify({
        upload: { approach: 'tus', size },
        name: filename,
        privacy: { view: 'disable', embed: 'whitelist' },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return reply.code(502).send({ success: false, error: { code: 'VIMEO_ERROR', message: err } });
    }

    const vimeoData = await res.json() as { uri: string; upload: { upload_link: string } };

    // DB에 업로드 기록 저장
    const [record] = await db.insert(vimeoBulkUploads).values({
      instructorId: userId,
      courseId,
      filename,
      videoUri: vimeoData.uri,
      status: 'uploading',
    }).returning();

    // 폴더 배치 + 도메인 허용 (비동기)
    setImmediate(async () => {
      try {
        const videoId = vimeoData.uri.split('/').pop()!;
        const allowedDomains = ['coincraft.io', 'staging.coincraft.io', 'localhost'];
        await Promise.all(
          allowedDomains.map((domain) =>
            vimeoFetch(`/videos/${videoId}/privacy/domains/${domain}`, { method: 'PUT' })
          )
        );
        const instructorFolder = await findOrCreateRootFolder(instructorName);
        const courseFolder = await findOrCreateSubFolder(instructorFolder, courseTitle);
        await addVideoToFolder(vimeoData.uri, courseFolder);
      } catch (e) {
        app.log.error({ err: e }, '[bulk-upload] 폴더 배치 실패');
      }
    });

    return reply.send({
      success: true,
      data: {
        uploadId: record.id,
        uploadLink: vimeoData.upload.upload_link,
        videoUri: vimeoData.uri,
      },
    });
  });

  // PATCH /api/v1/instructor/upload/bulk-uploads/:id — 완료/에러 상태 업데이트
  app.patch('/bulk-uploads/:id', {
    preHandler: [authenticate, requireRole('instructor', 'admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { status?: string; vimeoUrl?: string; errorMsg?: string };

    // status 허용값 제한 (임의 문자열 DB 저장 방지)
    const ALLOWED_STATUSES = ['uploading', 'done', 'error'];
    if (body.status !== undefined && !ALLOWED_STATUSES.includes(body.status)) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 status 값입니다.' } });
    }

    await db.update(vimeoBulkUploads)
      .set({
        ...(body.status && { status: body.status }),
        ...(body.vimeoUrl && { vimeoUrl: body.vimeoUrl }),
        ...(body.errorMsg && { errorMsg: body.errorMsg }),
      })
      .where(and(eq(vimeoBulkUploads.id, id), eq(vimeoBulkUploads.instructorId, request.user!.id)));

    return reply.send({ success: true });
  });

  // GET /api/v1/instructor/upload/bulk-uploads?courseId=xxx
  app.get('/bulk-uploads', {
    preHandler: [authenticate, requireRole('instructor', 'admin')],
  }, async (request, reply) => {
    const { courseId } = request.query as { courseId?: string };
    if (!courseId) {
      return reply.code(400).send({ success: false, error: { code: 'MISSING', message: 'courseId가 필요합니다.' } });
    }

    const rows = await db
      .select()
      .from(vimeoBulkUploads)
      .where(and(
        eq(vimeoBulkUploads.courseId, courseId),
        eq(vimeoBulkUploads.instructorId, request.user!.id),
      ))
      .orderBy(desc(vimeoBulkUploads.createdAt));

    return reply.send({ success: true, data: rows });
  });

  // DELETE /api/v1/instructor/upload/bulk-uploads/:id
  app.delete('/bulk-uploads/:id', {
    preHandler: [authenticate, requireRole('instructor', 'admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [row] = await db
      .select({ videoUri: vimeoBulkUploads.videoUri })
      .from(vimeoBulkUploads)
      .where(and(eq(vimeoBulkUploads.id, id), eq(vimeoBulkUploads.instructorId, request.user!.id)))
      .limit(1);

    if (!row) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: '업로드를 찾을 수 없습니다.' } });

    // Vimeo 영상도 삭제
    if (row.videoUri) {
      vimeoFetch(row.videoUri, { method: 'DELETE' }).catch(() => {});
    }

    await db.delete(vimeoBulkUploads)
      .where(and(eq(vimeoBulkUploads.id, id), eq(vimeoBulkUploads.instructorId, request.user!.id)));

    return reply.send({ success: true });
  });

  // POST /api/v1/instructor/upload/bulk-generate — 선택한 업로드로 챕터+레슨 일괄 생성
  app.post('/bulk-generate', {
    preHandler: [authenticate, requireRole('instructor', 'admin')],
    schema: {
      body: {
        type: 'object',
        required: ['courseId', 'uploadIds', 'chapterTitle'],
        properties: {
          courseId: { type: 'string' },
          uploadIds: { type: 'array', items: { type: 'string' } },
          chapterTitle: { type: 'string' },
          chapterId: { type: 'string' }, // 기존 챕터에 추가할 경우
        },
      },
    },
  }, async (request, reply) => {
    const { courseId, uploadIds, chapterTitle, chapterId: existingChapterId } =
      request.body as { courseId: string; uploadIds: string[]; chapterTitle: string; chapterId?: string };
    const userId = request.user!.id;

    // uploadIds 크기 제한 (DoS 방지)
    if (!Array.isArray(uploadIds) || uploadIds.length === 0 || uploadIds.length > 100) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'uploadIds는 1~100개 사이여야 합니다.' } });
    }

    // 강사가 해당 강좌의 소유자인지 확인
    const [ownedCourse] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.instructorId, userId)))
      .limit(1);
    if (!ownedCourse) {
      return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: '해당 강좌에 대한 권한이 없습니다.' } });
    }

    // 업로드 레코드 조회 (완료된 것만)
    const uploads = await db
      .select()
      .from(vimeoBulkUploads)
      .where(and(
        eq(vimeoBulkUploads.instructorId, userId),
        eq(vimeoBulkUploads.courseId, courseId),
      ));

    const selectedUploads = uploads.filter(
      (u) => uploadIds.includes(u.id) && u.status === 'done' && u.vimeoUrl
    );

    if (selectedUploads.length === 0) {
      return reply.code(400).send({ success: false, error: { code: 'NO_UPLOADS', message: '완료된 업로드가 없습니다.' } });
    }

    // 챕터 결정 (기존 또는 신규 생성)
    let targetChapterId = existingChapterId;
    if (!targetChapterId) {
      // 현재 마지막 챕터 order 조회
      const existingChapters = await db
        .select({ order: chapters.order })
        .from(chapters)
        .where(eq(chapters.courseId, courseId))
        .orderBy(desc(chapters.order))
        .limit(1);

      const nextOrder = (existingChapters[0]?.order ?? -1) + 1;

      const [newChapter] = await db.insert(chapters).values({
        courseId,
        title: chapterTitle,
        order: nextOrder,
        isPublished: false,
      }).returning();
      targetChapterId = newChapter.id;
    }

    // 현재 챕터의 마지막 레슨 order 조회
    const existingLessons = await db
      .select({ order: lessons.order })
      .from(lessons)
      .where(eq(lessons.chapterId, targetChapterId!))
      .orderBy(desc(lessons.order))
      .limit(1);

    let lessonOrder = (existingLessons[0]?.order ?? -1) + 1;

    // 파일명에서 제목 추출 (확장자 제거)
    function extractTitle(filename: string): string {
      return filename.replace(/\.[^.]+$/, '').trim();
    }

    // 레슨 일괄 생성
    const createdLessons = [];
    for (const upload of selectedUploads) {
      const [newLesson] = await db.insert(lessons).values({
        chapterId: targetChapterId!,
        courseId,
        title: extractTitle(upload.filename),
        type: 'video',
        videoProvider: 'vimeo',
        videoUrl: upload.vimeoUrl!,
        order: lessonOrder++,
        isPublished: false,
      }).returning();

      // 업로드 레코드에 lessonId 연결
      await db.update(vimeoBulkUploads)
        .set({ lessonId: newLesson.id })
        .where(eq(vimeoBulkUploads.id, upload.id));

      createdLessons.push(newLesson);
    }

    return reply.send({
      success: true,
      data: {
        chapterId: targetChapterId,
        lessonsCreated: createdLessons.length,
      },
    });
  });
}
