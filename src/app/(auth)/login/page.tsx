"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import styles from "./login.module.css";

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
      redirect: true,
      callbackUrl: "/dashboard",
      email,
      password,
      tenant
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    // When redirect is true, NextAuth will navigate automatically. Fallback for safety:
    router.push("/dashboard");
  };

  return (
    <div className={styles.root}>
      {/* Left brand panel */}
      <div className={styles.leftPanel} />

      {/* Right panel */}
      <div className={styles.rightPanel}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <span className={styles.topBarText}>Not registered yet?</span>
          <a className={styles.topBarButton} href="#">
            Register
          </a>
          <button className={styles.topBarLang}>🇬🇧</button>
        </div>

        <div className={styles.content}>
          <div className={styles.formWrapper}>
            <div className="text-center mb-10">
              <h1 className={styles.title}>Sign in to the seller&apos;s panel</h1>
            </div>

            <form className={styles.formGrid} onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className={styles.label}>Login</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={styles.input}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <div className={styles.hintRow}>
                  <span>Password</span>
                  <a href="#" className={styles.hintLink}>
                    Remind password
                  </a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={styles.input}
                  placeholder="********"
                />
              </div>

              <div className="space-y-2">
                <label className={styles.label}>Tenant</label>
                <input
                  type="text"
                  value={tenant}
                  onChange={(e) => setTenant(e.target.value)}
                  required
                  className={styles.input}
                  placeholder="demo"
                />
                <p className="text-xs text-slate-500">Use tenant slug (e.g. demo)</p>
              </div>

              {error ? <p className={styles.error}>{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className={styles.primaryButton}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <div className={styles.divider}>
                <div className={styles.dividerLine} />
                <span>or</span>
                <div className={styles.dividerLine} />
              </div>

              <button
                type="button"
                className={styles.secondaryButton}
              >
                ▢ Sign in with QR Code
              </button>

              <p className={styles.footerHint}>
                Dev user: admin@yentral.local / Admin123! · tenant: demo
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
