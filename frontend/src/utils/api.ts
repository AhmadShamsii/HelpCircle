import axios from "axios";
import { getSession } from "next-auth/react";

const backend =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:5000";

export async function apiClient(tokenOverride?: string) {
  let token = tokenOverride;
  if (!token) {
    const session = await getSession();
    token = (session as any)?.accessToken;
  }
  const instance = axios.create({
    baseURL: backend.replace(/\/+$/, "") + "/api",
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      "Content-Type": "application/json",
    },
  });
  return instance;
}
