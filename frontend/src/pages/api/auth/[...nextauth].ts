// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google"; // keep if needed
import type { NextAuthOptions } from "next-auth";

// Helper to get server-side backend URL
const getBackendBase = () => {
  // use BACKEND_URL (server-side) first, fallback to NEXT_PUBLIC_BACKEND_URL, then default
  const base = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  return String(base).replace(/\/+$/, "");
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // sanity check
        if (!credentials) throw new Error("Missing credentials");

        const base = getBackendBase();
        const loginUrl = `${base}/api/auth/login`;

        // Debug log so you can verify server-side envs
        console.log("[NextAuth.authorize] calling login URL:", loginUrl);

        // Use node fetch (available in Node 18+/Next); axios is also fine
        const res = await fetch(loginUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            remember: credentials.remember === 'true'
          })
        });

        let data;
        try {
          data = await res.json();
        } catch (e) {
          console.error("[NextAuth.authorize] failed to parse JSON from login response", e);
          throw new Error("Login failed");
        }

        if (!res.ok) {
          // If backend returns error status, bubble backend message (preferred)
          const message = data?.message || "Invalid credentials";
          console.log("[NextAuth.authorize] backend responded with non-ok:", res.status, message);
          throw new Error(message);
        }

        // Success: backend returned { token, user }
        if (!data || !data.token || !data.user) {
          throw new Error("Login failed");
        }

        // Return user object to be stored in JWT/session by NextAuth
        return {
          id: data.user.id || data.user._id,
          name: data.user.name,
          email: data.user.email,
          accessToken: data.token,
          refreshToken: data.refreshToken
        };
      }
    }),

    // keep GoogleProvider as needed...
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
    })
  ],
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
        token.accessToken = (user as any).accessToken || token.accessToken;
        token.refreshToken = (user as any).refreshToken || token.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = (token.user as any) || session.user;
      (session as any).accessToken = token.accessToken;
      (session as any).refreshToken = token.refreshToken;
      return session;
    },
    async redirect({ url, baseUrl }) {
      return baseUrl + "/home";
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin"
  }
};

export default NextAuth(authOptions);
