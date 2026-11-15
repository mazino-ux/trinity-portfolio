export type ProjectCategory = 'Products' | 'Contract' | 'Experiments';

export interface ProjectItem {
  slug: string;
  title: string;
  category: ProjectCategory;
  year: string;
  summary: string;
  overview: string;
  role: string;
  stack: string[];
  highlights: string[];
  liveUrl?: string;
  liveLabel?: string;
  internalAnchor?: string;
}

export interface StatItem {
  label: string;
  value: string;
  detail: string;
}

export interface BuildStep {
  number: string;
  title: string;
  description: string;
  detail: string;
}

export interface StackGroup {
  category: string;
  items: string[];
}

export const PORTFOLIO_PROFILE = {
  name: 'Trinity Ogwezi',
  fullName: 'Trinity Ogwezi Ishioma',
  role: 'Software Engineer',
  location: 'Lagos, NG',
  status: 'Building',
  email: 'mazinoishioma@gmail.com',
  githubUrl: 'https://github.com/mazino-ux',
  githubHandle: 'github.com/mazino-ux',
  linkedinUrl: 'https://www.linkedin.com/in/trinity-ogwezi-407809270/',
  portfolioUrl: 'https://triniportfolio.vercel.app',
  avatarPath: '/assets/aistudio/my-motivation-purple_4cccfcfc.png',
  tagline: 'Full-stack engineering across frontend, backend, APIs, and infrastructure.',
  aboutIntro:
    'I am a Full-Stack Software Engineer based in Lagos, Nigeria with 4+ years of experience building frontend applications, backend systems, and end-to-end integrations. I serve as Technical Lead at Cryptware Systems Limited on Nigeria’s national e-invoicing platform, and as Founding Engineer & Chief Technical Officer at GafGas Global Limited—alongside CI/CD, Cloudflare, DNS, and DevOps delivery.',
};

export const ABOUT_STATS: StatItem[] = [
  {
    label: 'Experience',
    value: '4+ years',
    detail: 'Full-stack · Frontend, backend & integrations',
  },
  {
    label: 'Cryptware Systems',
    value: 'Technical Lead',
    detail: '150+ enterprise clients · National e-invoicing',
  },
  {
    label: 'GafGas Global',
    value: 'Founding Eng / CTO',
    detail: 'Full-stack platform, APIs & SEO website',
  },
  {
    label: 'Education & Status',
    value: 'ADSE, Distinction',
    detail: 'Aptech · BSc Middlesex (in progress) · Available',
  },
];

export const PROJECTS: ProjectItem[] = [
  {
    slug: 'cryptware-einvoicing',
    title: 'Cryptware e-Invoicing Platform',
    category: 'Products',
    year: '2025–Present',
    summary:
      'National e-invoicing platform at Cryptware Systems serving 150+ enterprise clients across oil & gas, banking, and manufacturing.',
    overview:
      'Core platform built and operated at Cryptware Systems Limited, an accredited Access Point Provider and System Integrator under Nigeria’s national e-invoicing initiative. Engineered to handle high-volume fiscal validation, enterprise system integrations, and continuous transmission reliably across regulated industries.',
    role: 'Software Engineer (Technical Lead) — owned the software lifecycle end-to-end across backend services, frontend/web presence, APIs, integration support, and technical documentation for 150+ enterprise clients.',
    stack: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'REST APIs', 'Cloudflare', 'CI/CD'],
    highlights: [
      'Led production readiness and go-live onboarding for 150+ enterprise clients.',
      'Engineered systems supporting 2,000–3,000 invoices daily and 10,000–20,000+ weekly.',
      'Resolved complex cross-system integration issues across APIs, databases, and validation workflows.',
    ],
  },
  {
    slug: 'gafgas',
    title: 'GafGas Global Limited',
    category: 'Products',
    year: '2026–Present',
    summary:
      'Gas cylinder delivery platform for the Nigerian market — multi-role backend, logistics, payments, and SEO-friendly web presence.',
    overview:
      'End-to-end digital platform for GafGas Global Limited covering customer ordering, driver dispatch, gas plant operations, automated payments/refunds, and an SEO-friendly public website at gafgasglobal.com.',
    role: 'Founding Engineer & Chief Technical Officer (CTO) — built the SEO-friendly website, architected the backend from scratch in Node.js/TypeScript/PostgreSQL, aligned Flutter mobile API contracts, and set up CI/CD & cloud infrastructure.',
    stack: ['Node.js', 'TypeScript', 'Express', 'PostgreSQL', 'Flutterwave', 'Firebase FCM', 'SEO', 'CI/CD'],
    highlights: [
      'Built and launched the SEO-friendly company website at gafgasglobal.com.',
      'Architected a multi-role RBAC API for customers, drivers, gas plant operators, and administrators.',
      'Integrated Flutterwave payments with automated cancellation refunds and real-time FCM push notifications.',
    ],
    liveUrl: 'https://gafgasglobal.com/',
    liveLabel: 'Visit live project',
  },
  {
    slug: 'vtickets',
    title: 'vtickets',
    category: 'Products',
    year: '2023–2024',
    summary:
      'Event ticketing platform built from the ground up with real-time seat synchronization and fast checkout.',
    overview:
      'A high-conversion event ticketing and live booking web application built for organizers and attendees. Engineered for speed on mobile networks and synchronized seat availability during peak ticket drops.',
    role: 'Lead Frontend Developer — built the Next.js frontend architecture from scratch, implemented WebSocket seat locking, optimized bundle delivery, and maintained a reusable Tailwind CSS and Storybook component system.',
    stack: ['Next.js', 'React', 'TypeScript', 'WebSockets', 'Tailwind CSS', 'Storybook'],
    highlights: [
      'Generated ₦3M+ in revenue within the first three months after launch.',
      'Reduced initial load time by ~1.8 seconds via code splitting, dynamic imports, and tree-shaking.',
      'Synchronized live seat availability across concurrent buyers using WebSockets.',
    ],
    liveUrl: 'https://vtickets.site',
    liveLabel: 'Visit live project',
  },
  {
    slug: 'a1quest',
    title: 'A1Quest',
    category: 'Contract',
    year: '2025',
    summary:
      'Educational platform featuring an idempotent coupon rewards and commission routing engine.',
    overview:
      'An educational technology platform requiring a dependable referral and coupon rewards layer capable of routing commissions accurately between students, teachers, and partner schools during concurrent checkout flows.',
    role: 'Backend Developer (Contract) — designed and integrated the coupon rewards engine into the Node.js and MongoDB platform, enforcing strict idempotency and pre-checkout validation rules.',
    stack: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'Idempotency Keys'],
    highlights: [
      'Built transaction-level idempotency checks to eliminate duplicate wallet credits under concurrent payments.',
      'Implemented configurable wallet commission routing with auto-created wallets and audit trails.',
      'Delivered production fixes alongside a 14-page technical handover document.',
    ],
  },
  {
    slug: 'plugd',
    title: 'PLUGD',
    category: 'Products',
    year: '2025',
    summary:
      'Cross-functional software product coordinating Python services, PostgreSQL, and a React frontend.',
    overview:
      'A multi-team digital product engineered to unify backend data services and a responsive React web experience under predictable automated deployments.',
    role: 'Technical Project Lead — aligned backend, frontend, and design contributors, orchestrated architecture across Python services and React, and built the automated CI/CD pipeline.',
    stack: ['React', 'Python', 'PostgreSQL', 'Docker', 'GitHub Actions', 'REST APIs'],
    highlights: [
      'Coordinated delivery across backend, frontend, and product design teams.',
      'Integrated Python backend services and PostgreSQL schemas with a React frontend.',
      'Automated builds and deployments using Docker and GitHub Actions.',
    ],
  },
  {
    slug: 'bug-squash',
    title: 'Bug Squash',
    category: 'Experiments',
    year: '2026',
    summary:
      'Playable interactive mini-game experiment built into this portfolio with escalating speed and theme adaptation.',
    overview:
      'A lightweight browser reflex experiment celebrating the daily engineering ritual of catching bugs before they slip past the boundary into production.',
    role: 'Creator & Engineer — designed the animation loop, hit detection, progressive difficulty curve, and keyboard-accessible controls.',
    stack: ['React', 'TypeScript', 'GSAP', 'CSS Variables'],
    highlights: [
      'Adapts seamlessly to every portfolio colour swatch and light/dark mode.',
      'Progressive speed scaling and combo multipliers as your squash count climbs.',
      'Playable alongside Seat Lock Blitz in the interactive arcade.',
    ],
    internalAnchor: '#bug-squash',
    liveLabel: 'Play Bug Squash',
  },
];

export const MARQUEE_TOOLS: string[] = [
  'React',
  'Next.js',
  'TypeScript',
  'Node.js',
  'PostgreSQL',
  'Spring Boot',
  'Python',
  'REST APIs',
  'Cloudflare',
  'DNS & DevOps',
  'Docker',
  'CI/CD',
  'Vercel',
  'Git',
];

export const STACK_GROUPS: StackGroup[] = [
  {
    category: 'Frontend & Mobile',
    items: ['React', 'Next.js', 'Vite', 'TypeScript', 'Tailwind CSS', 'Flutter / Dart'],
  },
  {
    category: 'Backend & APIs',
    items: ['Node.js', 'Express', 'Java / Spring Boot', 'Python / Django', 'REST APIs', 'GraphQL'],
  },
  {
    category: 'Data & Caching',
    items: ['PostgreSQL', 'MongoDB', 'Redis', 'Firebase', 'Supabase', 'Sequelize'],
  },
  {
    category: 'Cloud, DNS & DevOps',
    items: ['Cloudflare', 'DNS Management', 'CI/CD (GitHub Actions)', 'Docker', 'AWS', 'Vercel & Render'],
  },
];

export const BUILD_STEPS: BuildStep[] = [
  {
    number: '01',
    title: 'Understand',
    description: 'Map business constraints, integration contracts, and failure modes before writing code.',
    detail: 'I talk with stakeholders, inspect existing APIs or regulatory specs, and pinpoint edge cases early.',
  },
  {
    number: '02',
    title: 'Architect',
    description: 'Design resilient data models, idempotent endpoints, and clean module boundaries.',
    detail: 'Clear schemas, role-based access rules, and predictable state transitions keep systems maintainable.',
  },
  {
    number: '03',
    title: 'Build',
    description: 'Write well-typed frontend and backend code paired with verification and CI/CD.',
    detail: 'Fast, accessible interfaces meet battle-tested Node.js, Python, or Spring Boot services.',
  },
  {
    number: '04',
    title: 'Ship & Scale',
    description: 'Own production readiness, DNS/Cloudflare routing, and latency under real load.',
    detail: 'From onboarding 150+ enterprise clients to shaving seconds off load times, shipping is where reliability begins.',
  },
];

export const SUGGESTED_QUESTIONS: string[] = [
  "What's Trinity's experience with enterprise systems?",
  'Tell me about GafGas and vtickets.',
  'What is your full stack, DevOps, and education?',
];
