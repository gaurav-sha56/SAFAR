import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { currentFeatures } from '../_marketing-content';

export const metadata = {
  title: 'Features | SAFAR',
  description: 'Current platform capabilities for fleet tracking, alerts, and driver monitoring',
  icons: { icon: '/favicon.png' }
};

function accentClasses(accent) {
  return accent === 'orange'
    ? 'border-[#FF6B35]/20 bg-[#FF6B35]/8 text-[#FF6B35]'
    : 'border-[#0D1B2A]/10 bg-[#0D1B2A]/5 text-[#0D1B2A]';
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <div>
            <span className="block text-2xl font-bold tracking-tight text-[#0D1B2A]">SAFAR</span>
            <p className="text-xs font-medium text-slate-400">Current features</p>
          </div>
        </Link>

        <section className="py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B35]">Platform Features</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0D1B2A] sm:text-5xl">What your fleet gets today with SAFAR.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            These are the current product capabilities available across the owner dashboard and driver connection flow.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {currentFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-[22px] border border-[#0D1B2A]/10 bg-white p-5 sm:rounded-[26px] sm:p-6">
                  <div className={`inline-flex rounded-2xl border p-3 ${accentClasses(feature.accent)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-2xl font-black tracking-tight text-[#0D1B2A]">{feature.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>

          <Link href="/future" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#0D1B2A] transition hover:text-[#FF6B35]">
            See future roadmap
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
