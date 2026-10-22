export default function Loading() {
  return (
    <div className="wrap py-16">
      <div className="skeleton mx-auto h-8 w-64" />
      <div className="skeleton mx-auto mt-4 h-4 w-full max-w-lg" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="glass overflow-hidden">
            <div className="skeleton h-32 rounded-none" />
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
