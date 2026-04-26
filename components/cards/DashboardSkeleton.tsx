export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="h-20 rounded-2xl shimmer" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl shimmer" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-80 rounded-2xl shimmer" />
        <div className="h-80 rounded-2xl shimmer" />
      </div>

      {/* Table */}
      <div className="h-96 rounded-2xl shimmer" />
    </div>
  )
}
