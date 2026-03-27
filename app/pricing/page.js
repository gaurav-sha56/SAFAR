import Link from 'next/link';
import { ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { pricingPlan } from '../_marketing-content';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_52%,#fff8f1_100%)] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 shadow-[0_12px_24px_rgba(14,165,233,0.22)]">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="block text-2xl font-extrabold tracking-tighter text-navy">SAFAR</span>
            <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">Pricing</p>
          </div>
        </Link>

        <section className="mt-6 rounded-[28px] border border-sky-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_62%,#fff7ed_100%)] p-5 shadow-[0_24px_70px_rgba(15,42,94,0.10)] sm:mt-8 sm:rounded-[34px] sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">Simple Pricing</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">One professional fleet workspace at Rs. {pricingPlan.price} per {pricingPlan.period}.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{pricingPlan.description}</p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-[24px] border border-sky-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,42,94,0.06)] sm:rounded-[28px] sm:p-6">
              <h2 className="text-2xl font-black tracking-tight text-slate-950">{pricingPlan.name}</h2>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Rs. {pricingPlan.price}</span>
                <span className="pb-1 text-sm font-medium text-slate-500">/ {pricingPlan.period}</span>
              </div>
              <div className="mt-6 space-y-4">
                {pricingPlan.items.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                    <p className="text-sm leading-7 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_100%)] p-5 shadow-[0_18px_45px_rgba(15,42,94,0.06)] sm:rounded-[28px] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">Best for</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Early fleets that want real visibility now.</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                This plan is designed to get you started with live drivers, alerts, maps, and SOS workflows without waiting for a heavier rollout.
              </p>
              <Link href="/sign-up" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Start with SAFAR
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
