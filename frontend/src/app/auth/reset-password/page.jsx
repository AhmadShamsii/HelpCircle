'use client';
import { useEffect, useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function ResetPassword() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Safe base getter — works in client and server builds and has a sane fallback
  const getApiBase = () => {
    // Only NEXT_PUBLIC_* vars are available in the browser
    const clientEnv = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_BACKEND_URL : undefined;
    const serverEnv = process.env.BACKEND_URL; // server-side fallback (not used in client)
    const base = clientEnv || serverEnv || 'http://localhost:5000';
    return String(base).replace(/\/+$/, ''); // remove trailing slashes
  };

  useEffect(() => {
    // parse token+email from URL once on mount
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get('token');
      const emailParam = params.get('email');

      if (tokenParam) setToken(tokenParam);
      if (emailParam) setEmail(emailParam);

      // debug output so you can see the base and params in the browser console
      console.log('[reset-password] api base =', getApiBase());
      console.log('[reset-password] token =', tokenParam);
      console.log('[reset-password] email =', emailParam);
    }
  }, []);

  const onFinish = async ({ password }) => {
    // prevent calling backend with empty token/email
    if (!token || !email) {
      message.error('Invalid or expired reset link. Please request a new reset email.');
      router.push('/auth/forgot'); // or /auth/forgot-password depending on your routing
      return;
    }

    const base = getApiBase();
    const url = `${base}/api/auth/reset-password`; // absolute URL

    try {
      setLoading(true);
      const resp = await axios.post(url, {
        token,
        email,
        newPassword: password
      }, { timeout: 15000 });

      message.success(resp.data?.message || 'Password reset successful');
      router.push('/auth/signin');
    } catch (err) {
      console.error('[reset-password] error', err?.response?.data || err);
      const errMsg = err?.response?.data?.message || err?.message || 'Error resetting password';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white shadow">
        <h2 className="text-xl mb-4">Reset Password</h2>
        <Form onFinish={onFinish}>
          <Form.Item name="password" rules={[{ required: true, message: 'Please enter a new password' }]}>
            <Input.Password placeholder="New password" />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" loading={loading} type="primary">
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
