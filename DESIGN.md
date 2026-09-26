---
version: alpha
name: FelLaw
description: Calm, evidence-honest legal navigation for people under pressure.
colors:
  primary: "#102A43"
  secondary: "#486581"
  tertiary: "#0F766E"
  neutral: "#F7F5F0"
  on-primary: "#FFFFFF"
  on-tertiary: "#FFFFFF"
  ink: "#172B4D"
  surface: "#FFFFFF"
  attention: "#B45309"
  danger: "#B42318"
typography:
  h1:
    fontFamily: Public Sans
    fontSize: 3.5rem
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  h2:
    fontFamily: Public Sans
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: Public Sans
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.55
  label-caps:
    fontFamily: Public Sans
    fontSize: 0.75rem
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.08em"
rounded:
  sm: 6px
  md: 10px
  lg: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.sm}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 24px
---

## Overview

FelLaw should feel like a calm, well-organised legal desk: trustworthy without
being intimidating, direct without being abrupt, and useful before a person
knows exactly what to ask. The visual language is original and editorial rather
than a clone of any reference product.

The primary home surface is **Decide / Learn**: one clear first action, one
always-visible urgent path, and enough explanation to establish trust. Case
surfaces are **Monitor** surfaces: deadlines, status, and the next action lead.
Intake is **Configure**: progressive disclosure, recoverable progress, and
plain language reduce cognitive load.

## Colors

- **Primary (#102A43):** Deep navy for structure, headings, and trust.
- **Secondary (#486581):** Supporting copy and metadata.
- **Tertiary (#0F766E):** The single interaction accent for primary actions and
  selected states.
- **Neutral (#F7F5F0):** Warm paper page background, reducing clinical glare.
- **Attention (#B45309):** Deadlines and caution, never decoration.
- **Danger (#B42318):** Urgent action only.

## Typography

Public Sans is the deliberate product typeface: open, legible, and strong at
small sizes. Use weight and spacing for hierarchy before adding containers.
Display headings are compact; body copy is generous. Avoid all-caps except for
small labels. Never use long text inside low-contrast muted styles.

## Layout

Use a 4px baseline and an 8px working rhythm. Keep reading width near 1200px.
On mobile, stack content and keep the primary action within thumb reach. Use
asymmetric hierarchy: the next action leads, supporting context follows.
Avoid equal-weight card grids and decorative metric rows.

## Elevation & Depth

Prefer flat warm page background, white surfaces, and one-pixel neutral borders.
Use a small shadow only for overlays and the assistant. Depth should clarify
layering, not simulate glass.

## Shapes

Use 6px controls and 10px grouped surfaces. Reserve full pills for statuses and
filters. Do not round every section or use oversized capsules as decoration.

## Components

- `button-primary` is the only high-emphasis action on a screen.
- Urgent action uses danger color and a clear label; it is never hidden in a
  menu.
- Status labels pair color with text/icon; color alone never carries meaning.
- Forms expose progress, validation, save/resume, and what happens next.
- Assistant messages include source state and the RDG legal-information
  boundary.

## Do's and Don'ts

- Do use calm hierarchy, explicit next actions, real loading/empty/error states,
  and visible focus.
- Do use `prefers-reduced-motion` and 44px minimum interactive targets.
- Don't use fake success numbers, invented testimonials, or unsupported claims.
- Don't use blue-violet gradients, glassmorphism, icon-topper feature tiles, or
  decorative animated backgrounds.
