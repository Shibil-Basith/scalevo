# Scalevo Learning Workspace — implementation plan

## Scope
Build a preview-ready Scalevo DevOps learning workspace based on the supplied repository and product requirements. Preserve the existing light glass dashboard character while adding route-aware learner navigation, a 15-module curriculum catalog, module detail tabs for Recordings and Documentation, batch status surfaces, and an admin access-management view.

## Reference audit
The supplied repository is a compact Node HTTP server plus one large static HTML application. Its established visual language is:
- Manrope body text and Space Grotesk display headings.
- A pale `#f6f8fc` canvas with blue/indigo radial washes.
- Semi-transparent white glass cards, soft slate borders, deep navy ink, and blue/violet accents.
- Rounded 1.25–1.75rem cards, compact uppercase eyebrow labels, Lucide-style line icons, and short hover lift transitions.
- The current catalog contains seven recording-oriented modules, Google Drive lesson IDs, candidate/admin entry points, and in-app progress controls.

## Implementation approach
- Use a dependency-light Node HTTP server on port 3000.
- Serve a static client from `public/`, with SPA fallback for all learner/admin routes.
- Keep demo data in `public/app.js` to make the experience immediately inspectable; expose the same data through `/api/catalog` and `/api/health` for future server/database wiring.
- Use the History API and a small route parser for shareable URLs such as `/dashboard`, `/modules`, `/modules/:id/recordings`, `/modules/:id/documentation`, `/modules/:id/documentation/:topicSlug`, `/batches`, `/admin/batches`, and `/admin/access-requests`.
- Implement the real interaction shell: module search, module tabs, topic previous/next controls, read markers, batch request states, admin tab changes, responsive sidebar, and a branded video-player modal with native-looking controls and no Google Drive chrome.
- Use official Devicon CDN assets where the reference already does; use neutral Lucide symbols for cross-cutting concepts and fallbacks when an icon fails.

## Project structure
- `server.js`: static file server, SPA fallback, API endpoints, and health response.
- `public/index.html`: document shell and Google Fonts/Devicon/Lucide imports.
- `public/styles.css`: preserved Scalevo token system, responsive layout, card surfaces, player, and state styling.
- `public/app.js`: seed curriculum, route state, rendering, interactions, and demo access/progress behavior.
- `public/manus-routes.json`: complete route manifest for managed preview.
- `scalevo-mark.svg`: reusable transparent S/V monogram from the reference.
- `app.config.ts`: platform logo metadata.
- `TODO.md`: outcome-level delivery criteria and status.

## Design direction
### Candidate styles considered
- Probability 0.07 — “Swiss dashboard minimalism”: strict grids, quiet color, editorial labels.
- Probability 0.06 — “Neo-brutalist lab notebook”: bolder borders, harder contrast, utilitarian controls.
- Probability 0.05 — “Soft glass command center”: translucent cards, calm canvas, vivid learning progress.

### Chosen style: Soft glass command center
**Design Movement:** Contemporary product dashboard with soft glassmorphism and editorial learning cues.

**Core Principles:** Make progress visible; keep navigation calm and obvious; use color for orientation not decoration; make dense curriculum feel approachable.

**Color Philosophy:** The cool off-white canvas and translucent surfaces create a private-feeling study room. Scalevo blue and violet mark movement and progression, while emerald, amber, and rose are reserved for status so meaning remains legible.

**Layout Paradigm:** A persistent slim rail frames a wide reading surface. Catalog pages use asymmetric hero copy plus a responsive module grid; detail pages use a narrow lesson index alongside a generous reading column.

**Signature Elements:** Gradient S/V monogram, uppercase micro-labels with generous tracking, and progress bars that use the module accent as a visual bookmark.

**Interaction Philosophy:** Every primary action is explicit and reversible. Tabs, breadcrumbs, in-app Back, and browser history should feel like one coherent navigation model.

**Animation:** Use short 160–220ms transitions for card lift, progress fill, route changes, and tab underline. Respect `prefers-reduced-motion`.

**Typography System:** Manrope for UI and body copy; Space Grotesk for headlines, module numbers, and large metrics. Eyebrows use 10–11px semibold uppercase labels with tracking.

**Brand Essence:** A focused DevOps learning workspace for learners who want practical momentum, not content sprawl. Personality: precise, encouraging, quietly technical.

**Brand Voice:** Headlines are direct and energizing (“Build the habit. Ship the concept.”). Microcopy is reassuring and specific (“Your request is queued for admin review.”).

**Wordmark & Logo:** Use the supplied S/V monogram with the `Scalevo` wordmark in Space Grotesk; never place the mark inside a decorative badge.

**Signature Brand Color:** Scalevo blue `#3568f5`, balanced by indigo `#4f46e5` and violet `#7c3aed`.

## Build and delivery workflow
1. Write the static client, API shell, route manifest, and project metadata.
2. Start the Node service on the managed runtime port and verify `/`, `/manus-routes.json`, and `/api/health`.
3. Run syntax checks and inspect the rendered application through managed Preview/screenshot only if needed.
4. Commit intended files to the managed project’s main branch so the checkpoint is recorded.
5. Leave publication separate unless explicitly requested; Preview is the default handoff for this implementation task.
