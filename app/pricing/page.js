import Link from 'next/link';
import { ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { pricingPlan } from '../_marketing-content';

export const metadata = {
  title: 'Pricing | SAFAR',
  description: 'Simple fleet workspace pricing for SAFAR fleet operations',
  icons: { icon: '/favicon.png' }
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <div>
            <span className="block text-2xl font-bold tracking-tight text-[#0D1B2A]">SAFAR</span>
            <p className="text-xs font-medium text-slate-400">Pricing</p>
          </div>
        </Link>

        <section className="py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B35]">Simple Pricing</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0D1B2A] sm:text-5xl">One professional fleet workspace at Rs. {pricingPlan.price} per {pricingPlan.period}.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{pricingPlan.description}</p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-[24px] border border-[#0D1B2A]/10 bg-white p-5 sm:rounded-[28px] sm:p-6">
              <h2 className="text-2xl font-black tracking-tight text-[#0D1B2A]">{pricingPlan.name}</h2>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-black tracking-tight text-[#0D1B2A] sm:text-5xl">Rs. {pricingPlan.price}</span>
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

            <div className="rounded-[24px] border border-[#FF6B35]/20 bg-white p-5 sm:rounded-[28px] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF6B35]">Best for</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-[#0D1B2A]">Early fleets that want real visibility now.</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                This plan is designed to get you started with live drivers, alerts, maps, and SOS workflows without waiting for a heavier rollout.
              </p>
              <Link href="/sign-up" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#FF6B35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E55A25]">
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
