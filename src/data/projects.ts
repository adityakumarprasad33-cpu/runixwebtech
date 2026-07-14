export interface Project {
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
    slug: "runix-ai",
    title: "Runix AI",
    category: "AI Web App",
    featured: true,
    status: "live",
    year: 2026,
    summary: "AI-powered platform designed to provide intelligent assistance and insights.",
    description: "Runix AI is an advanced web application leveraging modern AI capabilities to deliver smart tools and a seamless user experience.",
    problem_solved: "Users need quick, intelligent access to tools and information without a cluttered interface.",
    stack: ["Next.js", "Tailwind CSS", "AI Integration"],
    tags: ["AI", "Web App", "Dashboard"],
    live_url: "https://runixai.netlify.app/",
    thumbnail: "/images/projects/campus-gpt.jpg", // placeholder path
  },
  {
    slug: "runix-tech-website",
    title: "Runix Web Technologies Website",
    category: "Brand Website / Portfolio",
    featured: true,
    status: "in progress",
    year: 2026,
    summary: "Premium web presence for Runix Web Technologies designed to showcase services, projects, and live work through a polished portfolio system.",
    description: "The Runix Web Technologies website is a premium service and showcase platform designed to present the brand’s web development capabilities, portfolio, and inquiry flow.",
    problem_solved: "Need for a modern, premium, conversion-ready web presence for the Runix Web Technologies brand.",
    stack: ["Next.js", "Tailwind CSS", "Framer Motion"],
    tags: ["Portfolio", "Agency", "Showcase", "UI"],
    thumbnail: "/images/projects/runix.jpg",
  },
  {
    slug: "school-website-concept",
    title: "CoachEdu - Institution Website",
    category: "Website",
    featured: true,
    status: "live",
    year: 2026,
    summary: "Modern educational website focused on clean structure, trust, and student-parent communication.",
    description: "A complete website for a school or institution designed with structured information architecture, modern visuals, and clean communication of admissions, academics, and contact details.",
    problem_solved: "Many school websites look outdated and hard to navigate, reducing trust and usability.",
    stack: ["Next.js", "Tailwind CSS"],
    tags: ["Education", "Website", "UI", "Institution"],
    live_url: "https://coachedu.netlify.app/",
    thumbnail: "/images/projects/school.jpg",
  },
  {
    slug: "dashboard-admin-panel",
    title: "Dashboard / Admin Panel UI",
    category: "Dashboard",
    featured: false,
    status: "demo / concept",
    year: 2026,
    summary: "Modern admin panel concept for managing users, data, and workflows in a clean, scalable interface.",
    description: "A dashboard/admin panel interface concept designed to show Runix Web Technologies’s capability in building structured internal tools and management interfaces.",
    problem_solved: "Businesses and institutions often need cleaner internal interfaces for managing operations and data.",
    stack: ["Next.js", "Tailwind CSS"],
    tags: ["Dashboard", "Admin Panel", "Internal Tool", "UI"],
    thumbnail: "/images/projects/dashboard.jpg",
  },
  {
    slug: "savion-pg",
    title: "Savion PG",
    category: "Web App / Dashboard",
    featured: true,
    status: "live",
    year: 2026,
    summary: "Comprehensive PG and hostel management application with clean user interfaces.",
    description: "Savion PG is a management application designed for hostels and paying guest accommodations, offering a clear dashboard for tracking residents, payments, and facilities.",
    problem_solved: "Managing PG accommodations often involves messy spreadsheets; this provides a clean, unified dashboard.",
    stack: ["Next.js", "Tailwind CSS"],
    tags: ["Dashboard", "Management", "Property", "UI"],
    live_url: "https://savion-pg.netlify.app/",
    thumbnail: "/images/projects/landing.jpg",
  }
];
