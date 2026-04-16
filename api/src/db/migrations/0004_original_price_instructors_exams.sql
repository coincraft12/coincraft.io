-- Migration: 0004_original_price_instructors_exams
-- 0. users 테이블에 phone 컬럼 추가 (스키마 드리프트 수정)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" varchar(20);

-- 1. courses 테이블에 original_price 컬럼 추가
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "original_price" numeric(10, 2);

-- 2. instructors 테이블에 career, photo_url 컬럼 추가 (기존 테이블 확장)
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "career" text;
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "photo_url" text;

-- 3. exam_registrations 테이블에 pdf_sent 컬럼 추가
ALTER TABLE "exam_registrations" ADD COLUMN IF NOT EXISTS "pdf_sent" boolean NOT NULL DEFAULT false;

-- 4. cert_exams 테이블에 pdf_delivery_date, pdf_file_url 컬럼 추가
ALTER TABLE "cert_exams" ADD COLUMN IF NOT EXISTS "pdf_delivery_date" date;
ALTER TABLE "cert_exams" ADD COLUMN IF NOT EXISTS "pdf_file_url" text;
