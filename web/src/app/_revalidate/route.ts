import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { paths } = await req.json() as { paths: string[] };
  for (const path of paths) {
    revalidatePath(path);
  }
  return NextResponse.json({ revalidated: true });
}
