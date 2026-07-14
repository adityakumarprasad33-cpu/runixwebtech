# DEVELOPMENT_RULES.md

# Runix Web Technologies  Development Rules

---

# 1. Purpose

These rules define how the Runix Web Technologies  website should be built so the codebase stays clean, scalable, and production-quality rather than turning into a messy AI-generated pile of random components.

---

# 2. Core Development Principles

- build reusable components
- keep code modular
- prioritize readability
- avoid duplication
- keep the UI system consistent
- favor clean architecture over quick hacks
- maintain responsive quality from the start
- keep performance in mind for every major section

---

# 3. Code Quality Rules

## General
- use clean folder structure
- keep component files focused and readable
- do not create giant page files with all logic inside one component
- extract repeated UI patterns into reusable components
- use semantic HTML where appropriate
- keep naming clear and consistent

## Type Safety
- use TypeScript properly
- avoid unnecessary `any`
- define types/interfaces for project data, service data, and reusable component props

---

# 4. Styling Rules

- use a consistent Tailwind-based styling approach
- avoid repeated giant class blobs if reusable patterns can be abstracted
- match all spacing, border radius, and typography to the design system
- do not introduce random styles that break the visual language
- keep accent color usage controlled

---

# 5. Component Rules

- build project cards as reusable components
- build section headers as reusable components
- build service cards as reusable components
- build CTA sections in a consistent pattern
- form fields should use shared styling
- modal structure should be reusable if possible

---

# 6. Data Rules

Projects and service content should be data-driven where possible.

Use structured data files or content objects for:
- projects
- services
- navigation items
- contact form options
- process steps

Avoid hardcoding repeated content inside page components when it can live in a data source.

---

# 7. Responsive Rules

- mobile-first behavior should be considered from the start
- every section must work cleanly on mobile, tablet, and desktop
- hero content must remain readable on smaller screens
- project cards must stack gracefully
- navigation must remain easy to use
- modals must not break on mobile

---

# 8. Performance Rules

- do not load heavy content unnecessarily
- lazy-load project preview content where appropriate
- do not load multiple live iframes on page load
- optimize images
- avoid dependency bloat
- avoid huge animation bundles for simple effects

---

# 9. Accessibility Rules

- use accessible button and link patterns
- maintain readable contrast
- make forms keyboard-usable
- ensure modal close actions are clear
- use proper labels for form fields
- avoid interactions that rely only on hover

---

# 10. Content Rules

- do not use lorem ipsum in final build
- do not use fake testimonials or fake client logos
- label concept/demo projects honestly
- keep copy aligned with the brand voice
- do not use generic stock agency phrases everywhere

---

# 11. Animation Rules

- keep motion subtle and premium
- do not animate everything
- hover states should feel polished, not loud
- reveal animations should support content hierarchy
- use reduced-motion-friendly patterns where possible

---

# 12. Showcase Rules

- project showcase is a major feature and should feel premium
- do not embed all live websites at once
- viewer / modal interactions must be smooth
- cards should remain useful even without live embed
- fallback behavior must be polished

---

# 13. Build Quality Standard

The final website should feel like:
- a real premium product website
- a modern service brand
- a portfolio with intentional UX

It should not feel like:
- a random AI template
- a pile of mismatched sections
- an over-animated dribbble clone
- a generic freelancer page with no structure