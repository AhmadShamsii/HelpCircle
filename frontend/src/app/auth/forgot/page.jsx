// pages/auth/forgot.tsx  OR src/app/(public)/auth/forgot/page.tsx
'use client';
import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import axios from 'axios';

export default function Forgot() {
  const [loading, setLoading] = useState(false);

  const getApiBase = () => {
    const env = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_BACKEND_URL : process.env.BACKEND_URL;
    const base = env || 'http://localhost:5000';
    return base.replace(/\/+$/, '');
  };

  const onFinish = async ({ email }) => {
    const base = getApiBase();
    try {
      setLoading(true);
      const resp = await axios.post(`${base}/api/auth/forgot-password`, { email }, { timeout: 10000 });
      message.success(resp.data?.message || 'If an account exists, a reset link was sent.');
    } catch (err) {
      console.error('Forgot password error', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Error sending reset email';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white shadow">
        <h2 className="text-xl mb-4">Forgot Password</h2>
        <Form onFinish={onFinish}>
          <Form.Item name="email" rules={[{ required: true, message: 'Email required' }]}><Input /></Form.Item>
          <Form.Item><Button htmlType="submit" type="primary" loading={loading}>Send Reset Link</Button></Form.Item>
        </Form>
      </div>
    </div>
  );
}
