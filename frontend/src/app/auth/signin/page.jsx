'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Button, Form, Input, Typography, message } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

const onFinish = async (values) => {
  const res = await signIn("credentials", {
    redirect: false,
    email: values.email,
    password: values.password,
    callbackUrl: `${window.location.origin}/home`
  });

  if (res?.error) {
    // res.error will contain backend message thrown in authorize()
    message.error(res.error);
  } else {
    // success
    message.success("Signed in");
    router.push("/home");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white shadow">
        <Typography.Title level={3}>Sign In</Typography.Title>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Email required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Password required' }]}>
            <Input.Password />
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
      </div>
    </div>
  );
}
