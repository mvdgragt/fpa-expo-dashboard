export const OverviewPage = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="text-sm font-semibold text-slate-100">Overview</div>
        <div className="mt-1 text-sm text-slate-400">
          This will show club-wide activity, top performers per station, and recent tests.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard title="Tests (7d)" value="—" />
        <KpiCard title="Active athletes" value="—" />
        <KpiCard title="Stations" value="6" />
      </div>
    </div>
  )
}

const KpiCard = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
      <div className="text-xs font-medium text-slate-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</div>
    </div>
  )
}
