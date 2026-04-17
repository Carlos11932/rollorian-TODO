export default function AdminLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] px-5 pt-4 pb-4 gap-6 overflow-y-auto">
      <div className="flex flex-col gap-1">
        <div className="h-4 w-48 bg-surface-container-high rounded animate-pulse" />
        <div className="h-3 w-64 bg-surface-container-high rounded animate-pulse mt-1" />
      </div>

      <section className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-3">
        <div className="h-3 w-24 bg-surface-container-high rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 flex-1 bg-surface-container-high rounded-lg animate-pulse" />
          <div className="h-9 w-36 bg-surface-container-high rounded-lg animate-pulse" />
        </div>
      </section>

      <section className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-3">
        <div className="h-3 w-24 bg-surface-container-high rounded animate-pulse" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface-container-high rounded-lg animate-pulse" />
          ))}
        </div>
      </section>

      <section className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-3">
        <div className="h-3 w-16 bg-surface-container-high rounded animate-pulse" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-surface-container-high rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    </div>
  );
}
