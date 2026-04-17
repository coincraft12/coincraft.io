import 'dotenv/config';
import { db, pool } from './index';
import { certExams, examQuestions } from './schema';

async function seedExamBasic1() {
  console.log('Seeding WEB3 구조 설계자 Basic 1회 검정...');

  const [exam] = await db
    .insert(certExams)
    .values({
      title: 'WEB3 구조 설계자 Basic 1회 검정',
      level: 'basic',
      description: 'WEB3 구조 설계자 자격 검정 Basic 등급 1회차. 분산 신뢰 구조와 WEB3 기초 구조를 검증합니다.',
      passingScore: 70,
      timeLimit: 60,
      isActive: true,
      examFee: '30000',
    })
    .returning();

  console.log('Created exam:', exam.id);

  const questions = [
    // ━━━ 과목 1. 분산 신뢰 구조의 이해 (1~15번) ━━━
    {
      question: '중앙화 신뢰 구조에서 은행이 수행하는 4가지 기능을 올바르게 묶은 것은?',
      options: [
        '계정(Account) / 장부(Ledger) / 투자(Investment) / 분쟁조정(Recourse)',
        '계정(Account) / 장부(Ledger) / 결제(Settlement) / 분쟁조정(Recourse)',
        '계정(Account) / 암호화(Encryption) / 결제(Settlement) / 분쟁조정(Recourse)',
        '신원확인(KYC) / 장부(Ledger) / 결제(Settlement) / 보험(Insurance)',
      ],
      correctIndex: 1, order: 1, points: 1,
    },
    {
      question: '다음 중 "중앙화 계정"과 "WEB3 키 기반 소유권"의 가장 핵심적인 구조적 차이를 옳게 설명한 것은?',
      options: [
        '중앙화 계정은 복잡한 암호화를 사용하고, WEB3는 단순한 비밀번호를 사용한다.',
        '중앙화 계정은 기관이 접근 권한을 관리하고, WEB3는 키를 가진 사람이 소유권을 직접 행사한다.',
        '중앙화 계정은 법적 보호를 받지 못하고, WEB3는 법으로 보호받는다.',
        '중앙화 계정은 온라인에서만 사용 가능하고, WEB3는 오프라인에서도 작동한다.',
      ],
      correctIndex: 1, order: 2, points: 1,
    },
    {
      question: '중앙화 시스템에서 "분쟁조정(Recourse)"이 구조적으로 갖는 성격으로 옳은 것은?',
      options: [
        '안전장치이면서 동시에 강한 통제 권한이기도 하다.',
        '순수하게 사용자를 보호하기 위한 중립적 장치다.',
        '기술적 암호화로 구현되는 보안 메커니즘이다.',
        'WEB3에서는 더 강력하게 구현되어 있다.',
      ],
      correctIndex: 0, order: 3, points: 1,
    },
    {
      question: '단일 기록 구조(Single Source of Truth)의 3대 구조적 리스크를 올바르게 나열한 것은?',
      options: [
        '검열(Censorship) / 변조(Tampering) / 단일 장애점(SPOF)',
        '해킹(Hacking) / 데이터 손실(Data Loss) / 서버 다운(Server Down)',
        '검열(Censorship) / 속도 저하(Latency) / 프라이버시 침해(Privacy)',
        '변조(Tampering) / 단일 장애점(SPOF) / 암호화 취약점(Crypto Vulnerability)',
      ],
      correctIndex: 0, order: 4, points: 1,
    },
    {
      question: '검열(Censorship)의 구조적 정의로 가장 적절한 것은?',
      options: [
        '기록 운영자가 악의를 가지고 특정 거래를 숨기는 행위',
        '정부가 법으로 특정 트랜잭션을 금지하는 규제 행위',
        '기록 입구(gate)를 통제해 특정 요청을 거부·지연·조건부 허용하는 능력',
        '해커가 데이터베이스에 침입해 기록을 삭제하는 공격',
      ],
      correctIndex: 2, order: 5, points: 1,
    },
    {
      question: '구조 설계자 관점에서 "검열"과 "규제 준수(정당한 통제)"를 구분하는 핵심 기준은?',
      options: [
        '차단된 금액의 크기',
        '기준의 투명성과 이의제기(appeal) 가능성',
        '차단이 일어난 국가의 법률',
        '기술적 구현 방식(온라인/오프라인)',
      ],
      correctIndex: 1, order: 6, points: 1,
    },
    {
      question: '"변조(Tampering)"를 구조적으로 가장 정확히 설명한 것은?',
      options: [
        '진실의 기준점(Truth source)을 흔드는 행위로, 과거 기록 수정·규칙 재해석·감사 로그 통제를 포함',
        '데이터를 단순히 고치는 행위',
        '해킹으로 서버 접근 권한을 탈취하는 행위',
        '외부 참여자가 기록을 검증할 수 없게 만드는 기술적 문제',
      ],
      correctIndex: 0, order: 7, points: 1,
    },
    {
      question: '단일 장애점(SPOF)이 특히 위험한 구조적 이유로 가장 적절한 것은?',
      options: [
        '서버가 비싸기 때문에 복구 비용이 크다.',
        '백업 서버를 운영하는 비용이 높아지기 때문이다.',
        '그 시스템이 "진실의 기준점"이기 때문에, 멈추면 거래가 존재하지 않는 것처럼 된다.',
        '법적으로 단일 서버 운영이 금지되어 있기 때문이다.',
      ],
      correctIndex: 2, order: 8, points: 1,
    },
    {
      question: '권한-책임 불일치(Power-Accountability Mismatch)가 발생하는 3가지 대표 패턴을 올바르게 나열한 것은?',
      options: [
        '동결(Freeze) / 차단(Block) / 규칙변경(Change Rules)',
        '해킹(Hacking) / 피싱(Phishing) / 스캠(Scam)',
        '동결(Freeze) / 개인정보 침해(Privacy Breach) / 수수료 인상(Fee Increase)',
        '차단(Block) / 규칙변경(Change Rules) / 시스템 장애(System Failure)',
      ],
      correctIndex: 0, order: 9, points: 1,
    },
    {
      question: '다음 중 "동결(Freeze)"의 구조적 정의로 가장 적절한 것은?',
      options: [
        '자산이 사라진 상태',
        '계정이 해킹당한 상태',
        '자산은 존재하지만 상태 전이가 차단된 상태',
        '사용자가 스스로 거래를 중단한 상태',
      ],
      correctIndex: 2, order: 10, points: 1,
    },
    {
      question: '권한 지도(Power Map)를 작성할 때 각 행동에 대해 확인해야 하는 항목이 아닌 것은?',
      options: [
        '누가 승인하는가?',
        '누가 규칙을 바꿀 수 있는가?',
        '시스템의 서버 사양은 무엇인가?',
        '문제 발생 시 누가 비용을 부담하는가?',
      ],
      correctIndex: 2, order: 11, points: 1,
    },
    {
      question: '분산 신뢰 3층 구조에서 "합의(Consensus)"와 "검증(Validation)"의 차이를 가장 정확하게 설명한 것은?',
      options: [
        '합의는 속도가 빠르고, 검증은 느리다.',
        '합의는 글로벌 차원에서 공식 기록을 채택하는 것이고, 검증은 로컬에서 규칙 부합 여부를 확인하는 것이다.',
        '합의는 채굴자가 하고, 검증은 일반 사용자가 한다.',
        '합의는 실패가 없고, 검증은 실패할 수 있다.',
      ],
      correctIndex: 1, order: 12, points: 1,
    },
    {
      question: '분산 신뢰 3층 구조에서 "실행(Execution)"의 핵심 역할로 가장 적절한 것은?',
      options: [
        '어떤 트랜잭션을 공식 기록으로 채택할지 결정한다.',
        '트랜잭션이 규칙에 맞는지 로컬에서 확인한다.',
        '(이전 상태 + 트랜잭션)을 입력받아 새 상태를 출력하는 상태 전이 규칙이다.',
        '블록에 포함될 트랜잭션의 우선순위를 결정한다.',
      ],
      correctIndex: 2, order: 13, points: 1,
    },
    {
      question: '블록체인을 "공유 상태 머신(Shared State Machine)"으로 정의할 때, "상태(State)"가 포함하는 3가지 유형을 올바르게 나열한 것은?',
      options: [
        '잔액 상태 / 소유권 상태 / 규칙 상태(컨트랙트 변수)',
        '입금 내역 / 출금 내역 / 수수료 내역',
        '트랜잭션 기록 / 블록 헤더 / 머클 트리',
        '노드 목록 / 검증자 목록 / 블록 높이',
      ],
      correctIndex: 0, order: 14, points: 1,
    },
    {
      question: '다음 중 블록체인에서 "합의(Consensus)"의 역할을 가장 정확하게 설명한 것은?',
      options: [
        '트랜잭션의 내용이 올바른지 수학적으로 검증하는 과정',
        '스마트컨트랙트 코드를 실행하는 가상 머신',
        '블록 생성자를 무작위로 선발하는 알고리즘',
        '트랜잭션의 순서를 고정해 모든 노드가 동일한 상태에 도달하게 만드는 규칙',
      ],
      correctIndex: 3, order: 15, points: 1,
    },

    // ━━━ 과목 2. WEB3 기초 구조의 이해 (16~40번) ━━━
    {
      question: 'WEB3에서 "소유권"의 본질을 가장 정확하게 설명한 것은?',
      options: [
        '내 이름으로 계정이 등록되어 있는 것',
        '블록체인에 자산 보유 기록이 남아 있는 것',
        '이 주소의 상태를 바꿀 수 있는 키(개인키)를 통제하는 것',
        '거래소에 회원가입이 되어 있는 것',
      ],
      correctIndex: 2, order: 16, points: 1,
    },
    {
      question: 'WEB3에서 "서명(Signature)"이 구조적으로 증명하는 것으로 가장 적절한 것은?',
      options: [
        '이 키의 소유자가 해당 행동을 승인했다는 것(키 통제권)',
        '서명자의 법적 실명 신원',
        '트랜잭션 내용이 변조되지 않았다는 것만',
        '서명자가 해당 자산을 법적으로 소유한다는 것',
      ],
      correctIndex: 0, order: 17, points: 1,
    },
    {
      question: '"키 기반 소유권은 자유를 주지만 복구를 빼고 주는 자유다"라는 문장이 의미하는 것으로 가장 적절한 것은?',
      options: [
        'WEB3는 자산을 자유롭게 이동할 수 있지만 세금이 부과된다.',
        'WEB3 지갑은 오프라인에서는 사용할 수 없다.',
        '키 분실 시 정부 기관에 신고하면 복구할 수 있다.',
        '키를 잃으면 복구가 매우 어렵고, 기관의 구제/분쟁조정 패키지가 없다는 구조적 특성이다.',
      ],
      correctIndex: 3, order: 18, points: 1,
    },
    {
      question: '트랜잭션(Transaction)의 구조적 정의로 가장 적절한 것은?',
      options: [
        '블록체인에 저장된 거래 내역 기록',
        '키로 서명된 상태 변경 요청(명령 패킷)',
        '네트워크 참여자들이 동의한 합의 결과',
        '스마트컨트랙트가 자동으로 생성하는 이벤트',
      ],
      correctIndex: 1, order: 19, points: 1,
    },
    {
      question: '트랜잭션 구성요소 중 "Nonce"의 역할로 옳은 것은?',
      options: [
        '트랜잭션을 암호화하는 키',
        '가스비를 결정하는 값',
        '동일 계정에서 발생한 트랜잭션의 순서를 보장하고 재전송을 막는 일련번호',
        '수신자 주소를 식별하는 식별자',
      ],
      correctIndex: 2, order: 20, points: 1,
    },
    {
      question: '트랜잭션 구성요소 중 "Data" 필드의 역할에 대한 설명으로 가장 적절한 것은?',
      options: [
        '컨트랙트 호출 시 함수 선택자와 인자를 담아 실제 WEB3 행동을 지정하는 핵심 필드',
        '트랜잭션 전송 금액(ETH)을 담는 필드',
        '트랜잭션 발신자 주소를 담는 필드',
        '블록체인 네트워크를 식별하는 필드',
      ],
      correctIndex: 0, order: 21, points: 1,
    },
    {
      question: 'EOA에서 EOA로 직접 ETH를 전송하는 트랜잭션(송금)과 EOA에서 컨트랙트를 호출하는 트랜잭션(호출)의 차이로 옳은 것은?',
      options: [
        '송금은 가스가 필요하고, 호출은 가스가 필요 없다.',
        '송금은 Data 필드가 주로 비어있고 잔액 이동이 중심이며, 호출은 Data에 함수 정보가 담겨 코드 실행이 이루어진다.',
        '송금은 서명이 필요 없고, 호출은 서명이 필요하다.',
        '송금은 실패할 수 없고, 호출은 항상 실패 가능성이 있다.',
      ],
      correctIndex: 1, order: 22, points: 1,
    },
    {
      question: '트랜잭션 실행 결과로 생성되는 3가지 결과물을 올바르게 나열한 것은?',
      options: [
        '블록 헤더 / 머클 루트 / 노드 목록',
        '서명값 / 해시값 / 타임스탬프',
        '가스비 / 수수료 / 수신자 잔액',
        '상태(State) / 영수증(Receipt) / 로그(Logs)',
      ],
      correctIndex: 3, order: 23, points: 1,
    },
    {
      question: '지갑(Wallet)의 정의로 가장 적절한 것은?',
      options: [
        '코인과 토큰이 물리적으로 저장되는 보관함',
        '블록체인 계정을 생성하고 관리하는 기관 서비스',
        '거래소와 연결된 자산 이동 플랫폼',
        '키 관리 + 정책 엔진 + 행동 인터페이스가 결합된 도구로, 자산이 아닌 서명 권한을 관리',
      ],
      correctIndex: 3, order: 24, points: 1,
    },
    {
      question: '"지갑에 코인이 들어있다"는 표현의 실제 의미를 구조적으로 정확하게 설명한 것은?',
      options: [
        '지갑 소프트웨어의 데이터베이스에 코인 정보가 저장되어 있다.',
        '내 키가 통제하는 주소의 상태(체인)에 코인이 있고, 지갑은 그 상태를 바꾸는 서명 권한을 관리한다.',
        '거래소 서버에 내 코인 보유량이 기록되어 있다.',
        '지갑 앱의 화면에 잔액이 표시되어 있다.',
      ],
      correctIndex: 1, order: 25, points: 1,
    },
    {
      question: '수탁형(Custodial) 지갑과 비수탁형(Non-custodial) 지갑의 핵심 차이는?',
      options: [
        '수탁형은 서비스가 키를 보관해 통제권을 갖고, 비수탁형은 사용자가 직접 키를 보유·통제한다.',
        '수탁형은 모바일 앱이고, 비수탁형은 하드웨어 장치다.',
        '수탁형은 DeFi 연결이 가능하고, 비수탁형은 중앙화 거래소만 사용 가능하다.',
        '수탁형은 무료이고, 비수탁형은 유료 서비스다.',
      ],
      correctIndex: 0, order: 26, points: 1,
    },
    {
      question: '주소(Address)의 구조적 정의로 가장 적절한 것은?',
      options: [
        '사용자의 법적 신원을 나타내는 식별자',
        '지갑 소프트웨어가 발급하는 사용자 ID',
        '블록체인 네트워크에 접속하는 IP 주소',
        '키가 통제하는 상태(State)의 좌표(식별자)',
      ],
      correctIndex: 3, order: 27, points: 1,
    },
    {
      question: '주소-키-서명-상태의 관계를 순서대로 올바르게 나열한 것은?',
      options: [
        '주소 생성 → 서명 생성 → 키 생성 → 상태 변화',
        '상태 조회 → 주소 선택 → 서명 요청 → 키 생성',
        '서명 생성 → 키 확인 → 주소 등록 → 상태 기록',
        '키 보유 → 서명 생성 → 네트워크 검증 → 해당 주소의 상태 변화',
      ],
      correctIndex: 3, order: 28, points: 1,
    },
    {
      question: '다음 주소 관련 대표 실수 중, "클립보드 악성코드"와 관련된 것은?',
      options: [
        '잘못된 체인/네트워크로 전송',
        '컨트랙트 주소를 개인 주소로 착각',
        '복사-붙여넣기 후 주소가 변조되어 다른 주소로 전송',
        '주소 라벨링을 하지 않아 반복 실수 발생',
      ],
      correctIndex: 2, order: 29, points: 1,
    },
    {
      question: '트랜잭션 결과에서 "revert"의 구조적 정의로 가장 적절한 것은?',
      options: [
        '트랜잭션이 블록에 포함되기 전에 네트워크에서 거부된 것',
        '실행 중 조건 불충족으로 핵심 상태 변경이 되돌려지고 멈춘 것(단, 가스 소모와 영수증은 남음)',
        '사용자가 트랜잭션 전송 전에 취소한 것',
        '가스 가격이 낮아 블록 포함이 지연된 상태',
      ],
      correctIndex: 1, order: 30, points: 1,
    },
    {
      question: '트랜잭션이 실패(revert)하더라도 반드시 남는 것으로 옳게 묶인 것은?',
      options: [
        '상태 변화 / 토큰 이동 / 영수증',
        '상태 변화 / 로그 / 토큰 이동',
        '가스 소모 / 영수증(Receipt) / "누가 무엇을 하려 했는가"의 의도(Intent)',
        '가스 소모 / 토큰 이동 / 컨트랙트 스토리지 변경',
      ],
      correctIndex: 2, order: 31, points: 1,
    },
    {
      question: '"성공인데 손해"인 트랜잭션 사례로 가장 적절한 것은?',
      options: [
        '가스 부족으로 revert된 트랜잭션',
        'nonce 불일치로 전파에 실패한 트랜잭션',
        '네트워크 혼잡으로 오래 pending 상태인 트랜잭션',
        '잘못된 주소로 송금이 완료된 트랜잭션',
      ],
      correctIndex: 3, order: 32, points: 1,
    },
    {
      question: '가스(Gas)의 3가지 핵심 역할을 올바르게 나열한 것은?',
      options: [
        '자원 계량 / 실행 상한 / 우선순위·시장 메커니즘',
        '트랜잭션 암호화 / 블록 생성 보상 / 네트워크 수수료',
        '사용자 인증 / 자원 계량 / 합의 결정',
        '블록 크기 제한 / 트랜잭션 순서 결정 / 스팸 방지',
      ],
      correctIndex: 0, order: 33, points: 1,
    },
    {
      question: 'Gas Limit(가스 한도)와 Gas Used(가스 사용량)의 관계를 올바르게 설명한 것은?',
      options: [
        'Gas Limit는 실제 소비량이고, Gas Used는 사용자가 허용한 상한이다.',
        '둘은 항상 동일한 값이다.',
        'Gas Limit는 네트워크가 결정하고, Gas Used는 사용자가 결정한다.',
        'Gas Limit는 사용자가 해당 트랜잭션에 허용한 최대 실행량이고, Gas Used는 실제 실행에 소비된 양이다.',
      ],
      correctIndex: 3, order: 34, points: 1,
    },
    {
      question: '가스 비용이 존재하는 구조적 이유로 가장 적절한 것은?',
      options: [
        '블록체인 개발사의 수익 모델이기 때문이다.',
        '실행 자원 소비를 계량하고, 무한 루프 등 악의적 자원 독점을 막으며, 블록 공간 경쟁을 시장으로 해결하기 위해서다.',
        '트랜잭션 처리 속도를 높이기 위한 인센티브이기 때문이다.',
        '법적 의무에 따라 수수료를 부과해야 하기 때문이다.',
      ],
      correctIndex: 1, order: 35, points: 1,
    },
    {
      question: 'EOA(Externally Owned Account)와 컨트랙트 계정의 핵심 차이를 올바르게 설명한 것은?',
      options: [
        'EOA는 잔액을 가질 수 있고, 컨트랙트 계정은 잔액을 가질 수 없다.',
        'EOA는 코드를 가질 수 있고, 컨트랙트는 코드를 가질 수 없다.',
        'EOA는 스마트컨트랙트를 호출할 수 없고, 컨트랙트만 다른 컨트랙트를 호출할 수 있다.',
        'EOA는 개인키(서명)로 통제되며 트랜잭션을 시작하고, 컨트랙트 계정은 코드(규칙)로 통제되며 호출될 때만 실행된다.',
      ],
      correctIndex: 3, order: 36, points: 1,
    },
    {
      question: '"스마트컨트랙트는 자동으로 실행된다"는 표현이 구조적으로 부정확한 이유는?',
      options: [
        '블록체인에는 백그라운드 이벤트 루프가 없어, 컨트랙트는 트랜잭션 호출이 있을 때만 실행되기 때문이다.',
        '스마트컨트랙트는 법적 효력이 없기 때문이다.',
        '스마트컨트랙트는 배포 후 수정할 수 없기 때문이다.',
        '가스 비용이 있어 항상 실행되지 않기 때문이다.',
      ],
      correctIndex: 0, order: 37, points: 1,
    },
    {
      question: '스마트컨트랙트 상태 전이(State Transition)의 3단계를 순서대로 올바르게 나열한 것은?',
      options: [
        '전이(Effects) → 검증(Checks) → 입력(Input)',
        '검증(Checks) → 입력(Input) → 전이(Effects)',
        '입력(Input) → 전이(Effects) → 검증(Checks)',
        '입력(Input) → 검증(Checks) → 전이(Effects)',
      ],
      correctIndex: 3, order: 38, points: 1,
    },
    {
      question: '네이티브 코인(ETH 등)과 토큰(ERC-20 등)의 구조적 차이를 올바르게 설명한 것은?',
      options: [
        '코인은 온라인에서만 이동하고, 토큰은 오프라인에서도 이동할 수 있다.',
        '코인은 프로토콜이 직접 발행·관리하며 체인 상태가 직접 변하고, 토큰은 스마트컨트랙트가 내부 장부(매핑)를 통해 관리한다.',
        '코인은 가격이 있고, 토큰은 가격이 없다.',
        '코인은 전송 시 가스가 필요 없고, 토큰 전송에만 가스가 필요하다.',
      ],
      correctIndex: 1, order: 39, points: 1,
    },
    {
      question: 'ERC-20(대체 가능 토큰)과 ERC-721(NFT, 대체 불가능 토큰)의 핵심 차이를 올바르게 설명한 것은?',
      options: [
        'ERC-20은 그림 파일이고, ERC-721은 텍스트 파일이다.',
        'ERC-20은 이더리움에서만 사용 가능하고, ERC-721은 모든 체인에서 사용 가능하다.',
        'ERC-20은 각 단위가 동일한 가치를 가져 "얼마나"로 관리하고, ERC-721은 각 토큰이 고유한 ID를 가져 "어떤 것"으로 관리한다.',
        'ERC-20은 발행이 불가능하고, ERC-721만 발행(Mint)이 가능하다.',
      ],
      correctIndex: 2, order: 40, points: 1,
    },
  ];

  await db.insert(examQuestions).values(
    questions.map((q) => ({
      examId: exam.id,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      order: q.order,
      points: q.points,
    }))
  );

  console.log(`Created ${questions.length} questions`);
  console.log('Exam ID (시험 응시 URL에 사용):', exam.id);
  console.log('Seed complete!');
}

seedExamBasic1()
  .catch(console.error)
  .finally(() => pool.end());
