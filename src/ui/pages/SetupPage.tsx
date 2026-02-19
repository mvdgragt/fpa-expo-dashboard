import { envConfigError } from '../../lib/env'

export const SetupPage = () => {
  return (
    <div className="min-h-full bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center px-6 py-16">
        <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-xl font-semibold">Dashboard setup</div>
          <div className="mt-2 text-sm text-slate-400">{envConfigError}</div>

          <div className="mt-6 space-y-3">
            <div className="text-sm font-semibold">1) Create a local env file</div>
            <pre className="overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-200">
{`cp .env.example .env`}
            </pre>

            <div className="text-sm font-semibold">2) Fill in Supabase values</div>
            <pre className="overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-200">
{`VITE_SUPABASE_URL=...\nVITE_SUPABASE_ANON_KEY=...`}
            </pre>

            <div className="text-sm font-semibold">3) Restart dev server</div>
            <pre className="overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-200">
{`npm run dev`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
