import { Link } from 'react-router-dom'

import { supabase } from '../../lib/supabase'

export const UnauthorizedPage = () => {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-0px)] max-w-lg items-center justify-center px-6">
      <div className="w-full rounded-2xl border border-slate-200/10 bg-slate-950 p-6">
        <div className="text-xl font-semibold">Unauthorized</div>
        <div className="mt-2 text-sm text-slate-400">
          This account is not assigned as club staff/coach or admin.
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </button>
          <Link
            to="/login"
            className="inline-flex h-11 items-center rounded-xl border border-slate-800 px-4 text-sm font-semibold text-slate-200"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
