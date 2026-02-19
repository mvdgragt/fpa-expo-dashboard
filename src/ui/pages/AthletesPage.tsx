import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { createAthlete, listAthletes } from "../../lib/api/athletes";
import { useActiveClub } from "../../lib/useActiveClub";

export const AthletesPage = () => {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<"" | "M" | "F">("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const activeClub = useActiveClub();
  const clubId = activeClub.clubId;

  const athletesQuery = useQuery({
    enabled: !!clubId,
    queryKey: ["athletes", { clubId }],
    queryFn: () => listAthletes({ clubId: clubId || "", limit: 500 }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!clubId) throw new Error("Missing club");
      if (!firstName.trim() || !lastName.trim()) {
        throw new Error("First name and last name are required");
      }
      return createAthlete({
        clubId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob: dob || undefined,
        sex: sex || undefined,
        photoFile: photoFile || undefined,
      });
    },
    onSuccess: async () => {
      setFirstName("");
      setLastName("");
      setDob("");
      setSex("");
      setPhotoFile(null);
      await qc.invalidateQueries({ queryKey: ["athletes"] });
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = athletesQuery.data || [];
    if (!term) return rows;
    return rows.filter((a) => {
      const name = `${a.first_name || ""} ${a.last_name || ""}`
        .trim()
        .toLowerCase();
      return name.includes(term);
    });
  }, [athletesQuery.data, q]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-100">Athletes</div>
            <div className="mt-1 text-sm text-slate-400">
              Browse athletes in your club and open their performance profile.
            </div>
          </div>

          <div className="w-full md:w-80">
            <div className="mb-1 text-xs font-medium text-slate-300">
              Search
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name…"
              className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="text-sm font-semibold text-slate-100">
            Add athlete
          </div>
          <div className="mt-1 text-xs text-slate-400">Photo is optional.</div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
            <label className="block md:col-span-2">
              <div className="mb-1 text-xs font-medium text-slate-300">
                First name
              </div>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              />
            </label>

            <label className="block md:col-span-2">
              <div className="mb-1 text-xs font-medium text-slate-300">
                Last name
              </div>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              />
            </label>

            <label className="block">
              <div className="mb-1 text-xs font-medium text-slate-300">Sex</div>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as "" | "M" | "F")}
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              >
                <option value="">—</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-xs font-medium text-slate-300">DOB</div>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white"
              />
            </label>

            <label className="block md:col-span-4">
              <div className="mb-1 text-xs font-medium text-slate-300">
                Photo (optional)
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border file:border-slate-700 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-100 hover:file:bg-slate-800"
              />
            </label>

            <div className="flex items-end md:col-span-2">
              <button
                type="button"
                disabled={
                  !clubId ||
                  createMutation.isPending ||
                  !firstName.trim() ||
                  !lastName.trim()
                }
                onClick={() => createMutation.mutate()}
                className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-slate-100 disabled:opacity-50"
              >
                {createMutation.isPending ? "Creating…" : "Create athlete"}
              </button>
            </div>
          </div>

          {createMutation.error ? (
            <div className="mt-3 text-xs text-rose-300">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : String(createMutation.error)}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2">
        {activeClub.isLoading || athletesQuery.isLoading ? (
          <div className="p-6 text-sm text-slate-300">Loading…</div>
        ) : activeClub.error ? (
          <div className="p-6 text-sm text-rose-300">
            Could not load club context.
          </div>
        ) : !clubId ? (
          <div className="p-6 text-sm text-rose-300">
            No club assigned to this account (missing club_staff row).
          </div>
        ) : athletesQuery.error ? (
          <div className="p-6 text-sm text-rose-300">
            Could not load athletes.
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-slate-300">No athletes found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-3">Athlete</th>
                  <th className="px-4 py-3">Sex</th>
                  <th className="px-4 py-3">DOB</th>
                  <th className="px-4 py-3">Profile</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const name =
                    `${a.first_name || ""} ${a.last_name || ""}`.trim() || a.id;
                  return (
                    <tr key={a.id} className="border-t border-slate-900">
                      <td className="px-4 py-3 text-slate-200">{name}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {a.sex || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {a.dob || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/athletes/${a.id}`}
                          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-800"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
