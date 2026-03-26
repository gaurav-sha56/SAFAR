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
    <main className="min-h-screen bg-stone-100 text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-10 lg:flex-row lg:items-center lg:gap-16">
        <section className="max-w-xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-orange-200 bg-white px-4 py-2 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy text-sm font-bold tracking-[0.3em] text-white">
              S
            </span>
            <div>
              <p className="text-sm font-semibold tracking-[0.3em] text-navy">SAFAR CABS</p>
              <p className="text-xs text-stone-500">Fleet Management & Safety Dashboard</p>
            </div>
          </div>

          <h1 className="mt-8 text-4xl font-black tracking-tight text-navy sm:text-5xl">
            Sign in to the Safar Cabs owner dashboard.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-stone-600">
            Use your Google account to access fleet pairing, live driver notifications, and the realtime
            safety console.
          </p>

          <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-500">Secure Access</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              This sign-in page lives at `/sign-in`, and sign-up stays on `/sign-up` so the full Clerk flow
              remains inside your app routes.
            </p>
            <Link
              href="/sign-up"
              className="mt-4 inline-flex items-center rounded-2xl border border-navy px-4 py-2 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white"
            >
              Create an account
            </Link>
          </div>
        </section>

        <section className="mt-10 w-full max-w-md lg:mt-0">
          <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,42,94,0.12)] sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-500">Owner Sign In</p>
              <h2 className="mt-2 text-2xl font-bold text-navy">Access Safar Dashboard</h2>
              <p className="mt-2 text-sm text-stone-500">
                Continue with Clerk sign-in and land directly on the protected owner console.
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
                    formButtonPrimary: "bg-[#0F2A5E] hover:bg-[#1a3d7c] text-white",
                    footerActionLink: "text-[#f97316] hover:text-[#ea580c]",
                  },
                }}
              />
            ) : (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm text-orange-700">
                Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local` to enable
                Clerk sign-in.
              </div>
            )}

            <p className="mt-4 text-center text-xs text-stone-500">
              Keep only Google enabled in Clerk if you want Gmail-only login for the demo.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
