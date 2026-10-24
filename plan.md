# Scalevo Learning Workspace — implementation plan

## Scope and source of truth
Update the existing Scalevo DevOps learning platform from the user-provided repository without cloning the Softr template or removing existing features. The production server serves the root `index.html` and `server.js`; the `public/` directory is a legacy prototype and is not the production client. Preserve the current Google-verified learner login, separate administrator authentication, 15-module learning catalog, approval-gated module and batch access, recordings, documentation, progress, and admin management workflows.

## Implementation approach
- Refine the root app into a premium, polished learning portal inspired by the reference's clear course discovery and structured lesson organization, while keeping Scalevo branding and the existing information architecture.
- Make `/` learner-only sign-in. Use `/admin` as the administrator sign-in entry and protected admin workspace; do not expose an admin-login mode or tab on the home page. Preserve deep admin routes and server-side API authorization.
- Add an administrator-only `DELETE /api/admin/users/:id` endpoint. In one database transaction, remove the learner's sessions, progress, module access requests, batch requests, and user record. Add an explicit confirmation before the admin UI sends the deletion request.
- Use Plyr around an HTML5 video element backed by a same-origin `/api/lessons/:lessonId/video` stream. First mint a short-lived, lesson-scoped media token through the authenticated API, so the browser's media request does not rely on Preview iframe cookies. Bind and revoke grants with the application session; recheck current admin or approved-learner/batch access on the stream, forward HTTP Range requests to Google Drive, and stream inline without a Drive redirect. Keep only in-player controls and show a clear preparation or playback error.
- Keep all changes in the root production client/server, deployment files, route manifest and these project notes. Do not migrate the legacy `public/` prototype into the production path.

## Project structure
- `server.js`: Node HTTP API, MySQL schema/bootstrap, authentication and sessions, role-protected learner/admin APIs, and root static serving.
- `index.html`: production Scalevo UI, responsive course catalog, learner workspace, dedicated `/admin` sign-in, admin pages, route handling, and Plyr lesson playback.
- `content-seed.json`: initial DevOps course and lesson catalog.
- `manus-routes.json`: route manifest for the served website, including learner and administrator paths.
- `scalevo-*.svg` / `scalevo-mark.svg`: existing Scalevo wordmarks and marks used by the UI.
- `Dockerfile`, `package.json`, and `package-lock.json`: production Node container and dependencies.
- `public/`: legacy prototype, not served by the production server.
- `TODO.md`: outcome criteria for the requested changes and prior platform behaviors.

## Design direction
**Design Movement:** Premium editorial learning portal, using the supplied online-classes template as broad inspiration rather than a visual clone.

**Core Principles:** Make the course library feel curated; keep progress and access states legible; give high-value actions clear hierarchy; preserve a calm, responsive learner workspace.

**Color Philosophy:** A warm, pale neutral canvas and deep ink surfaces make the portal feel considered and focused. Scalevo blue remains the signature accent for learning actions, with restrained emerald and amber states for completion and review.

**Layout Paradigm:** Spacious course discovery and focused course details, with the authenticated content area and admin workflows organized into distinct, easy-to-scan sections.

**Signature Elements:** Scalevo's existing monogram and wordmark; refined course cards with clear module identity and progress; a dark, focused in-app video stage.

**Interaction Philosophy:** Preserve existing learner and admin behavior. Make access state, route destination, deletion confirmation, and video playback status explicit.

**Animation:** Use short, restrained transitions on cards and controls; honor reduced-motion preferences.

**Typography System:** Preserve the existing Manrope UI and Space Grotesk display pairing, improving rhythm and hierarchy rather than introducing a new brand typeface.

**Brand Essence:** A focused DevOps learning workspace that helps learners build practical confidence one session at a time. Personality: precise, encouraging, quietly technical.

**Brand Voice:** Direct and useful. Examples: “Build DevOps skills, step by step.” / “Continue your learning path.”

**Wordmark & Logo:** Preserve the supplied Scalevo wordmark and monogram.

**Signature Brand Color:** Scalevo blue `#3568f5`, paired with deep ink and restrained violet accents.

## Manus preview scope and data boundary
The user approved an isolated Manus preview of the updated production app. Copy the existing root `index.html`, `server.js`, content seed, route manifest, deployment files, and Scalevo brand assets into the new Manus Webdev project `scalevo-ui`; do not connect or push to the supplied GitHub repository. Run the existing Node server on the configured Preview port (`PORT`, default `3000`) and serve the `/` learner sign-in and `/admin` administrator sign-in routes through the existing SPA fallback.

The preview uses its own newly provisioned project-scoped managed MySQL database. Existing production learner records, batches, progress, sessions, secrets, and application data are not copied. The public Google OAuth client ID supplied by the user for this preview is passed only into the preview server process; it is not saved to source or project configuration. The server may initialize the app schema and curriculum within the empty preview project's database. Do not publish the preview project or change the live `scalevo.space` site. Preserve normal sign-in behavior and do not invent an authenticated learner session.

## Delivery workflow
Implement against the actual production root client/server; validate syntax and static route declarations; avoid production database writes or deletions during validation. The repository is public, but no authenticated GitHub write access is configured in this session, so remote pushes or production publication require a separately authorized path. Keep code changes local until a permitted repository handoff is available.
