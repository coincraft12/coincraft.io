import { S3Client, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Pool } from 'pg';

const BUCKET = process.env.S3_BUCKET ?? 'coincraft-uploads';
const ENDPOINT = process.env.S3_ENDPOINT ?? 'https://hel1.your-objectstorage.com';
const REGION = process.env.S3_REGION ?? 'eu-central-1';

const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  },
  forcePathStyle: false,
});

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\uAC00-\uD7A3-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function keyExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch { return false; }
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query('SELECT id, title, file_url FROM chapter_materials ORDER BY created_at');
  console.log(`총 ${rows.length}개 자료 처리 시작\n`);

  for (const row of rows) {
    const url: string = row.file_url;
    const prefix = `${ENDPOINT}/${BUCKET}/`;
    if (!url.startsWith(prefix)) { console.log(`SKIP: ${row.title}`); continue; }

    const oldKey = url.slice(prefix.length);
    const ext = oldKey.slice(oldKey.lastIndexOf('.'));
    const slug = slugify(row.title);
    const newKey = `materials/${slug}${ext}`;

    if (oldKey === newKey) { console.log(`OK: ${row.title}`); continue; }

    const newUrl = `${ENDPOINT}/${BUCKET}/${newKey}`;

    // 새 키가 이미 존재하면 S3 복사 건너뜀
    const alreadyCopied = await keyExists(newKey);
    if (!alreadyCopied) {
      await s3.send(new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${oldKey}`,
        Key: newKey,
        ACL: 'public-read',
        MetadataDirective: 'COPY',
      }));
    }

    // DB 업데이트
    await pool.query('UPDATE chapter_materials SET file_url = $1 WHERE id = $2', [newUrl, row.id]);

    // 구 파일 삭제
    if (await keyExists(oldKey)) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: oldKey }));
    }

    console.log(`✓ ${row.title}`);
    console.log(`  ${oldKey} → ${newKey}\n`);
  }

  await pool.end();
  console.log('완료');
}

main().catch(console.error);
