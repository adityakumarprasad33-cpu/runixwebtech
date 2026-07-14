# Runix Web Technologies  Technical Stack

---

# 1. Stack Philosophy

The Runix Web Technologies  website should use a modern frontend stack that supports:

- premium UI quality
- smooth animations
- strong responsiveness
- scalable code structure
- easy deployment
- future growth into a richer portfolio / service platform

This is not just a static brochure site. It should be built in a way that can grow into a more capable project showcase and inquiry system over time.

---

# 2. Core Frontend Stack

## Framework
**Next.js**

### Why
- excellent for modern production websites
- good routing and page structure
- strong performance
- easy deployment on Vercel
- works well for portfolio + service websites
- scalable if the project grows

---

## Language
**TypeScript**

### Why
- safer component and data structure handling
- better maintainability
- cleaner project scaling
- useful for project data, contact form payloads, and reusable UI components

---

## Styling
**Tailwind CSS**

### Why
- fast UI development
- easy design system consistency
- works well with a premium component-driven workflow
- strong utility-first control for responsive layouts

---

## Animation
**Framer Motion**

### Why
- ideal for premium UI motion
- section reveals, hover polish, and modal transitions
- flexible without being overly heavy for this use case

---

# 3. UI / Icon / Utility Layer

## Icons
**Lucide React**

### Why
- clean icon set
- modern look
- easy to style in a premium interface

---

## Class Utilities
Recommended:
- `clsx`
- `tailwind-merge`

### Why
- cleaner conditional class management
- easier component styling composition

---

# 4. Data / Backend Layer

## Database
**Firebase Firestore**

### Primary use cases
- contact form inquiries
- future lead storage
- future project data storage if moved out of local files
- future lightweight CMS-like admin data
- future testimonials / service content if needed

### Why Firestore over Realtime Database
- better fit for structured documents
- better querying for content-like data
- cleaner for storing leads, projects, metadata, and admin content
- more future-proof for a service/portfolio platform

---

## Optional Firebase Services

### Firebase Storage
Use if you later want:
- uploaded project thumbnails
- showcase assets
- case study media
- admin-managed images

### Firebase Auth
Use only if you later build:
- admin dashboard
- protected project/content management panel

---

# 5. Contact Form Handling Options

## Recommended V1
Use a **Next.js API route / server action + Firestore** for inquiry submission.

### Store:
- name
- email
- company / brand
- project type
- budget range
- timeline
- project details
- createdAt timestamp
- inquiry status (optional future field)

---

# 6. Content Strategy for V1

## Recommended V1 approach
Keep most portfolio content local and structured in code or data files.

### Local content for V1
- projects
- services
- navigation items
- homepage section content
- CTA content
- process steps

### Firestore for V1
- contact inquiries only

This keeps the website simple while still giving you a real backend for leads.

---

# 7. Deployment Stack

## Frontend Hosting
**Vercel**

### Why
- best fit for Next.js
- easy preview deployments
- simple environment variable management
- smooth production workflow

## Backend
Firestore / Firebase services used via environment configuration

---

# 8. Suggested Package Direction

## Core
- next
- react
- react-dom
- typescript
- tailwindcss

## UI / motion / utility
- framer-motion
- lucide-react
- clsx
- tailwind-merge

## Firebase
- firebase

## Optional later
- zod (form validation / schema)
- react-hook-form (advanced form handling)
- sonner or similar toast library if needed

---

# 9. Suggested Folder Usage

## `/src/app`
App router pages and layouts

## `/src/components`
Reusable UI components

## `/src/data`
Static structured content for:
- projects
- services
- nav items
- process steps

## `/src/lib`
Utility functions, Firebase config, helpers

## `/src/types`
Shared TypeScript types

---

# 10. Final Stack Recommendation

## V1 Stack
- Next.js
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- Firebase Firestore
- Vercel

## V1.5 / V2 additions if needed
- Firebase Storage
- Firebase Auth
- zod
- react-hook-form
- admin panel / CMS layer