# ADR 002 — Events and Notifications

## Status

Accepted

## Context

The platform needs notifications, audit logs, timelines, and analytics.

Building each system separately would duplicate business logic across actions and pages.

## Decision

Introduce a central Event Engine.

Every important business action creates an event in the `events` table.

Notifications are generated from events and stored in the `notifications` table.

## Consequences

- Events become the source of truth for activity.
- Notifications, audit logs, timelines, and analytics can be built from the same event stream.
- Future features should emit events instead of directly creating isolated side effects.