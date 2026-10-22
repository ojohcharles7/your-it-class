export default function CourseLoading() {
  return (
    <div className="wrap-wide py-10">
      <div className="skeleton h-4 w-24" />
      <div className="mt-5 grid gap-7 lg:grid-cols-[1.55fr_0.85fr] lg:items-start">
        <div className="min-w-0 space-y-6">
          <div className="glass overflow-hidden">
            <div className="skeleton h-52 rounded-none sm:h-64" />
            <div className="space-y-3 p-6">
              <div className="skeleton h-8 w-2/3" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-4/5" />
              <div className="skeleton mt-4 h-4 w-1/2" />
            </div>
          </div>
          <div className="skeleton h-64 w-full rounded-[22px]" />
          <div className="skeleton h-48 w-full rounded-[22px]" />
        </div>
        <div className="space-y-4">
          <div className="skeleton h-72 w-full rounded-[22px]" />
          <div className="skeleton h-40 w-full rounded-[22px]" />
        </div>
      </div>
    </div>
  );
}
