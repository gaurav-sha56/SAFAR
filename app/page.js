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
    ? 'border-orange-200 bg-orange-50 text-orange-600'
    : 'border-sky-100 bg-sky-50 text-sky-700';
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-sky-100 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 shadow-[0_12px_24px_rgba(14,165,233,0.22)]">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="block text-2xl font-extrabold tracking-tighter text-navy">SAFAR</span>
            <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">Control your fleet</p>
          </div>
        </Link>

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-1 md:order-none md:w-auto md:gap-2 md:overflow-visible md:pb-0">
          <Link href="/features" className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-orange-50 hover:text-slate-900">
            Features
          </Link>
          <Link href="/pricing" className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-orange-50 hover:text-slate-900">
            Pricing
          </Link>
          <Link href="/about" className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-orange-50 hover:text-slate-900">
            About
          </Link>
          <Link href="/future" className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-orange-50 hover:text-slate-900">
            Future
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Show when="signed-in">
            <Link href="/owner" className="hidden rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 sm:inline-flex">
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-orange-50 hover:text-slate-900 sm:inline-flex">
              Sign in
            </Link>
            <Link href="/sign-up" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)] transition hover:bg-slate-800">
              Start now
            </Link>
          </Show>
        </div>
      </div>
    </header>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
      <p className="mt-3 text-base leading-8 text-slate-600">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_52%,#fff8f1_100%)] text-slate-900">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 pb-12 sm:px-6 lg:px-8">
        <FadeInSection className="rounded-[28px] border border-sky-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_62%,#fff7ed_100%)] p-5 shadow-[0_24px_70px_rgba(15,42,94,0.10)] sm:rounded-[34px] sm:p-8 lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:items-end">
            <div>
              <FadeInSection delay={0.04}>
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-semibold text-sky-700 shadow-[0_10px_30px_rgba(15,42,94,0.06)] sm:text-sm">
                  <ShieldCheck className="h-4 w-4" />
                  Smartphone-powered fleet safety platform
                </div>
              </FadeInSection>

              <FadeInSection delay={0.1} y={34}>
                <h1 className="mt-5 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  Build a safer fleet without forcing a hardware-heavy rollout.
                </h1>
              </FadeInSection>

              <FadeInSection delay={0.16} y={28}>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg sm:leading-9">
                  SAFAR gives fleet owners a practical control center for drivers, alerts, maps, and emergency response using the devices teams already carry every day.
                </p>
              </FadeInSection>

              <FadeInSection delay={0.22} y={24}>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link href="/sign-up" className="inline-flex items-center rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800">
                    Start with SAFAR
                  </Link>
                  <Link href="/pricing" className="inline-flex items-center gap-2 rounded-2xl border border-sky-100 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50">
                    See pricing
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </FadeInSection>
            </div>

            <StaggerGroup className="grid gap-3 sm:grid-cols-2" delay={0.1}>
              <StaggerItem>
                <div className="rounded-[24px] border border-sky-100 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(15,42,94,0.06)] sm:rounded-[28px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-700">Plan</p>
                  <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">Rs. {pricingPlan.price}</p>
                  <p className="mt-2 text-sm text-slate-500">Per {pricingPlan.period} for one fleet workspace.</p>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="rounded-[24px] border border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_100%)] px-5 py-5 shadow-[0_18px_45px_rgba(15,42,94,0.06)] sm:rounded-[28px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-orange-600">Includes</p>
                  <p className="mt-4 text-2xl font-black tracking-tight text-slate-950">Alerts, maps, SOS</p>
                  <p className="mt-2 text-sm text-slate-500">Owner-first tools for daily fleet operations.</p>
                </div>
              </StaggerItem>
              <StaggerItem className="sm:col-span-2">
                <div className="rounded-[24px] border border-sky-100 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(15,42,94,0.06)] sm:rounded-[28px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-700">What you get</p>
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
        </FadeInSection>

        <FadeInSection className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]" y={32}>
          <div className="rounded-[26px] border border-sky-100 bg-white p-5 shadow-[0_18px_55px_rgba(15,42,94,0.08)] sm:rounded-[30px] sm:p-8">
            <SectionHeading
              eyebrow="Current Features"
              title="What SAFAR already gives your fleet today."
              description="The current platform is built around practical owner operations, clear visibility, and quick action when something important happens."
            />

            <StaggerGroup className="mt-8 grid gap-4 md:grid-cols-2">
              {currentFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <StaggerItem key={feature.title}>
                    <div className="rounded-[22px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 sm:rounded-[24px]">
                      <div className={`inline-flex rounded-2xl border p-3 ${accentClasses(feature.accent)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-950">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{feature.description}</p>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          </div>

          <StaggerGroup className="space-y-6" delay={0.05}>
            <StaggerItem>
              <div className="rounded-[26px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_55px_rgba(15,42,94,0.08)] sm:rounded-[30px] sm:p-8">
                <SectionHeading
                  eyebrow="About SAFAR"
                  title="Built for operators who need useful clarity, not dashboard noise."
                  description="SAFAR is shaped around a simple idea: a fleet platform should help owners see what matters, act faster, and grow into better telematics over time."
                />
                <div className="mt-6 space-y-4">
                  {aboutPoints.map((point) => (
                    <FadeInSection key={point} y={18}>
                      <div className="flex items-start gap-3">
                        <Sparkles className="mt-1 h-4 w-4 flex-shrink-0 text-orange-500" />
                        <p className="text-sm leading-7 text-slate-600">{point}</p>
                      </div>
                    </FadeInSection>
                  ))}
                </div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="rounded-[26px] border border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_100%)] p-5 shadow-[0_18px_55px_rgba(15,42,94,0.08)] sm:rounded-[30px] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">Future Vision</p>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Next layer: deeper insight, proactive safety, and smarter in-cab control.</h3>
                <div className="mt-6 space-y-4">
                  {futureFeatures.slice(0, 3).map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <FadeInSection key={feature.title} y={18}>
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl border border-orange-200 bg-white p-2.5 text-orange-600">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-950">{feature.title}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{feature.description}</p>
                          </div>
                        </div>
                      </FadeInSection>
                    );
                  })}
                </div>
                <Link href="/future" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-orange-600">
                  Explore the roadmap
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </StaggerItem>
          </StaggerGroup>
        </FadeInSection>

        <FadeInSection className="mt-8 rounded-[26px] border border-sky-100 bg-white p-5 shadow-[0_18px_55px_rgba(15,42,94,0.08)] sm:rounded-[30px] sm:p-8" y={30}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Testimonials"
              title="What early SAFAR operators appreciate most."
              description="These are the kinds of results and product qualities the platform is being shaped around."
            />
            <Link href="/about" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-orange-600">
              Learn more about us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <StaggerGroup className="mt-8 grid gap-4 lg:grid-cols-3" delay={0.08}>
            {testimonials.map((testimonial) => (
              <StaggerItem key={testimonial.name}>
                <div className="rounded-[22px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 sm:rounded-[24px]">
                  <div className="flex items-center gap-1 text-orange-500">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-slate-950">{testimonial.name}</p>
                    <p className="text-xs text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </FadeInSection>

        <FadeInSection className="mt-8 rounded-[28px] border border-sky-100 bg-slate-950 px-5 py-8 text-white shadow-[0_24px_60px_rgba(15,23,42,0.24)] sm:rounded-[32px] sm:px-8 sm:py-10" y={30}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">Start Professional Fleet Control</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">Launch your owner workspace for Rs. 199 per month and move into a cleaner operating system.</h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                Use the current driver, alerts, maps, and SOS workflows now, then grow into weekly reports, proactive safety, and deeper analysis as SAFAR evolves.
              </p>
            </div>
            <StaggerGroup className="flex flex-wrap gap-3" delay={0.1}>
              <StaggerItem>
                <Link href="/sign-up" className="inline-flex items-center rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-orange-50">
                  Create account
                </Link>
              </StaggerItem>
              <StaggerItem>
                <Link href="/features" className="inline-flex items-center rounded-2xl border border-white/15 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/8">
                  View features
                </Link>
              </StaggerItem>
            </StaggerGroup>
          </div>
        </FadeInSection>
      </main>
    </div>
  );
}
