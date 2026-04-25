/**
 * 잘린 강의노트 패치: [1강] 왜 WEB3를 배워야 할까
 * 실행: npx tsx src/scripts/patch-lesson-notes.ts
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { lessons } from '../db/schema';

const LESSON_ID = '0356410b-5826-4183-91f4-a78809a8cc37';

const ADDITION = `

### 2️⃣ 규제 정비 및 산업 육성

**암호화폐 기업의 제도권 편입**
- **코인베이스**: 미국 최대 중앙화 거래소 → 상장 허용, 합법적 금융 인프라로 인정
- **서클(Circle)**: 달러 스테이블코인 발행 사기업 → 연준 독점이었던 화폐 발행권을 민간에 개방
- **컨센시스(Consensys)**: 메타마스크 지갑 개발사 → 정부·기관과 협업 진행

**주요 입법 추진**

| 법안 | 내용 |
|------|------|
| **GENIUS Act** | 민간 기업의 달러 스테이블코인 발행 허용 (트럼프 서명, 세부 조율 중) |
| **Clarity Act** | 암호화폐의 증권·상품 분류 기준 명확화 (혼란 해소) |
| **FIT Act** | 디지털 자산 전반을 상품으로 정의, CFTC 중심 규제 |

> 미국은 단순히 막는 규제가 아닌, **산업을 육성하는 규제**로 방향을 전환했습니다.

---

### 3️⃣ 법적 제도화 (항구적 법제화)

**행정명령이 아닌 법률로 못 박기**
- 차기 대통령이 "암호화폐 싫다"고 해도 번복 불가
- GENIUS Act → 상원 통과 후 트럼프 서명, 세부 법안 조율 중
- Clarity Act, FIT Act → 상하원 통과 진행 중

> 올해 말~내년 초부터 법안들이 실제 적용되면서 **완전히 다른 세계**가 열릴 전망입니다.

---

## 🌐 미국 전략의 본질: 달러 패권 유지

**달러 스테이블코인의 세계화**
- 전 세계 무역 결제를 달러 스테이블코인으로 → 달러 패권 유지
- CBDC(중앙은행 디지털화폐) 대신 **민간 주도 스테이블코인** 선택
- 이유: CBDC는 국가 감시 도구 → 미국의 자유시장 원칙과 충돌

**각국의 대응**

| 국가 | 전략 |
|------|------|
| 한국 | CBDC 실패 후 원화 스테이블코인 논의 중, 제도 정비 뒤처짐 |
| 프랑스/유럽 | MiCA 법안으로 선제 대응, CBDC 준비 완료 |
| 일본 | 민관 합작 스테이블코인(JPYC) 테스트 완료 |
| 중국 | 본토 금지 + 홍콩 개방 이중 전략, BTC·ETH ETF 홍콩 승인 |

---

## 💡 핵심 정리

> 암호화폐는 **단순한 투자 수단이 아니라 세계 질서 재편의 도구**입니다.
>
> 미국은 ETF 승인 → 규제 정비 → 법적 제도화의 3단계로 암호화폐를 **국가 전략 자산**으로 편입하고 있습니다.
>
> 지금 이 흐름을 이해하는 사람이 다음 사이클의 기회를 잡을 수 있습니다.

**이 강의를 통해 배울 것**
- WEB3 지갑 직접 만들기
- 탈중앙화 거래소 사용법
- 블록체인 트랜잭션 읽는 법
- 섹터별 코인 분석 및 투자 판단력`;

async function main() {
  const [row] = await db
    .select({ textContent: lessons.textContent })
    .from(lessons)
    .where(eq(lessons.id, LESSON_ID))
    .limit(1);

  if (!row?.textContent) {
    console.error('레슨을 찾을 수 없습니다.');
    process.exit(1);
  }

  const current = row.textContent;
  // "### 2️" 로 잘린 위치 찾기
  const cutoff = current.lastIndexOf('### 2');
  if (cutoff === -1) {
    console.error('잘린 위치를 찾을 수 없습니다.');
    process.exit(1);
  }

  const patched = current.slice(0, cutoff).trimEnd() + ADDITION;
  console.log(`기존: ${current.length}자 → 패치 후: ${patched.length}자`);

  await db.update(lessons)
    .set({ textContent: patched })
    .where(eq(lessons.id, LESSON_ID));

  console.log('✅ 강의노트 패치 완료');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
