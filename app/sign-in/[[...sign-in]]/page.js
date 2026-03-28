import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/owner");
  }
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f5f5f4_0%,#fff8ef_48%,#edf5ff_100%)] text-stone-900">
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_0.95fr] lg:px-10">
        <div className="pointer-events-none absolute left-[-7rem] top-[-5rem] h-64 w-64 rounded-full bg-orange-200/35 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-7rem] right-[-5rem] h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />

        <section className="relative max-w-2xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-orange-200/80 bg-white/85 px-4 py-2 shadow-[0_14px_45px_rgba(15,42,94,0.08)] backdrop-blur">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy text-sm font-bold tracking-[0.3em] text-white">
              S
            </span>
            <div>
              <p className="text-sm font-semibold tracking-[0.3em] text-navy">SAFAR</p>
              <p className="text-xs text-stone-500">Secure owner login for your fleet workspace</p>
            </div>
          </div>

          <h1 className="mt-8 max-w-xl text-4xl font-black tracking-tight text-navy sm:text-5xl lg:text-6xl">
            Welcome back to Safar.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-stone-600 sm:text-lg">
            Sign in to continue tracking drivers, reviewing alerts, and managing fleet activity from one clean dashboard.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,42,94,0.08)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-500">Live Tracking</p>
              <p className="mt-3 text-sm leading-6 text-stone-600">Open driver locations quickly and keep the active fleet status visible at a glance.</p>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,42,94,0.08)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-500">Fast Return</p>
              <p className="mt-3 text-sm leading-6 text-stone-600">This route stays inside your app, so owners come back to the dashboard without a broken flow.</p>
            </div>
          </div>
        </section>

        <section className="relative w-full max-w-lg justify-self-end">
          <div className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-[0_30px_90px_rgba(15,42,94,0.14)] backdrop-blur sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-500">Owner Sign In</p>
              <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Access your dashboard</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Sign in here to continue directly into the Safar owner workspace.
              </p>
            </div>

            {hasClerkKey ? (
              <SignIn
                path="/sign-in"
                routing="path"
                signUpUrl="/sign-up"
                fallbackRedirectUrl="/owner"
                forceRedirectUrl="/owner"
                appearance={{
                  variables: {
                    colorPrimary: "#0F2A5E",
                    colorText: "#1c1917",
                    colorBackground: "#ffffff",
                    colorInputBackground: "#fafaf9",
                    colorInputText: "#1c1917",
                  },
                  elements: {
                    card: "shadow-none border-0 p-0",
                    rootBox: "w-full",
                    formButtonPrimary: "bg-[#0F2A5E] hover:bg-[#1a3d7c] text-white shadow-none",
                    footerActionLink: "text-[#f97316] hover:text-[#ea580c]",
                    socialButtonsBlockButton: "border-stone-200 shadow-none hover:bg-stone-50",
                    formFieldInput: "border-stone-200 bg-stone-50",
                    formFieldLabel: "text-stone-700",
                    dividerText: "text-stone-400",
                  },
                }}
              />
            ) : (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-center text-sm text-orange-700">
                Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local` to enable Clerk sign-in.
              </div>
            )}

            <div className="mt-6 flex items-center justify-center">
              <Link
                href="/sign-up"
                className="text-sm font-semibold text-navy transition hover:text-orange-500"
              >
                Need a new owner account? Sign up
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
