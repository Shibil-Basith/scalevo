# Scalevo Learning Workspace — implementation plan

## Scope
Build a preview-ready Scalevo DevOps learning workspace from the supplied repository, preserving its light glass dashboard language while making the product deployable for real learners and administrators. Learners receive only the learner workspace; administrators receive a separate protected management workspace.

## Reference audit
The supplied repository is a compact Node HTTP server plus a static client. It already establishes the Scalevo visual system, Google Identity Services entry point, candidate/admin sign-in split, MySQL persistence, module access requests, progress tracking, recording management, and candidate progress reporting. The managed project keeps that architecture and expands the seed catalog to 15 modules with official Devicon/Iconify assets where available.

## Implementation approach
- Use a dependency-light Node HTTP server on port 3000 with MySQL-backed users, sessions, module access requests, progress, modules, recordings, and documentation.
- Preserve Google sign-in for learners, requiring a verified Gmail credential plus full name and phone number. Keep administrator authentication separate with the requested development defaults `admin` / `admin123`, overridable by `ADMIN_USERNAME` and `ADMIN_PASSWORD` in deployment configuration.
- Route the client by authenticated role: a learner sees the course library, access states, recordings, progress, and published documentation; an admin sees the protected admin workspace, access-request decisions, user progress, module editing, recording editing/reordering, and markdown documentation editing.
- Keep documentation empty by default. Administrators choose a module and recording/topic, paste markdown, and save it through `/api/admin/modules/:moduleId/documentation/:topicSlug`; approved learners see only published notes.
- Add a mobile navigation drawer to the authenticated header so learner/admin navigation remains usable on phones, tablets, narrow laptops, and desktop widths.
- Keep the no-Google-Drive-branding player treatment in the learner UI while retaining the repository’s recording ID model for the admin-managed lesson library.

## Project structure
- `server.js`: database schema/bootstrap, auth sessions, Google verification, learner/admin APIs, markdown documentation API, static serving, and deep-route fallback.
- `index.html`: responsive Scalevo client, login flows, learner module view, admin workspace, recording player, mobile navigation, and documentation editor.
- `content-seed.json`: 15-module curriculum seed; real recording IDs are retained where available and other lesson slots remain pending for admin configuration.
- `manus-routes.json`: managed route manifest.
- `scalevo-mark.svg`: reusable S/V monogram.
- `app.config.ts`: managed project logo metadata.
- `Dockerfile` / `package.json`: production container and dependency-light runtime.
- `TODO.md`: outcome-level delivery criteria and status.

## Design direction
### Candidate styles considered
- Probability 0.07 — “Swiss dashboard minimalism”: strict grids, quiet color, editorial labels.
- Probability 0.06 — “Neo-brutalist lab notebook”: bolder borders, harder contrast, utilitarian controls.
- Probability 0.05 — “Soft glass command center”: translucent cards, calm canvas, vivid learning progress.

### Chosen style: Soft glass command center
**Design Movement:** Contemporary product dashboard with soft glassmorphism and editorial learning cues.

**Core Principles:** Make progress visible; keep navigation calm and obvious; use color for orientation, not decoration; make dense curriculum approachable.

**Color Philosophy:** A cool off-white canvas and translucent surfaces create a private-feeling study room. Scalevo blue and violet mark movement; emerald, amber, and rose communicate status.

**Layout Paradigm:** A responsive wide workspace with asymmetric hero copy, module cards, focused module detail views, and admin sections that become single-column on narrow screens.

**Signature Elements:** Gradient S/V monogram, uppercase micro-labels, module-accent progress bars, and deliberate status pills.

**Interaction Philosophy:** Every primary action is explicit and reversible. Login mode, access request, admin approval, recording management, markdown save, and mobile navigation provide immediate feedback.

**Animation:** Use short card-lift and progress transitions, with reduced-motion support.

**Typography System:** Manrope for UI/body; Space Grotesk for headlines and metrics; small uppercase eyebrows for orientation.

**Brand Essence:** A focused DevOps learning workspace for practical momentum. Personality: precise, encouraging, quietly technical.

**Brand Voice:** Direct and useful: “Learn one focused recording at a time.” / “Documentation has not been published yet.”

**Wordmark & Logo:** Use the supplied transparent S/V monogram with the Scalevo wordmark.

**Signature Brand Color:** Scalevo blue `#3568f5`, balanced by indigo `#4f46e5` and violet `#7c3aed`.

## Build and delivery workflow
1. Seed the database schema and curriculum, then serve the authenticated client and API.
2. Start the Node service and verify `/`, `/api/health`, `/api/auth/me`, and `/manus-routes.json`.
3. Validate server and embedded client syntax, the requested admin credential flow, protected admin content, 15-module seed, empty documentation state, and responsive/mobile hooks.
4. Commit and push intended files to the managed project’s main branch so the checkpoint is recorded.
5. Keep publication separate from the checkpoint unless explicitly requested and configured.

## Focused admin information architecture update
The authenticated workspace now uses URL-backed History API routes instead of one congested admin render: `/admin` for overview, `/admin/modules/new` for module creation, `/admin/modules/edit` for module identity changes, `/admin/recordings` for recording CRUD and ordering, `/admin/documentation` for Markdown topic publishing, `/admin/access-requests` for access decisions, and `/admin/users` for learner progress. Learner dashboard and module details use `/dashboard`, `/modules`, and `/modules/:moduleId`. The client reapplies the active URL after asynchronous workspace bootstrap so deep links, refreshes, and browser Back/Forward remain stable.
