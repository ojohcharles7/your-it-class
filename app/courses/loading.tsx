export default function CoursesLoading() {
  return (
    <div className="wrap-wide py-12">
      <div className="skeleton h-3 w-28" />
      <div className="skeleton mt-3 h-10 w-72 max-w-full" />
      <div className="skeleton mt-3 h-4 w-full max-w-xl" />
      <div className="glass mt-8 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="skeleton h-11 flex-1" />
          <div className="skeleton h-11 w-full lg:w-44" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="glass overflow-hidden">
            <div className="skeleton h-40 rounded-none" />
            <div className="space-y-3 p-4">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-4/5" />
              <div className="skeleton mt-4 h-6 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
