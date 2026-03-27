import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { futureFeatures } from '../_marketing-content';

export default function FuturePage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_52%,#fff8f1_100%)] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 shadow-[0_12px_24px_rgba(14,165,233,0.22)]">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="block text-2xl font-extrabold tracking-tighter text-navy">SAFAR</span>
            <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">Future roadmap</p>
          </div>
        </Link>

        <section className="mt-6 rounded-[28px] border border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_100%)] p-5 shadow-[0_24px_70px_rgba(15,42,94,0.10)] sm:mt-8 sm:rounded-[34px] sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">Roadmap</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Where SAFAR can go next for a stronger, smarter fleet stack.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            The long-term direction is to move beyond visibility into deeper driver intelligence, preventive safety, and more controlled in-cab operations.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {futureFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-[22px] border border-orange-200 bg-white p-5 shadow-[0_14px_34px_rgba(249,115,22,0.06)] sm:rounded-[26px] sm:p-6">
                  <div className="inline-flex rounded-2xl border border-orange-200 bg-orange-50 p-3 text-orange-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">{feature.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>

          <Link href="/sign-up" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            Start with current platform
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
