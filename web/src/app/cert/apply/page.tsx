import { redirect } from 'next/navigation';

export const metadata = { title: '검정 신청 — CoinCraft' };

// /cert/apply → /exams (시험 목록에서 신청)
export default function CertApplyPage() {
  redirect('/exams');
}
