interface Props {
  redirectTo?: string;
}

export default function KakaoLoginButton({ redirectTo }: Props) {
  function handleClick() {
    if (redirectTo && redirectTo !== '/') {
      sessionStorage.setItem('auth_redirect', redirectTo);
    }
  }

  return (
    <a
      href="/api/v1/auth/kakao"
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-cc font-semibold text-sm transition-all duration-300 cursor-pointer"
      style={{ backgroundColor: '#FEE500', color: '#000000' }}
    >
      <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M20 4C10.058 4 2 10.701 2 18.97c0 5.206 3.274 9.783 8.2 12.498L8.2 36l6.58-3.478A23.064 23.064 0 0020 32.94c9.942 0 18-6.701 18-14.97S29.942 4 20 4z" fill="#000000"/>
      </svg>
      카카오로 로그인
    </a>
  );
}
