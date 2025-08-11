'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { message } from 'antd';

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('Verifying...');

  const getApiBase = () => {
    // only NEXT_PUBLIC_* vars are exposed to the browser
    const env = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_BACKEND_URL : process.env.BACKEND_URL;
    const base = env || 'http://localhost:5000'; // safe fallback
    return String(base).replace(/\/+$/, ''); // remove trailing slashes
  };

  useEffect(() => {
    const token = searchParams?.get('token');
    if (!token) {
      setStatus('Invalid verification link.');
      return;
    }

    (async () => {
      const base = getApiBase();
      const url = `${base}/api/auth/verify-email`;
      console.log('[verify-email] calling', url, 'with token', token);

      try {
        // Preferred: GET with token as query param (matches backend verify handler)
        await axios.get(url, { params: { token }, timeout: 10000 });
        message.success('Email verified successfully!');
        router.push('/auth/signin');
      } catch (err) {
        console.error('[verify-email] error:', err);
        const msg = err?.response?.data?.message || 'Verification failed. Link may be expired.';
        setStatus(msg);
      }
    })();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>{status}</p>
    </div>
  );
}
