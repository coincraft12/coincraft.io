-- 0009_exam_improvements.sql
-- 검정 운영에 필요한 필드 추가

-- [1] cert_exams: 시험 일정 정보
ALTER TABLE cert_exams ADD COLUMN IF NOT EXISTS exam_date DATE;
ALTER TABLE cert_exams ADD COLUMN IF NOT EXISTS registration_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE cert_exams ADD COLUMN IF NOT EXISTS registration_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE cert_exams ADD COLUMN IF NOT EXISTS exam_round INTEGER NOT NULL DEFAULT 1;

-- [2] exam_registrations: 접수 상태 관리
ALTER TABLE exam_registrations ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'payment_completed';
ALTER TABLE exam_registrations ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE exam_registrations ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- 기존 데이터: payment_id 없는 접수건은 registered로 보정
UPDATE exam_registrations SET status = 'registered' WHERE payment_id IS NULL;

-- [3] certificates: examId FK constraint 추가 (기존 null 데이터 안전하게 처리)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'certificates_exam_id_fkey'
    AND table_name = 'certificates'
  ) THEN
    ALTER TABLE certificates
      ADD CONSTRAINT certificates_exam_id_fkey
      FOREIGN KEY (exam_id) REFERENCES cert_exams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- [4] 인덱스
CREATE INDEX IF NOT EXISTS exam_registrations_status_idx ON exam_registrations(status);
CREATE INDEX IF NOT EXISTS cert_exams_exam_date_idx ON cert_exams(exam_date);
