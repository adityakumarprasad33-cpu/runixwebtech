# ACCESSIBILITY_SPEC.md

# Runix Web Technologies  Accessibility Specification

---

# 1. Goal

The Runix Web Technologies  website should be usable, readable, and navigable for a broad range of users, including people navigating by keyboard, users with low vision, and users who benefit from clearer structure and predictable interactions.

Accessibility should be treated as a core quality standard, not an afterthought.

---

# 2. Accessibility Principles

- clear visual hierarchy
- readable text contrast
- keyboard-accessible navigation
- form usability
- predictable interactions
- meaningful semantics
- accessible modals and interactive components

---

# 3. Keyboard Accessibility

The website should support keyboard navigation for:
- navbar links
- buttons
- project cards if interactive
- modal open / close actions
- contact form fields
- submit buttons

Requirements:
- visible focus states
- logical tab order
- modal should trap focus if implemented as a true modal
- escape key should close modal where appropriate

---

# 4. Color / Contrast Rules

- body text must be readable against dark backgrounds
- muted text should still remain readable
- buttons and links should have clear contrast
- hover/focus states should not rely only on subtle color changes that become invisible

---

# 5. Semantic HTML Requirements

Use appropriate HTML where possible:
- `header`
- `nav`
- `main`
- `section`
- `footer`
- proper heading structure
- `button` for actions
- `a` for links
- `label` + input associations for forms

---

# 6. Form Accessibility

Contact form requirements:
- every field should have a visible label
- required fields should be clear
- error states should be understandable
- placeholders should not replace labels
- focus state should be visible
- textarea should be easy to use on mobile

---

# 7. Image / Media Accessibility

- important project thumbnails should have meaningful alt text
- decorative images can use empty alt text if appropriate
- avoid using images that contain critical unreadable text without backup context

---

# 8. Motion Accessibility

- animations should not be overwhelming
- support reduced-motion preferences where possible
- avoid flashing or jarring movement
- content should remain readable during animation

---

# 9. Modal Accessibility

If the showcase viewer uses a modal:
- focus should move into the modal when opened
- user should be able to close it with keyboard
- focus should return to the trigger after close if possible
- modal content should be readable and navigable

---

# 10. Responsive Accessibility

On mobile:
- tap targets should be large enough
- forms should remain usable
- menus should be easy to open/close
- text should not become too small
- layout should not create horizontal scrolling

---

# 11. Accessibility Quality Standard

The site should aim to feel:
- clear
- easy to navigate
- readable
- stable
- usable without precision mouse interaction

Accessibility is part of the premium experience, not separate from it.