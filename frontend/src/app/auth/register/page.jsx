'use client';
import { useState } from 'react';
import { Form, Input, Button, message, Card, Typography } from 'antd';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md" title={<Typography.Title level={3} className="m-0">Register</Typography.Title>}>
        <Form onFinish={onFinish} layout="vertical" autoComplete="off">
          <Form.Item name="name" label="Name">
            <Input allowClear />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Email required' }]}> 
            <Input type="email" autoComplete="email" allowClear />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Password required' }]}> 
            <Input.Password autoComplete="new-password" allowClear />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>Register</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
