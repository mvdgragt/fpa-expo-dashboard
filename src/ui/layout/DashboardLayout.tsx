import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  Home,
  ListChecks,
  LogOut,
  Settings,
  Trophy,
  Users,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/cn";
import { useActiveClub } from "../../lib/useActiveClub";

export const DashboardLayout = () => {
  const activeClub = useActiveClub();

  return (
    <div className="min-h-full bg-slate-950 text-slate-50">
      <div className="mx-auto grid min-h-full max-w-[1600px] grid-cols-[260px_1fr] gap-0">
        <aside className="border-r border-slate-800 bg-slate-950">
          <div className="flex h-16 items-center gap-2 px-4">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400" />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide">FPA</div>
              <div className="text-xs text-slate-400">Coach Dashboard</div>
            </div>
          </div>

          <nav className="px-2 pb-4">
            <NavItem
              to="/"
              icon={<Home className="h-4 w-4" />}
              label="Overview"
            />
            <NavItem
              to="/results"
              icon={<ListChecks className="h-4 w-4" />}
              label="Results"
            />
            <NavItem
              to="/benchmarks"
              icon={<BarChart3 className="h-4 w-4" />}
              label="Benchmarks"
            />
            <NavItem
              to="/leaderboard"
              icon={<Trophy className="h-4 w-4" />}
              label="Leaderboard"
            />
            <NavItem
              to="/athletes"
              icon={<Users className="h-4 w-4" />}
              label="Athletes"
            />
            <NavItem
              to="/sports"
              icon={<Settings className="h-4 w-4" />}
              label="Sports"
            />

            <button
              type="button"
              className="mt-4 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-10 h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="flex h-full items-center justify-between px-6">
              <div className="text-sm text-slate-300">
                Sporty, functional performance tracking.
              </div>
              <div className="flex items-center gap-3">
                {activeClub.isAdmin ? (
                  <label className="hidden items-center gap-2 md:flex">
                    <span className="text-xs text-slate-400">Club</span>
                    <select
                      value={activeClub.clubId}
                      onChange={(e) => activeClub.setClubId(e.target.value)}
                      className="h-9 max-w-[320px] rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs text-white"
                    >
                      {(activeClub.clubs || []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {(c.code_4 ? `${c.code_4} · ` : "") +
                            (c.name || c.id)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <div className="text-xs text-slate-500">v0</div>
              </div>
            </div>
          </header>

          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const NavItem = ({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) => {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
          isActive
            ? "bg-slate-900 text-white"
            : "text-slate-200 hover:bg-slate-900",
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
};
