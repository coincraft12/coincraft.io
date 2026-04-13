interface Props {
  redirectTo?: string;
}

export default function GoogleLoginButton({ redirectTo }: Props) {
  function handleClick() {
    if (redirectTo && redirectTo !== '/') {
      sessionStorage.setItem('auth_redirect', redirectTo);
    }
  }

  return (
    <a
      href="/api/v1/auth/google"
      onClick={handleClick}
      className="cc-btn cc-btn-outline w-full flex items-center gap-3"
    >
      <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M43.6 20.5H42V20H24v8h11.3C34 32.7 29.5 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.3 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.9 0 19.7-7.9 19.7-20 0-1.2-.1-2.4-.1-3.5z" fill="#FFC107"/>
        <path d="M6.3 14.7l6.6 4.8C14.6 16.1 18.9 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.3 7.5 29.4 5 24 5 16.3 5 9.7 9 6.3 14.7z" fill="#FF3D00"/>
        <path d="M24 44c5.3 0 10.1-2 13.7-5.2l-6.3-5.3C29.5 35.3 26.9 36 24 36c-5.5 0-10-3.3-11.3-8H6.1C9.4 37.5 16.2 44 24 44z" fill="#4CAF50"/>
        <path d="M43.6 20.5H42V20H24v8h11.3c-.6 1.8-1.7 3.4-3.2 4.6l6.3 5.3C44 34.5 44 24 43.6 20.5z" fill="#1976D2"/>
      </svg>
      Google로 로그인
    </a>
  );
}
