# SHOWCASE_VIEWER_SPEC.md

# Runix Web Technologies  Showcase Viewer Specification

---

# 1. Purpose

The showcase viewer is a core part of the Runix Web Technologies  website. It exists to present live websites and projects in a premium, interactive, product-like way instead of using a boring plain project list.

The viewer should help users:
- understand what each project looks like
- explore live work
- get a premium impression of Runix Web Technologies capabilities
- quickly move from project interest to inquiry

---

# 2. Showcase System Overview

The showcase system should have three layers:

## Layer 1 — Homepage Featured Showcase
A curated section on the homepage with selected featured projects.

## Layer 2 — Work Page Project Grid
A larger library/grid of projects with categories, tags, and actions.

## Layer 3 — Live Preview / Viewer Interaction
A modal or dedicated viewer experience that allows the user to preview the project in a browser-style frame or open the live site.

---

# 3. Core Showcase Content per Project

Each project entry should support:
- project title
- category
- short summary
- tags / stack
- thumbnail / hero image
- live URL
- case study link (if available)
- featured status

---

# 4. Project Card Requirements

Each project card should include:
- thumbnail or project visual
- project title
- one-line summary
- category or type
- small tag list
- CTA buttons

## Recommended CTA buttons
- Live Preview
- View Project / Case Study
- Open Live Site (optional depending on UI)

---

# 5. Live Preview Modal / Viewer

## Purpose
Give users a more immersive look at a project without instantly forcing a new tab.

## Modal should include
- browser-style top bar
- project name
- project category or tags
- preview area
- external open button
- close button
- optional mobile/desktop preview toggle

## Preferred behavior
- if the site allows embedding, load a preview inside the viewer
- if the site blocks embedding, show a polished fallback state with:
  - screenshot / thumbnail
  - project summary
  - clear “Open Live Site” CTA

---

# 6. Performance Rules

## Critical rule
Do **not** load all live website iframes on page load.

Instead:
- show static thumbnails / screenshots first
- only initialize preview content when the user opens a project viewer or requests preview
- lazy-load preview content

This is mandatory to avoid a slow, bloated website.

---

# 7. Homepage Showcase Behavior

Homepage showcase should:
- feature only a limited number of best projects
- feel curated, not overloaded
- encourage users to go to the Work page for more

Possible layouts:
- 2–4 featured cards
- horizontal project panel carousel
- stacked project windows
- large featured project + smaller secondary cards

---

# 8. Work Page Showcase Behavior

The Work page should:
- contain a larger project library
- support clean card layout
- allow project exploration without clutter
- optionally allow category filtering later

Potential categories:
- Website
- Dashboard
- Web App
- Landing Page
- Portfolio
- Internal Tool
- AI Product

---

# 9. Browser-Style Viewer Aesthetic

The viewer should visually resemble a premium modern browser / product demo panel:
- rounded frame
- dark top bar
- minimal control dots or tab-like header
- subtle border
- clean loading state
- not a literal OS recreation, just a polished browser-inspired shell

---

# 10. Fallback Rules

If a live preview cannot be embedded:
- do not break the modal
- show project screenshot / mockup
- show summary and stack
- include “Open Live Site” CTA
- include “View Case Study” CTA if available

---

# 11. UX Rules

- opening a project should feel smooth
- modal should not feel heavy or awkward
- user should always know how to close / exit
- preview actions should be obvious
- the showcase should feel like part of the premium product design system

---

# 12. Future Expansion

The viewer system should be scalable enough to later support:
- image galleries
- case study sections
- multiple screenshots per project
- mobile preview mode
- project metadata like year, client type, stack, and outcomes