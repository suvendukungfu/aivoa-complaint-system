# AIVOA Product Design System

## Overview
AIVOA is an AI-assisted Pharmaceutical Customer Complaint Management and Risk Triage System (GxP / 21 CFR Part 11 / EU Annex 11 compliant). The visual system blends **monochrome liquid-glass aesthetics** with the rigorous precision required for regulated life-sciences operations.

---

## 1. Design Tokens & Monochrome Palette

### Base Foundation
- `--bg-app`: `#080909` (Dark atmospheric canvas)
- `--bg-surface`: `#0C0D0E` (Primary component surface)
- `--bg-elevated`: `#111214` (Elevated card/popover surface)
- `--bg-sidebar`: `rgba(255, 255, 255, 0.025)` (Blurred navigation container)

### Text Hierarchy
- **Primary Text**: `#FFFFFF` (Headings, active labels, critical values)
- **Secondary Text**: `rgba(255, 255, 255, 0.78)` (Body text, subheadings)
- **Tertiary Text**: `rgba(255, 255, 255, 0.55)` (Secondary metadata, inactive nav items)
- **Muted Text**: `rgba(255, 255, 255, 0.38)` (Timestamps, placeholders, fine print)

---

## 2. Liquid Glass Hierarchy Tiers

| Tier | Blur | Background | Border | Primary Use Case |
|---|---|---|---|---|
| **Subtle Glass** | `8px` | `rgba(255, 255, 255, 0.025)` | `1px solid rgba(255, 255, 255, 0.07)` | Global sidebar, topbar, filters, secondary pills |
| **Standard Glass** | `18px` | `rgba(255, 255, 255, 0.04)` | `1px solid rgba(255, 255, 255, 0.09)` | KPI cards, operational tables, document lists, audit stream |
| **Strong Glass** | `40px` | `rgba(255, 255, 255, 0.065)` | `1px solid rgba(255, 255, 255, 0.14)` | AIVOA Copilot panel, AI proposals, primary hero CTA |
| **Decision Glass** | `50px` | `rgba(12, 13, 14, 0.88)` | `1px solid rgba(255, 255, 255, 0.16)` | Decision modals, forensic evidence inspect popovers |

---

## 3. Typography Scale & Tabular Numerals
- **Typeface**: `Inter Variable` / `-apple-system` for UI; `JetBrains Mono` for batch numbers, timestamps, IDs, and code spans.
- **Scale**:
  - Page Titles: `24–28px` (Font-weight `600`, tracking `-0.03em`)
  - Section Headers: `15–18px` (Font-weight `600`, tracking `-0.02em`)
  - Card Titles: `13.5–14.5px` (Font-weight `600`)
  - Body Text: `13–13.5px` (Font-weight `400`, line-height `1.5`)
  - Metadata / Pills: `10.5–11.5px` (Font-weight `600`, tracking `0.06em`, uppercase)
  - Numerals: Enabled `font-feature-settings: "tnum" 1` for flicker-free data alignment in tables and KPI counters.

---

## 4. Sparingly Used Semantic QMS Colors
Colors appear strictly to communicate regulatory quality states, never as decorative background gradients:
- **Critical Risk**: `#EF4444` / `#F87171` (`rgba(239, 68, 68, 0.12)`)
- **High Risk**: `#F59E0B` / `#FBBF24` (`rgba(245, 158, 11, 0.12)`)
- **Medium Risk**: `#EAB308` (`rgba(234, 179, 8, 0.12)`)
- **Low Risk / Approved**: `#10B981` / `#34D399` (`rgba(16, 185, 129, 0.12)`)

---

## 5. Motion & Transitions
- **Fast**: `120ms` (hover, tab switches, dropdown reveals)
- **Normal**: `180ms` (page transitions, drawer sliding)
- **Slow**: `280ms` (modals, hero reveal)
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)`
- **Reduced Motion**: Full support honoring `@media (prefers-reduced-motion: reduce)`.
