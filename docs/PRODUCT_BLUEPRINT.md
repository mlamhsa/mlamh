# MLAMH Product Blueprint v1.0

## Product Vision

MLAMH is a premium digital talent ecosystem connecting talents, companies, and creative opportunities across the Middle East.

## Product Principles

1. Premium First
2. Trust First
3. Mobile First
4. Content Driven
5. Consistency
6. Scalable by Design

## Information Architecture

### Public Website
- Home
- Discover
- Talents
- Companies
- Opportunities
- Resources
- Login
- Join

### Talent Workspace
- Home
- Portfolio
- Applications
- Saved
- Notifications
- Settings

### Company Workspace
- Home
- Company
- Opportunities
- Applicants
- Notifications
- Settings

### MLAMH Studio
- Overview
- People
- Marketplace
- Content
- Media
- Reports
- Platform

## Official Routes

### Public
- /[locale]
- /[locale]/login
- /[locale]/join
- /[locale]/register-publisher
- /[locale]/opportunities
- /[locale]/talent
- /[locale]/publishers

### Workspaces
- /[locale]/talent-dashboard
- /[locale]/publisher-dashboard
- /admin

## Source of Truth

User role and access type must always come from:

profiles.account_type

Allowed values:
- talent
- publisher
- admin

## Design Direction

MLAMH visual identity:
- Luxury
- Minimal
- Cinematic
- Premium
- Black and gold
- Large spacing
- Clear typography
- Lucide icons only
- No emojis in production UI

## Sprint Roadmap

### Sprint 0 — Foundation
- Product Blueprint
- Design System
- UI Components
- Typography
- Motion Rules

### Sprint 1 — Public Website
- Navbar
- Hero
- Homepage Sections
- Footer

### Sprint 2 — Authentication
- Login UX
- Join Talent
- Register Publisher
- Social Login UI
- Remember Email

### Sprint 3 — Workspaces
- Talent Workspace visual system
- Company Workspace visual system
- Unified shell behavior

### Sprint 4 — MLAMH Studio
- CMS
- Media Library
- Footer Management
- About / Terms / Privacy
- SEO Settings

### Sprint 5 — Launch
- Testing
- SEO
- Performance
- Accessibility
- Production Readiness