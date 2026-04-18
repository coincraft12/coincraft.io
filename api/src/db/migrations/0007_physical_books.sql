-- 종이책 테이블
CREATE TABLE IF NOT EXISTS physical_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  author VARCHAR(100) NOT NULL DEFAULT 'COINCRAFT',
  price INTEGER NOT NULL,
  cover_image_url TEXT,
  description TEXT,
  stock INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 종이책 주문 테이블
CREATE TABLE IF NOT EXISTS book_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  book_id UUID NOT NULL REFERENCES physical_books(id),
  payment_id UUID REFERENCES payments(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  shipping_name VARCHAR(100) NOT NULL,
  shipping_phone VARCHAR(20) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_detail TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 초기 책 데이터
INSERT INTO physical_books (title, author, price, cover_image_url, description, stock, is_active)
VALUES
  (
    '온체인 시그널, 보이지 않는 시장의 진짜 움직임',
    'COINCRAFT',
    35000,
    'https://coincraft.io/wp-content/uploads/2026/03/%EC%83%81%ED%92%88%EC%9D%B4%EB%AF%B8%EC%A7%80-%EB%B3%B5%EC%82%AC-1.png',
    '온체인 데이터로 시장의 진짜 움직임을 읽는 법을 담은 실전 가이드. 블록체인 위에 새겨진 데이터만이 말해주는 진실을 읽어라.',
    100,
    true
  ),
  (
    '살아남기 위한 생존전략 WEB3',
    'COINCRAFT',
    19800,
    'https://coincraft.io/wp-content/uploads/2026/03/%EC%83%81%ED%92%88%EC%9D%B4%EB%AF%B8%EC%A7%80-%EB%B3%B5%EC%82%AC-3.png',
    'Web3 세상에서 살아남기 위한 필수 전략과 인사이트. 혼돈의 시대를 헤쳐나갈 당신만의 전략을 세워라.',
    100,
    true
  )
ON CONFLICT DO NOTHING;
