'use client';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { apiClient } from './../../utils/api';
import { Table, Spin, message, Button } from 'antd';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
  }, [session, status]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const client = await apiClient();
        const resp = await client.get('/users');
        setUsers(resp.data.users);
      } catch (err) {
        message.error(err?.response?.data?.message || 'Failed to fetch users');
      } finally { setLoading(false); }
    })();
  }, []);

  if (status === 'loading' || !session) return <div className="min-h-screen flex items-center justify-center"><Spin /></div>;

  return (
    <div className="p-8">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl">Users</h1>
        <Button danger onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
          Logout
        </Button>
      </div>

      <Table
        rowKey="_id"
        dataSource={users}
        loading={loading}
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Email', dataIndex: 'email', key: 'email' },
          {
            title: 'Verified',
            dataIndex: 'isVerified',
            key: 'isVerified',
            render: (v) => (v ? 'Yes' : 'No'),
          },
        ]}
      />
    </div>
  );
}
