import {
  AudioLines,
  BarChart3,
  BellRing,
  Gauge,
  MapPinned,
  ShieldCheck,
  Siren,
  Smartphone,
  Users,
  Waves,
} from 'lucide-react';

export const currentFeatures = [
  {
    title: 'Live fleet visibility',
    description:
      'Track connected drivers, inspect recent routes, and open live map views without relying on expensive hardware installations.',
    icon: MapPinned,
    accent: 'sky',
  },
  {
    title: 'Smartphone-based telematics',
    description:
      'Turn the driver phone into a fleet sensor for location, trip continuity, motion awareness, and owner-side operational visibility.',
    icon: Smartphone,
    accent: 'orange',
  },
  {
    title: 'Safety alert feed',
    description:
      'Surface high-priority warnings, offline activity, and risk signals in a dedicated owner workspace built for fast action.',
    icon: BellRing,
    accent: 'sky',
  },
  {
    title: 'SOS command workflow',
    description:
      'Highlight urgent driver incidents and give fleet owners a quick route to call the driver and open the latest visible location.',
    icon: Siren,
    accent: 'orange',
  },
  {
    title: 'Invite-code onboarding',
    description:
      'Create fleets instantly, share a stable invite code, and connect new drivers in a simple operational flow.',
    icon: Users,
    accent: 'sky',
  },
  {
    title: 'Owner control center',
    description:
      'Move between dashboard, alerts, drivers, maps, and SOS views with a clean operator-first interface.',
    icon: ShieldCheck,
    accent: 'orange',
  },
];

export const futureFeatures = [
  {
    title: 'Weekly driver analysis reports',
    description:
      'Automated summaries of route quality, consistency, late-night movement, idle time, and risky driving patterns for each driver.',
    icon: BarChart3,
  },
  {
    title: 'Audio control inside the cab',
    description:
      'Owner-defined cabin audio prompts and safety nudges for harsh driving, route deviations, and policy reminders.',
    icon: AudioLines,
  },
  {
    title: 'Real-time proactive safety',
    description:
      'Predictive alerts that react before incidents escalate by combining movement signals, silence gaps, and abnormal route behavior.',
    icon: Waves,
  },
  {
    title: 'Driver safety scorecards',
    description:
      'Role-based performance scoring to compare driving quality, consistency, and alert frequency across the fleet every week.',
    icon: Gauge,
  },
];

export const testimonials = [
  {
    quote:
      'We started with phones, not hardware, and still got a cleaner picture of driver movement and exceptions than we expected.',
    name: 'Tarun Sharma',
    role: 'Fleet Owner, Delhi NCR',
  },
  {
    quote:
      'The owner dashboard feels operational. Alerts, drivers, SOS, and maps are exactly where the team expects them to be.',
    name: 'Anchal Verma',
    role: 'Operations Lead, Urban Cab Network',
  },
  {
    quote:
      'SAFAR gave us a practical first step toward telematics without forcing a heavy device rollout across every vehicle.',
    name: 'Rajat Mehra',
    role: 'Independent Fleet Operator',
  },
];

export const pricingPlan = {
  name: 'SAFAR Standard',
  price: '199',
  period: 'month',
  description:
    'Built for early-stage fleets that want live driver visibility, alerting, and a professional owner control center.',
  items: [
    'One active owner workspace',
    'Live fleet dashboard with alerts, maps, and SOS',
    'Driver onboarding through stable invite code',
    'Recent driver feed and high-priority alert tracking',
    'Real-time connected fleet visibility',
    'Roadmap access for future analytics features',
  ],
};

export const aboutPoints = [
  'SAFAR is designed for fleet owners who need practical visibility before they need heavy hardware.',
  'We believe a clean operational system should help you move from raw driver movement to useful decisions quickly.',
  'Our product direction is focused on safety-first telematics, simpler onboarding, and owner tools that feel like real software, not dashboards stitched together as an afterthought.',
];
