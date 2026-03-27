import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { currentFeatures } from '../_marketing-content';

function accentClasses(accent) {
  return accent === 'orange'
    ? 'border-orange-200 bg-orange-50 text-orange-600'
    : 'border-sky-100 bg-sky-50 text-sky-700';
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_52%,#fff8f1_100%)] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 shadow-[0_12px_24px_rgba(14,165,233,0.22)]">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="block text-2xl font-extrabold tracking-tighter text-navy">SAFAR</span>
            <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">Current features</p>
          </div>
        </Link>

        <section className="mt-6 rounded-[28px] border border-sky-100 bg-white p-5 shadow-[0_24px_70px_rgba(15,42,94,0.10)] sm:mt-8 sm:rounded-[34px] sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">Platform Features</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">What your fleet gets today with SAFAR.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            These are the current product capabilities available across the owner dashboard and driver connection flow.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {currentFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-[22px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 sm:rounded-[26px] sm:p-6">
                  <div className={`inline-flex rounded-2xl border p-3 ${accentClasses(feature.accent)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">{feature.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>

          <Link href="/future" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-800 transition hover:text-orange-600">
            See future roadmap
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
