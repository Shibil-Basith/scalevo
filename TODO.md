# Scalevo delivery outcomes

## Preserve the established Scalevo visual identity
- [x] Keep the light `#f6f8fc` canvas, blue/indigo radial washes, semi-transparent white glass cards, slate borders, deep navy ink, blue/violet accents, Manrope body text, Space Grotesk display headings, rounded surfaces, compact eyebrow labels, accessible focus rings, and responsive behavior from the reference.
- [x] Reuse the supplied transparent S/V monogram and preserve the existing compact dashboard character rather than introducing an unrelated design system.

## Learner shell and real navigation
- [x] Provide shareable route-backed pages for `/dashboard`, `/modules`, `/modules/:moduleId`, `/modules/:moduleId/recordings`, `/modules/:moduleId/documentation`, `/modules/:moduleId/documentation/:topicSlug`, `/batches`, `/admin/batches`, and `/admin/access-requests`.
- [x] Keep rendered view state synchronized with the URL, make browser Back/Forward restore prior views, and provide an in-app Back control with a sensible `/modules` fallback.
- [x] Make the shell responsive with a persistent desktop rail, a compact mobile header, and clear active navigation.

## 15-module DevOps curriculum
- [x] Present the 15-module syllabus in ascending order with module number, title, category, description, official tool identity or neutral fallback icon, recording count, documentation topic count, and progress state.
- [x] Include beginner-friendly topic documentation with definitions, why it matters, practical examples, common mistakes or safety notes where useful, and previous/next topic navigation.
- [x] Keep documentation and recordings as clearly separated module tabs; support module and documentation search without exposing protected content in URLs.

## Access and progress surfaces
- [x] Show locked, pending, approved, and denied access states with a helpful request action; pending or rejected access must not imply lesson access.
- [x] Provide module completion bars, read markers, and a dashboard summary for modules, topics read, recordings, and current streak.
- [x] Provide a Batches page with available batch cards, schedule, dates, status, module count, and request state; make the request interaction visibly update to Pending in the demo state.
- [ ] Provide admin surfaces for pending batch requests, module assignments, approved member counts, direct-vs-batch access labels, and safe archive/remove affordances.

## Branded recording player
- [ ] Open recordings in a contained branded modal with a dark player stage, lesson context, play/pause, seek, volume, speed, fullscreen, keyboard-accessible controls, loading/error states, and a mark-complete action.
- [x] Do not show Google Drive branding, Drive buttons, folder links, permanent private URLs, or outbound Drive navigation in the learner experience.

## Reliability and delivery
- [x] Serve `/manus-routes.json` with the complete synchronized route set, `/api/health` with an unauthenticated 2xx response, and use SPA fallback so deep routes refresh correctly.
- [x] Keep implementation readable and dependency-light, pass `node --check`, and verify the configured runtime port before checkpointing.
- [x] Set project logo metadata in `app.config.ts` and preserve a clean path for later server-side auth, database-backed permissions, and secure signed media URLs.
