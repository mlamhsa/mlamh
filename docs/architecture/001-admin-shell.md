# ADR 001 — Admin Shell

## Status

Accepted

## Context

Admin pages were growing independently and repeating the same layout patterns:
sidebar, topbar, navigation links, logout button, and page container styling.

This caused repeated code and made future changes harder.

## Decision

Create a shared Admin Shell composed of:

- `AdminShell`
- `AdminSidebar`
- `AdminTopbar`
- `admin-navigation`
- `config/features`

The route layout `app/admin/layout.tsx` now only renders `AdminShell`.

## Consequences

- All admin pages share one layout.
- Navigation is centralized.
- Feature flags control optional admin sections.
- Future changes to admin layout happen in one place.
- Publisher and Talent dashboards should follow the same Shell pattern later.