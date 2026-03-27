import Link from 'next/link';
import { Sparkles, Zap } from 'lucide-react';
import { aboutPoints, testimonials } from '../_marketing-content';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_52%,#fff8f1_100%)] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 shadow-[0_12px_24px_rgba(14,165,233,0.22)]">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="block text-2xl font-extrabold tracking-tighter text-navy">SAFAR</span>
            <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">About us</p>
          </div>
        </Link>

        <section className="mt-6 rounded-[28px] border border-sky-100 bg-white p-5 shadow-[0_24px_70px_rgba(15,42,94,0.10)] sm:mt-8 sm:rounded-[34px] sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">About SAFAR</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">A fleet platform shaped around clarity, action, and safer daily operations.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            SAFAR is being built as a practical fleet operating system for owners who want live visibility and stronger safety processes without depending on a difficult hardware-first rollout.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="space-y-4">
              {aboutPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-[22px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 sm:rounded-[24px]">
                  <Sparkles className="mt-1 h-4 w-4 flex-shrink-0 text-orange-500" />
                  <p className="text-sm leading-7 text-slate-600">{point}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[24px] border border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_100%)] p-5 sm:rounded-[28px] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">Why this matters</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Fleet software should reduce guesswork, not create more of it.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Our design direction focuses on giving owners a control center that feels operational, confident, and immediately usable.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-sky-100 bg-white p-5 shadow-[0_24px_70px_rgba(15,42,94,0.10)] sm:rounded-[34px] sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">What users say</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="rounded-[22px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 sm:rounded-[24px]">
                <p className="text-sm leading-7 text-slate-600">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-5">
                  <p className="text-sm font-semibold text-slate-950">{testimonial.name}</p>
                  <p className="text-xs text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
