import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: 'Sign Up | SAFAR',
  description: 'Create your SAFAR fleet owner account',
  icons: { icon: '/favicon.png' }
};

export default async function SignUpPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/owner");
  }

  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <main className="flex min-h-screen">
      {/* Left panel — navy */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#0D1B2A] p-12">
        <div>
          <Link href="/" className="text-2xl font-bold tracking-tight text-white">SAFAR</Link>
        </div>
        <div className="max-w-lg">
          <h1 className="text-4xl font-black tracking-tight text-white xl:text-5xl">
            Create your Safar owner account.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Start with a clean sign-up flow inside your app, then continue directly to the protected owner dashboard for live tracking, invite codes, and driver monitoring.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B35]">Fast Access</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">Sign-up stays on `/sign-up`, so the auth experience feels native to the app.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B35]">Protected Flow</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">Successful registration sends owners straight to the dashboard without extra steps.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B35]">Google Ready</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">Use Google-first auth in Clerk for a faster onboarding experience for fleet owners.</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500">&copy; 2026 Safar Cabs Private Limited</p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="text-2xl font-bold tracking-tight text-[#0D1B2A]">SAFAR</Link>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF6B35]">Owner Sign Up</p>
          <h2 className="mt-2 text-2xl font-bold text-[#0D1B2A] sm:text-3xl">Create dashboard access</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Complete your account setup here and continue directly into the Safar owner workspace.
          </p>

          <div className="mt-8">
            {hasClerkKey ? (
              <SignUp
                path="/sign-up"
                routing="path"
                signInUrl="/sign-in"
                fallbackRedirectUrl="/owner"
                forceRedirectUrl="/owner"
                appearance={{
                  variables: {
                    colorPrimary: "#0D1B2A",
                    colorText: "#1c1917",
                    colorBackground: "#ffffff",
                    colorInputBackground: "#fafaf9",
                    colorInputText: "#1c1917",
                  },
                  elements: {
                    card: "shadow-none border-0 p-0",
                    rootBox: "w-full",
                    formButtonPrimary: "bg-[#0D1B2A] hover:bg-[#1a2e45] text-white shadow-none",
                    footerActionLink: "text-[#FF6B35] hover:text-[#E55A25]",
                    socialButtonsBlockButton: "border-stone-200 shadow-none hover:bg-stone-50",
                    formFieldInput: "border-stone-200 bg-stone-50",
                    formFieldLabel: "text-stone-700",
                    dividerText: "text-stone-400",
                  },
                }}
              />
            ) : (
              <div className="rounded-2xl border border-[#FF6B35]/20 bg-[#FF6B35]/8 px-4 py-4 text-sm text-[#FF6B35]">
                Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local` to enable
                Clerk sign-up.
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/sign-in"
              className="inline-flex items-center rounded-lg border border-[#0D1B2A] px-5 py-2.5 text-sm font-semibold text-[#0D1B2A] transition hover:bg-[#0D1B2A] hover:text-white"
            >
              Back to Sign In
            </Link>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-stone-500">
            To allow only Gmail/Google login, disable phone number sign-in in the Clerk Dashboard and keep
            Google enabled as the active auth method.
          </p>
        </div>
      </div>
    </main>
  );
}
