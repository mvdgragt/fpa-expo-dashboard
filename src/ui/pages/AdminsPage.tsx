import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAdmin,
  deleteAdmin,
  listAdmins,
  updateAdminEmail,
  type AdminRow,
} from "../../lib/api/admins";
import { useAuth } from "../../lib/useAuth";

export const AdminsPage = () => {
  const { role } = useAuth();
  const qc = useQueryClient();

  const [email, setEmail] = useState("");

  const canManage = role === "admin";

  const adminsQuery = useQuery({
    enabled: canManage,
    queryKey: ["admins"],
    queryFn: () => listAdmins({ limit: 1000 }),
  });

  const createMutation = useMutation({
    mutationFn: async (args: { email: string }) => {
      await createAdmin({ email: args.email });
    },
    onSuccess: async () => {
      setEmail("");
      await qc.invalidateQueries({ queryKey: ["admins"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (args: { oldEmail: string; newEmail: string }) => {
      await updateAdminEmail({
        oldEmail: args.oldEmail,
        newEmail: args.newEmail,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admins"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (args: { email: string }) => {
      await deleteAdmin({ email: args.email });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admins"] });
    },
  });

  const errorMessage = useMemo(() => {
    const e =
      adminsQuery.error ||
      createMutation.error ||
      updateMutation.error ||
      deleteMutation.error;
    if (!e) return "";
    return e instanceof Error ? e.message : String(e);
  }, [
    adminsQuery.error,
    createMutation.error,
    updateMutation.error,
    deleteMutation.error,
  ]);

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="text-sm font-semibold text-slate-100">Admins</div>
        <div className="mt-2 text-sm text-rose-300">Not allowed.</div>
      </div>
    );
  }

  const rows = adminsQuery.data || [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-100">Admins</div>
            <div className="mt-1 text-sm text-slate-400">Manage admins.</div>
            {errorMessage ? (
              <div className="mt-3 text-xs text-rose-300">{errorMessage}</div>
            ) : null}
          </div>

          <div className="flex w-full max-w-xl flex-col gap-2 md:flex-row md:items-end">
            <label className="block w-full">
              <div className="mb-1 text-xs font-medium text-slate-300">
                Email
              </div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
                placeholder="name@domain.com"
                autoComplete="email"
              />
            </label>
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => {
                const v = email.trim().toLowerCase();
                if (!v || !v.includes("@")) return;
                createMutation.mutate({ email: v });
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 px-4 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {createMutation.isPending ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2">
        {adminsQuery.isLoading ? (
          <div className="p-6 text-sm text-slate-300">Loading…</div>
        ) : adminsQuery.error ? (
          <div className="p-6 text-sm text-rose-300">
            Could not load admins.
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-slate-300">No admins found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: AdminRow) => (
                  <tr key={r.user_id} className="border-t border-slate-900">
                    <td className="px-4 py-3 text-slate-200">
                      {r.email || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {r.user_id}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={updateMutation.isPending || !r.email}
                          onClick={() => {
                            if (!r.email) return;
                            const next =
                              window.prompt("New email", r.email) || "";
                            const v = next.trim().toLowerCase();
                            if (!v || !v.includes("@")) return;
                            if (v === r.email.trim().toLowerCase()) return;
                            updateMutation.mutate({
                              oldEmail: r.email,
                              newEmail: v,
                            });
                          }}
                          className="inline-flex h-9 items-center rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-200 disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            const label = r.email || r.user_id;
                            const ok = window.confirm(`Delete admin ${label}?`);
                            if (!ok) return;
                            if (!r.email) {
                              alert(
                                "This admin row has no email resolved. You can still remove it by deleting the row in Supabase directly.",
                              );
                              return;
                            }
                            deleteMutation.mutate({ email: r.email });
                          }}
                          className="inline-flex h-9 items-center rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-rose-200 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
