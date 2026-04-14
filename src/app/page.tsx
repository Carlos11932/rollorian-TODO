export default function HomePage() {
  return (
    <section className="space-y-4 rounded-xl border border-line bg-surface p-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
          Product foundation
        </p>
        <h1 className="text-3xl font-semibold">Rollorian TODO is bootstrapped.</h1>
      </div>

      <p className="max-w-2xl text-sm leading-6 text-muted">
        This shell is intentionally minimal so frontend and backend work can advance in parallel
        without locking visual decisions too early.
      </p>
    </section>
  );
}
