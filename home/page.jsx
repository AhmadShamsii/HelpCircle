"use client";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Table, Spin, message, Button } from "antd";
import { useRouter } from "next/navigation";
import axios from "axios";

const backend =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:5000";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();


  console.log("[Dashboard] session status:", status);
  console.log("[Dashboard] accessToken present:", !!(session as any)?.accessToken);

  const fetchUsers = async () => {
    if (!(session as any)?.accessToken) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${backend}/api/users`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      
      const data = await res.json();
      console.log(data);
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((session as any)?.accessToken) {
      fetchUsers();
    }
  }, [session]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl">Users</h1>
        <Button danger onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
          Logout
        </Button>
      </div>

      <Table
        rowKey="_id"
        dataSource={users}
        loading={loading}
        columns={[
          { title: "Name", dataIndex: "name", key: "name" },
          { title: "Email", dataIndex: "email", key: "email" },
          {
            title: "Verified",
            dataIndex: "isVerified",
            key: "isVerified",
            render: (v) => (v ? "Yes" : "No"),
          },
        ]}
      />
    </div>
  );
}