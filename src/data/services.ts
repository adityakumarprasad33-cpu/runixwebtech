export interface Service {
  id: string;
  title: string;
  summary: string;
  idealFor: string[];
  includes: string[];
  outcomes: string[];
}

export const services: Service[] = [
  {
    id: "service-01",
    title: "Premium Website Design & Development",
    summary: "Custom websites designed and developed for businesses, startups, personal brands, institutions, and creators that need a polished online presence.",
    idealFor: [
      "business websites",
      "company websites",
      "creator / portfolio websites",
      "institution or school websites",
      "service business websites",
      "personal brand websites"
    ],
    includes: [
      "custom UI design direction",
      "responsive frontend development",
      "modern layout and interactions",
      "optimized content sections",
      "contact / lead generation forms",
      "polished mobile experience",
      "deployment-ready build"
    ],
    outcomes: [
      "stronger online presence",
      "better brand perception",
      "clean user experience",
      "improved inquiry / lead flow"
    ]
  },
  {
    id: "service-02",
    title: "Landing Pages & Product Launch Websites",
    summary: "High-quality landing pages built for startups, products, campaigns, launches, waitlists, or lead generation.",
    idealFor: [
      "SaaS landing pages",
      "startup launches",
      "product showcase pages",
      "early access / waitlist pages",
      "campaign pages",
      "lead generation pages"
    ],
    includes: [
      "conversion-focused layout",
      "premium hero and CTA structure",
      "product / feature sections",
      "pricing / FAQ / waitlist sections if needed",
      "responsive build",
      "polished visual storytelling"
    ],
    outcomes: [
      "clearer product communication",
      "stronger first impression",
      "better conversion flow",
      "launch-ready web presence"
    ]
  },
  {
    id: "service-03",
    title: "Dashboards & Admin Panels",
    summary: "Custom dashboards, admin panels, and internal interfaces for managing data, users, operations, or workflows.",
    idealFor: [
      "school / institution systems",
      "internal business tools",
      "analytics dashboards",
      "management panels",
      "CRM-like admin interfaces",
      "role-based dashboard systems"
    ],
    includes: [
      "dashboard UI architecture",
      "admin layouts and navigation",
      "tables, filters, forms, cards, charts",
      "role-aware interface planning if needed",
      "responsive admin design",
      "clean data-driven UI structure"
    ],
    outcomes: [
      "easier management workflows",
      "cleaner internal operations",
      "better usability for staff/admin users",
      "structured control over digital systems"
    ]
  },
  {
    id: "service-04",
    title: "Full Web App / MVP Development",
    summary: "Custom web apps and MVP platforms for founders, businesses, or teams that need more than a static website.",
    idealFor: [
      "MVP products",
      "platform prototypes",
      "user login-based systems",
      "web tools",
      "custom portals",
      "service-based digital products"
    ],
    includes: [
      "frontend + app flow planning",
      "auth-ready architecture if needed",
      "dashboard / panel integration",
      "data-driven pages",
      "modular UI structure",
      "scalable product-style layout"
    ],
    outcomes: [
      "functional MVP launch",
      "faster product validation",
      "polished early-stage web product",
      "better product presentation to users/investors"
    ]
  },
  {
    id: "service-05",
    title: "Website Redesign / UI Modernization",
    summary: "Redesign outdated websites and interfaces into cleaner, more modern, more premium experiences.",
    idealFor: [
      "old business websites",
      "clunky portfolio websites",
      "outdated dashboards",
      "sites with poor mobile experience",
      "websites that no longer match the brand quality"
    ],
    includes: [
      "design cleanup",
      "layout restructuring",
      "improved UI hierarchy",
      "modern styling system",
      "better responsiveness",
      "stronger visual consistency"
    ],
    outcomes: [
      "more premium brand perception",
      "better usability",
      "cleaner presentation",
      "improved confidence for visitors and clients"
    ]
  }
];
