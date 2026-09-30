import { HERO_MANIFEST } from "./hero-manifest";

export type RunixHeroPage = "home" | "services" | "work" | "about" | "pricing" | "contact";

export interface HeroSlide {
  id: string;
  number: string;
  tag: string;
  titleLines: string[];
  supporting: string;
  primaryCta: { text: string; href: string };
  secondaryCta: { text: string; href: string };
  imageSrc: string;
  alt: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "home-01",
    number: "01 / 05",
    tag: "STUDIO",
    titleLines: ["Your idea.", "Built for real life."],
    supporting:
      "We design, build and launch websites, software and digital experiences around the way your business actually works.",
    primaryCta: { text: "Start a Project", href: "/pricing" },
    secondaryCta: { text: "See Our Work", href: "/work" },
    imageSrc: HERO_MANIFEST.home[0],
    alt: "Runix senior engineer developing real software product at modern workstation",
  },
  {
    id: "home-02",
    number: "02 / 05",
    tag: "PORTFOLIO",
    titleLines: ["Real products.", "Real work."],
    supporting: "Explore the digital products and experiences we’ve built for real-world use.",
    primaryCta: { text: "Explore Our Work", href: "/work" },
    secondaryCta: { text: "Start a Project", href: "/pricing" },
    imageSrc: HERO_MANIFEST.home[1],
    alt: "Runix engineer reviewing production analytics and finished web application",
  },
  {
    id: "home-03",
    number: "03 / 05",
    tag: "CAPABILITIES",
    titleLines: ["From idea", "to launch."],
    supporting:
      "We turn business ideas into websites, software and digital products people can actually use.",
    primaryCta: { text: "Explore Services", href: "/services" },
    secondaryCta: { text: "View Pricing", href: "/pricing" },
    imageSrc: HERO_MANIFEST.home[2],
    alt: "Runix engineering workflow showing user flows and digital product architecture",
  },
  {
    id: "home-04",
    number: "04 / 05",
    tag: "TRANSPARENCY",
    titleLines: ["Clear scope.", "Clear delivery."],
    supporting:
      "Understand what you're getting, how the project moves forward, and what happens next.",
    primaryCta: { text: "View Pricing", href: "/pricing" },
    secondaryCta: { text: "Start a Project", href: "/pricing" },
    imageSrc: HERO_MANIFEST.home[3],
    alt: "Runix project scope and milestone configuration interface",
  },
  {
    id: "home-05",
    number: "05 / 05",
    tag: "COLLABORATION",
    titleLines: ["Let’s build", "your next product."],
    supporting: "Tell us what you're building. We’ll help define the right way forward.",
    primaryCta: { text: "Start a Project", href: "/contact" },
    secondaryCta: { text: "Explore Pricing", href: "/pricing" },
    imageSrc: HERO_MANIFEST.home[4],
    alt: "Runix developer completing product sprint ready for client review",
  },
];

// Dedicated hero scenes for internal pages
export interface DedicatedHeroConfig {
  tag: string;
  titleLines: string[];
  supporting: string;
  primaryCta: { text: string; href: string };
  secondaryCta?: { text: string; href: string };
  imageSrc: string;
  alt: string;
}

export const DEDICATED_HEROES: Record<Exclude<RunixHeroPage, "home">, DedicatedHeroConfig> = {
  work: {
    tag: "PORTFOLIO",
    titleLines: ["Real products.", "Real work."],
    supporting: "Explore the digital products and experiences we’ve built for real-world use.",
    primaryCta: { text: "Start a Project", href: "/pricing" },
    secondaryCta: { text: "Get in Touch", href: "/contact" },
    imageSrc: HERO_MANIFEST.work,
    alt: "Runix portfolio case studies and production applications",
  },
  services: {
    tag: "CAPABILITIES",
    titleLines: ["From idea", "to launch."],
    supporting:
      "We turn business ideas into websites, software and digital products people can actually use.",
    primaryCta: { text: "Configure Pricing", href: "/pricing" },
    secondaryCta: { text: "View Portfolio", href: "/work" },
    imageSrc: HERO_MANIFEST.services,
    alt: "Runix engineering capabilities from UI architecture to cloud delivery",
  },
  about: {
    tag: "ABOUT RUNIX",
    titleLines: ["The people", "behind the build."],
    supporting:
      "Runix brings design, engineering and product thinking together to build useful digital experiences.",
    primaryCta: { text: "Start a Conversation", href: "/contact" },
    secondaryCta: { text: "View Our Work", href: "/work" },
    imageSrc: HERO_MANIFEST.about,
    alt: "Runix engineering team collaborating in architectural studio",
  },
  pricing: {
    tag: "TRANSPARENCY",
    titleLines: ["Clear scope.", "Clear delivery."],
    supporting:
      "Understand what you're getting, how the project moves forward, and what happens next.",
    primaryCta: { text: "Select Package", href: "#pricing-tiers" },
    secondaryCta: { text: "Talk to Engineering", href: "/contact" },
    imageSrc: HERO_MANIFEST.pricing,
    alt: "Runix milestone pricing and transparent package tiers",
  },
  contact: {
    tag: "COLLABORATION",
    titleLines: ["Let’s build", "your next product."],
    supporting: "Tell us what you're building. We’ll help define the right way forward.",
    primaryCta: { text: "Send Message", href: "#intake-form" },
    secondaryCta: { text: "Explore Pricing", href: "/pricing" },
    imageSrc: HERO_MANIFEST.contact,
    alt: "Runix engineering intake and direct technical inquiry",
  },
};
