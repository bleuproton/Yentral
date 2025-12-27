"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const search = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("admin@yentral.local");
  const [password, setPassword] = useState("");
  const [tenant, setTenant] = useState(search.get("tenant") || "demo");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      tenant
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "80px auto",
        padding: 24,
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 10px 30px rgba(0,0,0,0.04)"
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 8, fontWeight: 600 }}>Login</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>Sign in with your email, password, and tenant slug.</p>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 6 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 6 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
          Tenant slug
          <input
            type="text"
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            required
            style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 6 }}
            placeholder="demo"
          />
        </label>
        {error ? <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 4,
            padding: "10px 14px",
            background: "#111827",
            color: "#fff",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p style={{ color: "#6b7280", fontSize: 12 }}>Default dev user: admin@yentral.local / Admin123! (tenant: demo)</p>
      </form>
    </div>
  );
}
