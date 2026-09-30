export interface Project {
  id?: string;
  slug: string;
  title: string;
  category: string;
  featured: boolean;
  status: string;
  year: number;
  summary: string;
  description: string;
  problem_solved: string;
  stack: string[];
  tags: string[];
  live_url?: string;
  github_url?: string;
  thumbnail: string;
}

export const projects: Project[] = [
  {
    id: "proj-aura-fintech",
    slug: "aura-fintech",
    title: "Aura Capital",
    category: "FinTech Platform",
    featured: true,
    status: "Live Production",
    year: 2026,
    summary: "Institutional asset management portal engineered with sub-50ms transaction settlement telemetry and zero-latency order books.",
    description: "A comprehensive digital infrastructure overhaul for a private equity and liquidity provider. Features multi-currency routing, audited ledger synchronization, and real-time biometric session authentication.",
    problem_solved: "Replaced an outdated legacy banking interface with a high-velocity Next.js 16 platform, reducing user execution latency by 74% and eliminating state drift during peak market volume.",
    stack: ["Next.js 16", "TypeScript", "Tailwind CSS", "PostgreSQL", "WebSockets"],
    tags: ["Fintech", "Enterprise", "Real-Time Telemetry"],
    live_url: "https://auracapital.example.com",
    thumbnail: "/showcase/aura.png"
  },
  {
    id: "proj-kroma-studio",
    slug: "kroma-studio",
    title: "Kroma Spatial Studio",
    category: "Bespoke Portfolio",
    featured: true,
    status: "Awarded",
    year: 2026,
    summary: "Interactive digital showroom and spatial architecture portfolio built for an international luxury design atelier.",
    description: "An editorial digital experience that bridges industrial design and web technology. Uses hardware-accelerated fluid shaders, dynamic soundscapes, and responsive typography scales.",
    problem_solved: "Engineered responsive WebGL viewport fallbacks that maintain 60fps across low-powered mobile devices while rendering complex physical light simulations.",
    stack: ["Next.js", "Three.js", "Framer Motion", "Tailwind CSS"],
    tags: ["Creative Direction", "3D Architecture", "Editorial"],
    live_url: "https://kromastudio.example.com",
    thumbnail: "/showcase/kroma.png"
  },
  {
    id: "proj-vektor-cloud",
    slug: "vektor-cloud",
    title: "Vektor Observability",
    category: "SaaS Control Plane",
    featured: true,
    status: "Live Production",
    year: 2026,
    summary: "Distributed systems telemetry and microservice observability console processing 12M+ spans/sec.",
    description: "A mission-critical dashboard for cloud engineering teams. Features canvas-rendered flamegraphs, incident response automation, and live multi-region cluster health graphs.",
    problem_solved: "Eliminated client-side memory leakage during high-density log streaming by building a virtualized WebAssembly data parsing worker.",
    stack: ["React 19", "Next.js", "WASM", "Tailwind CSS", "ClickHouse"],
    tags: ["Cloud Infra", "Observability", "DevOps"],
    live_url: "https://vektor.example.com",
    thumbnail: "/showcase/vektor.png"
  },
  {
    id: "proj-solstice-health",
    slug: "solstice-health",
    title: "Solstice Diagnostics",
    category: "HealthTech Platform",
    featured: true,
    status: "Live",
    year: 2025,
    summary: "HIPAA-compliant clinical trials coordination portal and asynchronous telehealth consultation suite.",
    description: "Designed for a nationwide network of genomics clinics, enabling secure patient onboarding, encrypted medical record exchange, and automated specialist scheduling.",
    problem_solved: "Streamlined multi-step patient intake forms from 22 minutes average completion time down to under 4 minutes with zero drop-off.",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Firebase", "WebRTC"],
    tags: ["Healthcare", "HIPAA", "Telehealth"],
    live_url: "https://solsticehealth.example.com",
    thumbnail: "/showcase/solstice.png"
  },
  {
    id: "proj-stratum-protocol",
    slug: "stratum-protocol",
    title: "Stratum Institutional",
    category: "Web3 Protocol",
    featured: false,
    status: "Audited",
    year: 2025,
    summary: "Institutional liquidity staking interface featuring multi-vault risk models and automated rebalancing.",
    description: "High-security decentralized finance portal connecting institutional liquidity providers to audited on-chain smart contracts with hardware wallet signing.",
    problem_solved: "Architected an offline gas-estimation simulator that prevented failed transaction slippage during high-congestion mempool events.",
    stack: ["Next.js", "Tailwind CSS", "Ethers.js", "GraphQL"],
    tags: ["Web3", "Liquidity", "Smart Contracts"],
    live_url: "https://stratumprotocol.example.com",
    thumbnail: "/showcase/stratum.png"
  },
  {
    id: "proj-apex-store",
    slug: "apex-store",
    title: "Apex Atelier",
    category: "Headless Commerce",
    featured: false,
    status: "Live Production",
    year: 2026,
    summary: "Sub-second headless luxury commerce storefront with custom product configurator and instant global checkout.",
    description: "An ultra-fast global eCommerce flaghsip for a bespoke horology brand. Features real-time stock allocation, currency localization, and fluid micro-interactions.",
    problem_solved: "Reduced First Contentful Paint (FCP) from 2.8s to 0.4s and boosted checkout conversion rate by 38% post-migration.",
    stack: ["Next.js 16", "Tailwind CSS", "Shopify Storefront", "Edge Runtime"],
    tags: ["Luxury Commerce", "Headless", "High-Performance"],
    live_url: "https://apexatelier.example.com",
    thumbnail: "/showcase/apex.png"
  }
];

