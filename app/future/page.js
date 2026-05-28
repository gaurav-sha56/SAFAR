import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { futureFeatures } from '../_marketing-content';

export const metadata = {
  title: 'Future | SAFAR',
  description: 'Roadmap for upcoming fleet intelligence and safety features',
  icons: { icon: '/favicon.png' }
};

export default function FuturePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <div>
            <span className="block text-2xl font-bold tracking-tight text-[#0D1B2A]">SAFAR</span>
            <p className="text-xs font-medium text-slate-400">Future roadmap</p>
          </div>
        </Link>

        <section className="py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B35]">Roadmap</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0D1B2A] sm:text-5xl">Where SAFAR can go next for a stronger, smarter fleet stack.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            The long-term direction is to move beyond visibility into deeper driver intelligence, preventive safety, and more controlled in-cab operations.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {futureFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-[22px] border border-[#FF6B35]/20 bg-white p-5 shadow-[0_14px_34px_rgba(249,115,22,0.06)] sm:rounded-[26px] sm:p-6">
                  <div className="inline-flex rounded-2xl border border-[#FF6B35]/20 bg-[#FF6B35]/8 p-3 text-[#FF6B35]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-2xl font-black tracking-tight text-[#0D1B2A]">{feature.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>

          <Link href="/sign-up" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#FF6B35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E55A25]">
            Start with current platform
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
