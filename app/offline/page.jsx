import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_52%,#fff8f1_100%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 rounded-[36px] border border-sky-100 bg-[radial-gradient(circle_at_top_left,#e0f2fe_0%,#ffffff_40%,#fff7ed_100%)] p-8 shadow-[0_28px_80px_rgba(15,42,94,0.12)] sm:p-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">Offline Mode</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              SAFAR is still here, even when the network is not.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Your connection dropped for a moment. Reconnect to refresh drivers, alerts, and live fleet routes. Until then, you can keep the app open and retry as soon as signal returns.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/owner"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
              >
                Retry dashboard
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-sky-100 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900"
              >
                Open homepage
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-[0_18px_45px_rgba(15,42,94,0.08)] backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-[0_12px_24px_rgba(14,165,233,0.24)]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5 5 0 117.778 0M5 12.55a9 9 0 0114 0M1.42 9.03a13 13 0 0121.16 0M12 20h.01" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Connection lost</p>
                <p className="text-sm text-slate-500">We will be ready when your internet returns.</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                'Open SAFAR from the home screen for the cleanest app experience',
                'Reconnect mobile data or Wi-Fi and reload once',
                'Recent shell assets stay available for faster recovery',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-sky-50 bg-sky-50/60 px-4 py-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-400" />
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
