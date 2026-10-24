# Scalevo delivery outcomes

## Visual foundation and responsive shell
- [x] Preserve the supplied Scalevo light glass visual language, monogram, typography, module accents, and readable responsive cards.
- [x] Provide a mobile navigation drawer with learner/admin actions at narrow widths; keep the workspace usable on phones, tablets, laptops, and desktop screens.
- [x] Update the existing Scalevo UI to a premium, clean learning-platform presentation inspired by the Softr online-classes template at https://www.softr.io/templates/online-classes; do not clone its UI. Keep the current Scalevo branding and the site's existing learner, access, course, batch, documentation, progress, and admin features.
- [x] Align the initial learner entry screen on mobile phones and small devices; keep its controls legible and properly aligned without clipping or horizontal overflow, let the content scroll naturally, and preserve the established desktop layout.

## Authentication and role separation
- [x] Keep learner sign-in on Google Identity Services with verified Gmail, full name, and phone number capture.
- [x] On the learner start page, show both `Log in` and `Sign up`. In `Sign up`, ask for the user's full name and phone number and use Continue with Google to verify Gmail before creating a learner account. In `Log in`, show only Continue with Google and do not require a name or phone. For a returning verified Google account, create a session while preserving the stored name and phone. If a Google account has no learner record and chooses `Log in`, do not create an account; direct the user to `Sign up`.
- [x] Keep administrator sign-in separate from Google authentication with the development credentials `admin` / `admin123`, overridable through environment variables.
- [x] Render the learner course workspace only for user sessions and the module/access/user-management workspace only for admin sessions.
- [x] Persist sessions with cross-site Preview-safe cookies and protect admin endpoints server-side.
- [x] Do not show an administrator-login page, tab, or mode on the home page. Let an administrator sign in to the website through the `/admin` URL path; preserve protected admin routes and server-side authorization.

## Curriculum and learner experience
- [x] Seed the 15-module curriculum with official tool logos where available, real recording IDs from the reference where available, and pending lesson slots for content that still needs admin configuration.
- [x] Show locked, pending, approved, and denied access states; require admin approval before recordings or documentation can be consumed.
- [x] Keep learner documentation empty by default and show a clear unpublished state instead of demo prose.
- [x] Keep recording playback inside the branded Scalevo player treatment without Google Drive branding or outbound Drive navigation.
- [x] Persist approved learner progress and expose it to the admin progress view.
- [x] Use the Plyr custom video player for videos stored in Google Drive. Keep playback inside the Scalevo player and do not show an option or link to redirect/open the video in the Google Drive application.
- [x] Fix the reported issue where videos would not play in embedded Preview: authenticate before playback, mint a short-lived lesson-scoped token, then stream the Google Drive media through a same-origin endpoint using byte-range requests that do not depend on cookies being sent by the browser's media element. Recheck current admin or approved-learner/batch access on the stream; keep it inline inside the polished Plyr player, without a Google Drive redirect/open option. Confirmed in headless Chromium: the lesson video loaded metadata and duration from the real MP4 stream.

## Admin workspace
- [x] Provide server-backed access request approval/denial, candidate directory, module CRUD, recording add/edit/delete/reorder, and progress reporting.
- [x] Provide a markdown editor that selects a module and topic, saves documentation to the database, and publishes it only to approved learners.
- [x] Provide safe empty states when no users, requests, recordings, or documentation are configured.
- [x] Let an administrator manually delete a learner from the admin user directory. Confirm the action before submitting it and remove the learner's account-associated sessions, progress, module-access requests, and batch requests along with the user record.

## Manus preview
- [x] Provide an in-Manus preview of the updated Scalevo website, with learner sign-in at `/` and administrator sign-in at `/admin`, using a separate Manus project database. Do not copy production learner data or production secrets; use the public Google OAuth client ID supplied for this preview only in the preview server process; do not push to the user's GitHub repository or publish to the live website.

## Runtime and delivery
- [x] Serve the authenticated client, health endpoint, auth bootstrap, and route manifest from the managed Node runtime.
- [x] Validate server syntax, embedded client syntax, 15-module seeding, requested admin login, and protected admin content access.
- [x] Preserve a production Dockerfile and managed project metadata for later publication.
- [x] Validate the updated server and client syntax, HTTP health/auth/static routes, route manifest, dedicated `/admin` page, and rejection of an unauthenticated learner-delete request. Validate actual Chrome media metadata loading, byte-range delivery, token expiration/logout revocation, and playback MIME type. No learner data was deleted during validation.
