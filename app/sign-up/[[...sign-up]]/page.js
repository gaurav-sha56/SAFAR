import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/owner");
  }

  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f7f5f2_0%,#fffaf4_44%,#eef6ff_100%)] text-stone-900">
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:px-10">
        <div className="pointer-events-none absolute left-[-8rem] top-[-7rem] h-72 w-72 rounded-full bg-orange-200/35 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-8rem] right-[-4rem] h-80 w-80 rounded-full bg-sky-200/35 blur-3xl" />

        <section className="relative max-w-2xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-orange-200/80 bg-white/85 px-4 py-2 shadow-[0_14px_45px_rgba(15,42,94,0.08)] backdrop-blur">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy text-sm font-bold tracking-[0.3em] text-white">
              S
            </span>
            <div>
              <p className="text-sm font-semibold tracking-[0.3em] text-navy">SAFAR</p>
              <p className="text-xs text-stone-500">Owner access for the live fleet dashboard</p>
            </div>
          </div>

          <h1 className="mt-8 max-w-xl text-3xl font-black tracking-tight text-navy sm:text-5xl lg:text-6xl">
            Create your Safar owner account.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
            Start with a clean sign-up flow inside your app, then continue directly to the protected owner dashboard for live tracking, invite codes, and driver monitoring.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,42,94,0.08)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-500">Fast Access</p>
              <p className="mt-3 text-sm leading-6 text-stone-600">Sign-up stays on `/sign-up`, so the auth experience feels native to the app.</p>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,42,94,0.08)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-500">Protected Flow</p>
              <p className="mt-3 text-sm leading-6 text-stone-600">Successful registration sends owners straight to the dashboard without extra steps.</p>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,42,94,0.08)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-500">Google Ready</p>
              <p className="mt-3 text-sm leading-6 text-stone-600">Use Google-first auth in Clerk for a faster onboarding experience for fleet owners.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/sign-in"
              className="inline-flex items-center rounded-2xl border border-navy px-5 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white"
            >
              Back to Sign In
            </Link>
            <p className="text-sm text-stone-500">Already have access? Use the same secure flow to continue.</p>
          </div>
        </section>

        <section className="relative mt-4 w-full max-w-lg justify-self-stretch lg:mt-0 lg:justify-self-end">
          <div className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_30px_90px_rgba(15,42,94,0.14)] backdrop-blur sm:rounded-[32px] sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-500">Owner Sign Up</p>
              <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Create dashboard access</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Complete your account setup here and continue directly into the Safar owner workspace.
              </p>
            </div>

            {hasClerkKey ? (
              <SignUp
                path="/sign-up"
                routing="path"
                signInUrl="/sign-in"
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
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm text-orange-700">
                Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local` to enable
                Clerk sign-up.
              </div>
            )}

            <p className="mt-5 text-center text-xs leading-5 text-stone-500">
              To allow only Gmail/Google login, disable phone number sign-in in the Clerk Dashboard and keep
              Google enabled as the active auth method.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
