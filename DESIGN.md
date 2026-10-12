---
{
  "name": "MasterMind Network Editorial",
  "description": "An ivory working canvas and ink network for cross-team knowledge handoffs.",
  "colors": {
    "bg-canvas": "#f5f3ee",
    "bg-surface": "#faf9f5",
    "bg-raised": "#fff",
    "bg-hover": "#ece9e1",
    "bg-active": "#e5e0d5",
    "text-primary": "#191c20",
    "text-secondary": "#5e605f",
    "text-tertiary": "#6e706b",
    "border": "#deddd4",
    "border-strong": "#c9c9bf",
    "accent": "#b63d20",
    "accent-soft": "#f9ebe2",
    "success": "#286847",
    "success-soft": "#eaf3ec",
    "warning": "#855d14",
    "warning-soft": "#f8efdc",
    "danger": "#b42318",
    "danger-soft": "#fff0eb",
    "brand-red": "#eb001b",
    "brand-gold": "#f79e1b",
    "brand-orange": "#ff5f00",
    "rail": "#191c20",
    "rail-hover": "#282c31",
    "rail-text": "#b7bcbf"
  },
  "typography": {
    "display": {
      "fontFamily": "Bricolage Grotesque, Arial, sans-serif"
    },
    "body": {
      "fontFamily": "DM Sans, Arial, sans-serif",
      "fontSize": "15px",
      "lineHeight": 1.5
    },
    "label": {
      "fontFamily": "DM Sans, Arial, sans-serif",
      "fontSize": "13px",
      "fontWeight": 600
    }
  },
  "rounded": {
    "button": "7px",
    "field": "8px",
    "panel": "12px",
    "tag": "5px"
  },
  "spacing": {
    "compact": "8px",
    "control": "14px",
    "panel": "20px",
    "section": "24px"
  },
  "components": {
    "button-primary": {
      "backgroundColor": "{colors.text-primary}",
      "textColor": "{colors.bg-raised}",
      "rounded": "{rounded.button}",
      "padding": "9px 15px"
    },
    "button-secondary": {
      "backgroundColor": "{colors.bg-surface}",
      "textColor": "{colors.text-primary}",
      "rounded": "{rounded.button}",
      "padding": "9px 15px"
    },
    "knowledge-network": {
      "backgroundColor": "{colors.rail}",
      "textColor": "{colors.bg-raised}",
      "rounded": "{rounded.panel}",
      "padding": "20px"
    }
  }
}
---

# Design System: MasterMind

## Overview

**Creative North Star: "Network editorial"**

Network editorial places an immediately usable question workspace beside a substantial knowledge-network canvas. Warm ivory supports reading; the dark rail and network establish orientation. Gold identifies actual pending handoffs rather than decorative activity.

**Key Characteristics:**

- Dark navigation rail and ivory work surface.
- Bricolage Grotesque headings with DM Sans body text.
- A knowledge network tied to selected teams and real request state.

## Colors

Primary ink carries text and actions. The restrained rust accent supports focus and emphasis. Warm canvas, surface, hover, and border tones separate reading layers. Green, amber, and red remain semantic response, caution, and error colors. Brand red, gold, and orange identify the original overlapping CPU-chip mark.

**The Evidence Rule.** Gold routes and answered checks reflect the stored handoff state; color does not imply an unconnected service is live.

## Typography

Bricolage Grotesque gives headings a compact editorial character. DM Sans carries body copy, labels, and controls. Both fall back to Arial and sans-serif. Keep source text easy to scan and numeric activity stable through tabular figures. The frontmatter records the implemented body and label roles; responsive heading sizes remain defined in the stylesheet.

## Layout

A fixed dark navigation rail anchors an ivory canvas. The desktop workspace pairs the question area with a large network field. The content container is capped at 1500px; its standard padding is 28px by 32px. The default rail is 212px wide. At narrower widths the work areas stack; at 760px the rail becomes a drawer. Preserve the question composer, team controls, requests, and modal actions on mobile.

## Elevation & Depth

Tonal surfaces and fine borders provide most structure. The small shadow supports light separation; the larger shadow is reserved for overlays and transient feedback. Exact shadow and motion values live in the sidecar. Reduced-motion preferences disable animation, transitions, and smooth scrolling.

## Shapes

Controls use gently rounded corners, with larger panel corners and compact status tags. The dark network is a single contained visual field. Form fields and tables retain familiar web shapes and interaction behavior.

## Components

Primary buttons use ink with white text; secondary buttons use the warm surface and a stronger border. Both use compact label text and visible keyboard focus. Fields use the warm surface with a clear border. Status tags use muted tones until semantic state warrants emphasis. Navigation uses subdued text on ink and a lighter active row.

The signature knowledge network exposes selected teams, source context, and handoffs. Team nodes and pending-answer actions must open the corresponding implemented workflow. Secondary pages continue to use clear tables, source lists, and reviewable forms. The component sidecar contains representative primitives extracted from the stylesheet.

## Do's and Don'ts

- Do preserve readable evidence, team ownership, and an obvious next action.
- Do use gold handoff routes only when supported by current request state.
- Do keep the original overlapping CPU-chip identity in brand red, gold, and orange.
- Don't fabricate live activity, impact numbers, or source connections.
- Don't turn ordinary forms and tables into decorative network diagrams.
- Don't hide controls or rely on animation to communicate request status.
