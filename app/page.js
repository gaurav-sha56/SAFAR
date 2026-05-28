import Link from 'next/link';
import { Show, UserButton } from '@clerk/nextjs';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import {
  aboutPoints,
  currentFeatures,
  futureFeatures,
  pricingPlan,
  testimonials,
} from './_marketing-content';
import {
  FadeInSection,
  StaggerGroup,
  StaggerItem,
} from './_components/marketing-motion';

function accentClasses(accent) {
  return accent === 'orange'
    ? 'border-[#FF6B35]/20 bg-[#FF6B35]/8 text-[#FF6B35]'
    : 'border-[#0D1B2A]/10 bg-[#0D1B2A]/5 text-[#0D1B2A]';
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0D1B2A]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-2xl font-bold tracking-tight text-white">
          SAFAR
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link href="/features" className="text-sm font-medium text-white/85 transition hover:text-white">
            Features
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-white/85 transition hover:text-white">
            Pricing
          </Link>
          <Link href="/about" className="text-sm font-medium text-white/85 transition hover:text-white">
            About
          </Link>
          <Link href="/future" className="text-sm font-medium text-white/85 transition hover:text-white">
            Future
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Show when="signed-in">
            <Link href="/owner" className="hidden rounded-lg bg-[#FF6B35] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#E55A25] md:inline-flex">
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in" className="hidden text-sm font-medium text-white/85 transition hover:text-white md:inline-flex">
              Sign in
            </Link>
            <Link href="/sign-up" className="hidden rounded-lg bg-[#FF6B35] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#E55A25] md:inline-flex">
              Start now
            </Link>
          </Show>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-white md:hidden"
            aria-label="Toggle menu"
          >
            <Zap className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B35]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0D1B2A] sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">{description}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0D1B2A] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-2">
        <p className="text-sm font-bold">SAFAR CABS PRIVATE LIMITED</p>
        <p className="text-xs text-slate-400">CIN: U49224UP2026PTC244598</p>
        <p className="text-xs text-slate-400">Registered Office: Kanpur, Uttar Pradesh, India</p>
        <p className="text-xs text-slate-400">Contact: safarcabs25@gmail.com</p>
        <Link href="/privacy" className="inline-block text-xs text-slate-400 transition hover:text-white">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />

      <main>
        {/* ── Hero ── */}
        <section className="bg-white pt-16 pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:items-end">
              <div>
                <FadeInSection delay={0.04}>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#0D1B2A]/15 bg-white px-4 py-2 text-xs font-semibold text-[#0D1B2A]">
                    <ShieldCheck className="h-4 w-4 text-[#FF6B35]" />
                    Smartphone-powered fleet safety platform
                  </div>
                </FadeInSection>

                <FadeInSection delay={0.1} y={34}>
                  <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-[#0D1B2A] sm:text-5xl lg:text-6xl">
                    Build a safer fleet without forcing a hardware-heavy rollout.
                  </h1>
                </FadeInSection>

                <FadeInSection delay={0.16} y={28}>
                  <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                    SAFAR gives fleet owners a practical control center for drivers, alerts, maps, and emergency response using the devices teams already carry every day.
                  </p>
                </FadeInSection>

                <FadeInSection delay={0.22} y={24}>
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-lg bg-[#FF6B35] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(255,107,53,0.28)] transition hover:bg-[#E55A25]">
                      Start with SAFAR
                    </Link>
                    <Link href="/pricing" className="inline-flex items-center gap-2 rounded-lg border border-[#0D1B2A]/15 bg-white px-7 py-3.5 text-sm font-semibold text-[#0D1B2A] transition hover:border-[#0D1B2A]/30">
                      See pricing
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </FadeInSection>
              </div>

              <StaggerGroup className="grid gap-3 sm:grid-cols-2" delay={0.1}>
                <StaggerItem>
                  <div className="rounded-2xl border border-[#0D1B2A]/10 bg-white px-5 py-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0D1B2A]">Plan</p>
                    <p className="mt-4 text-4xl font-black tracking-tight text-[#0D1B2A]">Rs. {pricingPlan.price}</p>
                    <p className="mt-2 text-sm text-slate-500">Per {pricingPlan.period} for one fleet workspace.</p>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="rounded-2xl border border-[#FF6B35]/20 bg-white px-5 py-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#FF6B35]">Includes</p>
                    <p className="mt-4 text-2xl font-black tracking-tight text-[#0D1B2A]">Alerts, maps, SOS</p>
                    <p className="mt-2 text-sm text-slate-500">Owner-first tools for daily fleet operations.</p>
                  </div>
                </StaggerItem>
                <StaggerItem className="sm:col-span-2">
                  <div className="rounded-2xl border border-[#0D1B2A]/10 bg-white px-5 py-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0D1B2A]">What you get</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {pricingPlan.items.slice(0, 4).map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                          <p className="text-sm leading-6 text-slate-600">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              </StaggerGroup>
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="border-t border-[#0D1B2A]/8" />

        {/* ── Features Section ── */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeInSection y={32}>
              <SectionHeading
                eyebrow="Current Features"
                title="What SAFAR already gives your fleet today."
                description="The current platform is built around practical owner operations, clear visibility, and quick action when something important happens."
              />
            </FadeInSection>

            <StaggerGroup className="mt-10 grid gap-4 md:grid-cols-2">
              {currentFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <StaggerItem key={feature.title}>
                    <div className="rounded-2xl border border-[#0D1B2A]/10 bg-white p-6 transition hover:border-[#FF6B35]/30">
                      <div className={`inline-flex rounded-2xl border p-3 ${accentClasses(feature.accent)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-[#0D1B2A]">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{feature.description}</p>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="border-t border-[#0D1B2A]/8" />

        {/* ── About Section ── */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeInSection y={32}>
              <SectionHeading
                eyebrow="About SAFAR"
                title="Built for operators who need useful clarity, not dashboard noise."
                description="SAFAR is shaped around a simple idea: a fleet platform should help owners see what matters, act faster, and grow into better telematics over time."
              />
            </FadeInSection>

            <div className="mt-8 space-y-4">
              {aboutPoints.map((point) => (
                <FadeInSection key={point} y={18}>
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-1 h-4 w-4 flex-shrink-0 text-[#FF6B35]" />
                    <p className="text-sm leading-7 text-slate-600">{point}</p>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="border-t border-[#0D1B2A]/8" />

        {/* ── Future Vision Section ── */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeInSection y={32}>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B35]">Future Vision</p>
              <h3 className="mt-3 max-w-3xl text-2xl font-black tracking-tight text-[#0D1B2A] sm:text-3xl">Next layer: deeper insight, proactive safety, and smarter in-cab control.</h3>
            </FadeInSection>

            <div className="mt-8 space-y-4">
              {futureFeatures.slice(0, 3).map((feature) => {
                const Icon = feature.icon;
                return (
                  <FadeInSection key={feature.title} y={18}>
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl border border-[#FF6B35]/20 bg-[#FF6B35]/8 p-2.5 text-[#FF6B35]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0D1B2A]">{feature.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{feature.description}</p>
                      </div>
                    </div>
                  </FadeInSection>
                );
              })}
            </div>

            <FadeInSection delay={0.1}>
              <Link href="/future" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#0D1B2A] transition hover:text-[#FF6B35]">
                Explore the roadmap
                <ArrowRight className="h-4 w-4" />
              </Link>
            </FadeInSection>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="border-t border-[#0D1B2A]/8" />

        {/* ── Testimonials Section ── */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeInSection y={30}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <SectionHeading
                  eyebrow="Testimonials"
                  title="What early SAFAR operators appreciate most."
                  description="These are the kinds of results and product qualities the platform is being shaped around."
                />
                <Link href="/about" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0D1B2A] transition hover:text-[#FF6B35]">
                  Learn more about us
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </FadeInSection>

            <StaggerGroup className="mt-10 grid gap-4 lg:grid-cols-3" delay={0.08}>
              {testimonials.map((testimonial) => (
                <StaggerItem key={testimonial.name}>
                  <div className="rounded-2xl border border-[#0D1B2A]/10 bg-white p-6">
                    <div className="flex items-center gap-1 text-[#FF6B35]">
                      {[0, 1, 2, 3, 4].map((index) => (
                        <Star key={index} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">&ldquo;{testimonial.quote}&rdquo;</p>
                    <div className="mt-5">
                      <p className="text-sm font-semibold text-[#0D1B2A]">{testimonial.name}</p>
                      <p className="text-xs text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="bg-[#0D1B2A] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeInSection y={30}>
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B35]/80">Start Professional Fleet Control</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Launch your owner workspace for Rs. 199 per month and move into a cleaner operating system.</h2>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                    Use the current driver, alerts, maps, and SOS workflows now, then grow into weekly reports, proactive safety, and deeper analysis as SAFAR evolves.
                  </p>
                </div>
                <StaggerGroup className="flex flex-wrap gap-3" delay={0.1}>
                  <StaggerItem>
                    <Link href="/sign-up" className="inline-flex items-center rounded-lg bg-[#FF6B35] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(255,107,53,0.30)] transition hover:bg-[#E55A25]">
                      Create account
                    </Link>
                  </StaggerItem>
                  <StaggerItem>
                    <Link href="/features" className="inline-flex items-center rounded-lg border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/8">
                      View features
                    </Link>
                  </StaggerItem>
                </StaggerGroup>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
