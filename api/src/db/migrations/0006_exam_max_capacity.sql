-- 검정 시험 최대 정원 컬럼 추가
ALTER TABLE cert_exams ADD COLUMN IF NOT EXISTS max_capacity integer;
