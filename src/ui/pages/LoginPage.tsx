import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../lib/useAuth";
import { supabase } from "../../lib/supabase";

export const LoginPage = () => {
  const { session, role } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  if (session && role) {
    return <Navigate to="/" replace />;
  }

  const sendCode = async () => {
    setError(null);
    if (!normalizedEmail) {
      setError("Enter your email");
      return;
    }

    setIsLoading(true);
    try {
      const { error: e } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
      });
      if (e) {
        setError(e.message || "Could not send code");
        return;
      }
      setStage("otp");
    } finally {
      setIsLoading(false);
    }
  };

  const verify = async () => {
    setError(null);
    const token = otp.trim();
    if (!normalizedEmail) {
      setError("Enter your email");
      return;
    }
    if (!token) {
      setError("Enter the code you received");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: e } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: "email",
      });

      if (e || !data.session) {
        setError(e?.message || "Invalid code");
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-0px)] max-w-md items-center justify-center px-6">
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="mb-6">
          <div className="text-xl font-semibold">Sign in</div>
          <div className="mt-1 text-sm text-slate-400">
            Coaches and admins only
          </div>
        </div>

        <div className="space-y-3">
          <label className="block">
            <div className="mb-1 text-xs font-medium text-slate-300">Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || stage === "otp"}
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white outline-none focus:border-sky-500"
              placeholder="name@club.com"
              autoComplete="email"
            />
          </label>

          {stage === "otp" ? (
            <label className="block">
              <div className="mb-1 text-xs font-medium text-slate-300">
                Code
              </div>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                disabled={isLoading}
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white outline-none focus:border-sky-500"
                placeholder="123456"
                inputMode="numeric"
              />
            </label>
          ) : null}

          {error ? <div className="text-sm text-rose-400">{error}</div> : null}

          <button
            type="button"
            onClick={stage === "email" ? sendCode : verify}
            disabled={isLoading}
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {isLoading
              ? stage === "email"
                ? "Sending…"
                : "Verifying…"
              : stage === "email"
                ? "Send code"
                : "Verify"}
          </button>

          {stage === "otp" ? (
            <button
              type="button"
              onClick={() => {
                setStage("email");
                setOtp("");
              }}
              className="w-full text-center text-sm text-slate-400 hover:text-slate-200"
            >
              Change email
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
