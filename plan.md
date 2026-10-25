# Scalevo Learning Workspace — implementation plan

## Scope and source of truth
Update the existing Scalevo DevOps learning platform without cloning the Softr template or removing existing features. The production server serves the root `index.html` and `server.js`; `public/` is a legacy prototype and is not the production client. Preserve the existing verified-Google learner authentication, separate administrator authentication, 15-module learning catalog, approval-gated module and batch access, recordings, documentation, progress, and admin management workflows.

## Implementation approach
- Keep `/` learner-only and make `/admin` the administrator sign-in entry and protected admin workspace. Do not expose admin login on the learner home page.
- Present two learner options: `Log in` and `Sign up`. Sign-up asks for full name and phone number, then uses Continue with Google to verify Gmail before creating an account. Returning login presents only Continue with Google and sends no profile fields. The server identifies an existing user by verified Google subject, preserves their stored name and phone, and creates a session. Login from a Google identity with no account does not create an incomplete record; show a sign-up prompt instead.
- Make the initial learner page compact and properly aligned on phones and small screens: keep the mode selector, required fields (when signing up), and Google action legible and unclipped, with natural vertical scrolling and no horizontal overflow. Preserve the established desktop two-column treatment.
- Add an administrator-only `DELETE /api/admin/users/:id` endpoint. In one database transaction, remove the learner's sessions, progress, module access requests, batch requests, media grants, and user record. Require explicit confirmation before the admin UI sends the deletion request.
- Use Plyr around an HTML5 video element backed by a same-origin `/api/lessons/:lessonId/video` stream. Mint a short-lived, lesson-scoped media token through the authenticated API so the browser's media request does not rely on Preview iframe cookies. Bind and revoke grants with the application session; recheck current admin or approved-learner/batch access on the stream, forward HTTP Range requests to Google Drive, and stream inline without a Drive redirect.
- For an upstream 429/5xx or a non-video confirmation response, retry with a short bounded delay and try Google's direct-download route as a fallback. Forward the browser's Range/If-Range headers and keep the stream inline. Log and return only sanitized upstream status, content type, and lesson ID—never the media token, session token, or full URL. Do not bypass Drive permissions; make a 403/sharing/quota failure diagnosable for the administrator.
- Use existing `content_documentation` rows as the ordered syllabus chapter records: retain each stable `topic_slug`, editable `topic_title`, `sort_order`, and Markdown content. Empty Markdown means the chapter is listed in the syllabus but has no document yet; no duplicate syllabus/doc table is introduced.
- In Add/Edit Module, let admins add, rename, remove, and reorder syllabus chapter titles. Sync those changes with the same chapter records used by the Documentation admin, preserving Markdown when a title or order changes.
- Import the user-provided 15-module chapter list as a one-time versioned startup migration, creating missing `content_documentation` chapter rows with empty Markdown, preserving any existing titles/documents, and preventing intentionally deleted chapters from being recreated on every restart. Complete the migration before opening the HTTP listener so the initial workspace load cannot race partial seed data.
- When a learner opens a module, show the ordered chapter syllabus first, followed by `Videos` and `Documents` toggles. Videos keep the existing recording order; Documents show each chapter collapsed by default with a down-arrow control that reveals only that chapter's document. Use accessible expanded/collapsed state and keep playback/document contents behind existing approval while the syllabus outline remains visible.
- In Admin Documentation, choose a module and syllabus chapter, edit its title and Markdown, add chapters, remove a document without removing its chapter, or delete a chapter together with its document. Confirm destructive deletion and preserve existing chapter content during unrelated edits.
- Provide a dedicated `Admin → Syllabus` section at `/admin/syllabus`, listing modules and a selected module's ordered chapter editor. Let admins add, rename, reorder, and delete chapters there as a focused syllabus workflow; use the shared chapter records and endpoint so documents survive title/order edits, and warn that deleting a chapter also removes its attached document.
- Keep all production changes in the root client/server, deployment files, route manifest, and project notes. Do not migrate the legacy `public/` prototype into the production path.

## Project structure
- `server.js`: Node HTTP API, MySQL schema/bootstrap, Google authentication and sessions, role-protected learner/admin APIs, media grants/streaming, and root static serving.
- `index.html`: production Scalevo UI, compact responsive sign-in/signup, learner workspace, dedicated `/admin` sign-in, route handling, and Plyr lesson playback.
- `content-seed.json`: initial DevOps course and lesson catalog.
- `manus-routes.json`: route manifest for the served website, including learner and administrator paths.
- `scalevo-*.svg` / `scalevo-mark.svg`: existing Scalevo wordmarks and marks used by the UI.
- `Dockerfile`, `package.json`, and `package-lock.json`: production Node container and dependencies.
- `public/`: legacy prototype, not served by the production server.
- `TODO.md`: outcome criteria for the requested changes and prior platform behaviors.

## Design direction
**Design Movement:** Premium editorial learning portal, using the supplied online-classes template as broad inspiration rather than a visual clone.

**Core Principles:** Make the course library feel curated; keep progress and access states legible; give high-value actions clear hierarchy; provide a focused, mobile-first entry point.

**Color Philosophy:** A warm, pale neutral canvas and deep ink surfaces make the portal feel considered and focused. Scalevo blue remains the signature accent for learning actions, with restrained emerald and amber states for completion and review.

**Layout Paradigm:** Spacious course discovery and focused course details, with authenticated content and admin workflows organized into distinct, easy-to-scan sections. On narrow screens, prioritize the learner mode selector and primary action above a compact brand panel.

**Signature Elements:** Scalevo's existing monogram and wordmark; refined course cards with clear module identity and progress; a dark, focused in-app video stage.

**Interaction Philosophy:** Preserve existing learner and admin behavior. Make access state, route destination, deletion confirmation, account mode, required sign-up details, and video playback status explicit.

**Animation:** Use short, restrained transitions on cards and controls; honor reduced-motion preferences.

**Typography System:** Preserve the existing Manrope UI and Space Grotesk display pairing, improving rhythm and hierarchy rather than introducing a new brand typeface.

**Brand Essence:** A focused DevOps learning workspace that helps learners build practical confidence one session at a time. Personality: precise, encouraging, quietly technical.

**Brand Voice:** Direct and useful. Examples: “Build DevOps skills, step by step.” / “Continue your learning path.”

**Wordmark & Logo:** Preserve the supplied Scalevo wordmark and monogram.

**Signature Brand Color:** Scalevo blue `#3568f5`, paired with deep ink and restrained violet accents.

## Manus preview scope and data boundary
The user approved an isolated Manus preview of the updated production app. It uses its own project-scoped managed MySQL database; production learner records, sessions, secrets, and application data are not copied. The public Google OAuth client ID supplied by the user is passed only into the preview server process, not source or project configuration. Do not publish the Manus preview or change the live `scalevo.space` site as part of this task.

The user subsequently authorized GitHub integration and pushes to `Shibil-Basith/scalevo` on `main`. For follow-up code changes, fetch and reconcile `origin/main`, commit the reviewed changes, and push without force. A GitHub push is the requested repository update; do not run a separate production publish unless the user asks for it.

## Delivery workflow
Implement against the actual production root client/server; preserve concurrent repository changes, validate client and server syntax and route declarations, and verify the responsive auth and first-time/returning-user flows. Keep production database records untouched during validation. Ensure the Manus Preview stays available at the project's configured runtime port.
