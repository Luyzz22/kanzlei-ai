export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#003856]" />
        <p className="mt-4 text-[13px] text-gray-400">Dashboard wird geladen...</p>
      </div>
    </div>
  )
}
