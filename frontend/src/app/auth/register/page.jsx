// src/app/(public)/auth/register/page.tsx  OR pages/auth/register.tsx
'use client';
import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // safe helper for base URL (always returns a string)
  const getApiBase = () => {
    const env = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_BACKEND_URL : process.env.BACKEND_URL;
    const base = env || 'http://localhost:5000';
    return base.replace(/\/+$/, ''); // remove trailing slash(es)
  };

  const onFinish = async (values) => {
    const base = getApiBase();
    try {
      setLoading(true);
      // debug: console.log(base);
      const resp = await axios.post(`${base}/api/auth/register`, values, { timeout: 10000 });
      message.success(resp.data?.message || 'Registered. Check email to verify.');
      router.push('/auth/signin');
    } catch (err) {
      console.error('Register error', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Registration failed';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white shadow">
        <h2 className="text-xl mb-4">Register</h2>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item name="name" label="Name"><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Email required' }]}><Input /></Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Password required' }]}><Input.Password /></Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>Register</Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
