export default function AdminLoading() {
  return (
    <div className="space-y-5">
      <div>
        <div className="skeleton h-3 w-20" />
        <div className="skeleton mt-2 h-8 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="admin-card p-4">
            <div className="skeleton h-9 w-9" />
            <div className="skeleton mt-3 h-7 w-16" />
            <div className="skeleton mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="skeleton h-64 w-full rounded-[22px]" />
      <div className="skeleton h-48 w-full rounded-[22px]" />
    </div>
  );
}
