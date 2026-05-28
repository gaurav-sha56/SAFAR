import Link from 'next/link';
import { Sparkles, Zap } from 'lucide-react';
import { aboutPoints, testimonials } from '../_marketing-content';

export const metadata = {
  title: 'About | SAFAR',
  description: 'Learn about SAFAR — the smartphone-powered fleet safety platform',
  icons: { icon: '/favicon.png' }
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <div>
            <span className="block text-2xl font-bold tracking-tight text-[#0D1B2A]">SAFAR</span>
            <p className="text-xs font-medium text-slate-400">About us</p>
          </div>
        </Link>

        <section className="py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B35]">About SAFAR</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0D1B2A] sm:text-5xl">A fleet platform shaped around clarity, action, and safer daily operations.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            SAFAR is being built as a practical fleet operating system for owners who want live visibility and stronger safety processes without depending on a difficult hardware-first rollout.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="space-y-4">
              {aboutPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-[22px] border border-[#0D1B2A]/10 bg-white p-5 sm:rounded-[24px]">
                  <Sparkles className="mt-1 h-4 w-4 flex-shrink-0 text-[#FF6B35]" />
                  <p className="text-sm leading-7 text-slate-600">{point}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[24px] border border-[#FF6B35]/20 bg-white p-5 sm:rounded-[28px] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF6B35]">Why this matters</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-[#0D1B2A]">Fleet software should reduce guesswork, not create more of it.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Our design direction focuses on giving owners a control center that feels operational, confident, and immediately usable.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-[#0D1B2A]/8 py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B35]">What users say</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="rounded-[22px] border border-[#0D1B2A]/10 bg-white p-5 sm:rounded-[24px]">
                <p className="text-sm leading-7 text-slate-600">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-5">
                  <p className="text-sm font-semibold text-[#0D1B2A]">{testimonial.name}</p>
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
