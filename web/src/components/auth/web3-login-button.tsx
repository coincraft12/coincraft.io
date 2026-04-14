'use client';

import { useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { saveToken } from '@/hooks/use-auth-init';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export default function Web3LoginButton() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'signing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { setUser, setToken } = useAuthStore();
  const router = useRouter();

  async function handleWeb3Login() {
    if (!window.ethereum) {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = 'https://metamask.app.link/dapp/coincraft.io';
        return;
      }
      setErrorMsg('MetaMask가 설치되어 있지 않습니다.');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setErrorMsg('');

    try {
      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      const address = accounts[0];

      setStatus('signing');
      const { data: { nonce } } = await apiClient.get<{ data: { nonce: string } }>(
        `/api/v1/auth/web3/nonce?address=${address}`
      );

      const message = `CoinCraft에 로그인합니다.\n\n주소: ${address}\nNonce: ${nonce}`;
      const signature = (await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      })) as string;

      const res = await apiClient.post<{ data: { accessToken: string; user: any } }>(
        '/api/v1/auth/web3/verify',
        { message, signature }
      );

      saveToken(res.data.accessToken);
      setToken(res.data.accessToken);
      setUser(res.data.user);
      router.replace('/');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof ApiError ? err.message : '지갑 연결에 실패했습니다.');
    }
  }

  return (
    <div>
      <button
        onClick={handleWeb3Login}
        disabled={status === 'connecting' || status === 'signing'}
        className="cc-btn cc-btn-outline w-full"
      >
        {status === 'idle' && '🦊 지갑으로 로그인 (Web3)'}
        {status === 'connecting' && '지갑 연결 중...'}
        {status === 'signing' && '서명 요청 중...'}
        {status === 'error' && '🦊 지갑으로 로그인 (Web3)'}
      </button>
      {status === 'error' && errorMsg && (
        <p className="text-red-400 text-xs mt-1">{errorMsg}</p>
      )}
    </div>
  );
}
