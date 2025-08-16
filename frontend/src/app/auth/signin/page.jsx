'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Button, Form, Input, Typography, message, Checkbox, Card } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const res = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
        remember: values.remember ? 'true' : 'false',
        callbackUrl: `${window.location.origin}/home`
      });

      if (res?.error) {
        // res.error will contain backend message thrown in authorize()
        message.error(res.error);
      } else {
        message.success('Signed in');
        router.push('/home');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md" title={<Typography.Title level={3} className="m-0">Sign In</Typography.Title>}>
        <Form onFinish={onFinish} layout="vertical" autoComplete="off">
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Email required' }]}> 
            <Input type="email" autoComplete="email" allowClear />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Password required' }]}> 
            <Input.Password autoComplete="current-password" allowClear />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked" initialValue={false}> 
            <Checkbox>Remember me</Checkbox>
          </Form.Item>
          <Form.Item>
            <Button loading={loading} type="primary" htmlType="submit" block>
              Sign in
            </Button>
          </Form.Item>
          <div className="flex gap-2 items-center">
            <Button icon={<GoogleOutlined />} onClick={() => signIn('google')}>Sign in with Google</Button>
            <Link href="/auth/register">Register</Link>
            <Link href="/auth/forgot">Forgot password?</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
