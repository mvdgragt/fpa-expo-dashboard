import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../lib/useAuth";

export const RequireAuth = () => {
  const { isLoading, session, role } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-full bg-slate-950 text-slate-50">
        <div className="mx-auto flex min-h-full max-w-lg items-center justify-center px-6 py-16">
          <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-sm font-semibold">Loading…</div>
            <div className="mt-2 text-sm text-slate-400">
              Checking session and permissions.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
