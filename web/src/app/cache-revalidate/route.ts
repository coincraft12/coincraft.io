import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// 이 엔드포인트는 내부 서버 간 호출 전용입니다.
// 외부 공개 엔드포인트가 아닙니다 — nginx에서 외부 노출 차단 필요.
export async function POST(req: NextRequest) {
  // 요청 출처가 localhost/내부 환경인지 간단 검증
  const host = req.headers.get('host') ?? '';
  const isInternal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  if (!isInternal && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as { paths?: unknown } | null;
  if (!Array.isArray(body?.paths)) {
    return NextResponse.json({ error: 'paths array is required' }, { status: 400 });
  }

  const paths = (body.paths as unknown[]).filter((p): p is string => typeof p === 'string');
  for (const path of paths) {
    revalidatePath(path);
  }
  return NextResponse.json({ revalidated: true });
}
