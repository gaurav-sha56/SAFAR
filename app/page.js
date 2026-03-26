// app/page.js
import Link from 'next/link';
import Image from 'next/image';
import { Show, UserButton } from '@clerk/nextjs';
import { BarChart3, MapPin, ShieldCheck, Zap } from 'lucide-react'; // Icons ke liye

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* SAFAR LOGO (Replace with your actual svg/png) */}
            <Zap className="h-8 w-8 text-orange-500" />
            <span className="text-3xl font-extrabold text-sky-700 tracking-tighter">
              SAFAR
            </span>
          </div>
          
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-sky-600 transition">Features</Link>
            <Link href="#pricing" className="hover:text-sky-600 transition">Pricing</Link>
            <Link href="#about" className="hover:text-sky-600 transition">About Us</Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Clerk Logic Implementation */}
            <Show when="signed-in">
              <UserButton afterSignOutUrl="/" />
              <Link href="/owner">
                <button className="bg-orange-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-600 transition shadow-sm">
                  Dashboard
                </button>
              </Link>
            </Show>
          </div>
        </nav>
      </header>

      {/* --- HERO SECTION --- */}
      <main className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 px-4 py-1.5 rounded-full text-sm font-medium border border-sky-100">
              <ShieldCheck className="h-4 w-4" />
              Revolutionizing Fleet Safety with Telematics
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-950 leading-tight tracking-tighter">
              Track, Secure, <span className="text-sky-600">Optimize</span>.<br /> 
              No Expensive <span className="text-orange-500">Hardware</span>.
            </h1>
            <p className="text-lg text-slate-600 max-w-xl">
              SAFAR transforms driver smartphones into advanced telematics devices. Monitor real-time GPS behavior and driving patterns to gain actionable insights into road safety and operational efficiency.
            </p>
            <div className="flex gap-4 pt-4">
              <Link href="/sign-up">
                <button className="bg-slate-950 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition">
                  Get Started for Free
                </button>
              </Link>
            </div>
          </div>

          <div className="relative aspect-[16/10] bg-sky-50 rounded-2xl p-6 shadow-inner border border-sky-100 overflow-hidden">
            <Image 
              src="/globe.svg" // Apni dashboard screenshot ya main vector image yahan dalein
              alt="SAFAR Fleet Dashboard Mockup"
              fill
              className="object-contain p-8 drop-shadow-2xl"
              priority
            />
            {/* Design accents */}
            <div className="absolute top-8 left-8 h-12 w-12 bg-orange-500 rounded-full blur-[70px]"></div>
            <div className="absolute bottom-8 right-8 h-12 w-12 bg-sky-400 rounded-full blur-[70px]"></div>
          </div>

        </div>
      </main>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="bg-slate-50 py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl font-bold text-slate-950 tracking-tight">Everything You Need to Manage Your Fleet</h2>
            <p className="text-slate-600">We leverage the power of ubiquitous smartphones to provide features traditional OBD devices can't match.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featureList.map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:border-sky-100 hover:shadow-sky-100 transition-all duration-300">
                <div className={`p-3 inline-block rounded-xl ${feature.iconBg}`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold text-slate-950 mt-6 mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-slate-600 text-base leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CALL TO ACTION (CTA) --- */}
      <section className="bg-sky-600 py-20 mt-20">
        <div className="max-w-4xl mx-auto px-6 text-center text-white space-y-8">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Ready to enhance safety and <span className="text-orange-300">cut operational costs?</span>
          </h2>
          <p className="text-lg text-sky-100 max-w-2xl mx-auto">
            Join fleet owners who are already leveraging their existing devices to gain complete operational transparency.
          </p>
          <div>
             <Link href="/sign-up">
              <button className="bg-white text-sky-700 px-10 py-4 rounded-xl font-bold hover:bg-orange-50 transition shadow-lg text-lg">
                Create Your Free Account
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white py-10 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
          <p>&copy; 2026 SAFAR Tech. All rights reserved.</p>
          <p className="mt-2 text-xs">Transforming smartphones into fleet intelligence.</p>
        </div>
      </footer>

    </div>
  );
}

// Features data structure
const featureList = [
  {
    icon: <MapPin className="h-7 w-7 text-sky-600" />,
    iconBg: "bg-sky-50",
    title: "Real-time Location",
    description: "Instantaneous tracking of every asset in your fleet. Monitor routes and arrival times on a dynamic, high-fidelity map."
  },
  {
    icon: <Zap className="h-7 w-7 text-orange-600" />,
    iconBg: "bg-orange-50",
    title: "Driving Behavior",
    description: "Analyze precise patterns: rapid acceleration, harsh braking, phone usage, and cornering speed using device sensors."
  },
  {
    icon: <BarChart3 className="h-7 w-7 text-sky-600" />,
    iconBg: "bg-sky-50",
    title: "Actionable Insights",
    description: "Generate comprehensive reports and dashboards showing fleet utilization, driver safety scores, and maintenance alerts."
  }
];
