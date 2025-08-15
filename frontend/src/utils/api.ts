import axios from "axios";
import { getSession } from "next-auth/react";

const backend =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:5000";

export async function apiClient() {
  const session = await getSession();
  const token = (session as any)?.accessToken;
  const base = String(backend).replace(/\/+$/, "");
  const instance = axios.create({
    baseURL: base + "/api",
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      "Content-Type": "application/json",
    },
  });
  return instance;
}
