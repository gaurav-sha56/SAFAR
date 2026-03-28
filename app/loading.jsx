export default function Loading() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_52%,#fff8f1_100%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[36px] border border-sky-100 bg-[radial-gradient(circle_at_top_left,#e0f2fe_0%,#ffffff_46%,#fff7ed_100%)] p-8 shadow-[0_28px_80px_rgba(15,42,94,0.12)] sm:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)] pwa-pulse">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Launching SAFAR</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Preparing your fleet command center.</h1>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Pulling your latest routes, live drivers, and safety updates so the dashboard opens ready for action.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {['Syncing drivers', 'Refreshing alerts', 'Loading maps'].map((item, index) => (
                <div key={item} className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4 text-left shadow-[0_14px_30px_rgba(15,42,94,0.05)]">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-3 w-3 rounded-full bg-sky-500" style={{ animationDelay: `${index * 0.2}s` }} />
                    <p className="text-sm font-semibold text-slate-700">{item}</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky-100">
                    <div className="h-full w-2/3 rounded-full bg-[linear-gradient(90deg,#0ea5e9_0%,#f97316_100%)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
