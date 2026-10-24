# Scalevo delivery outcomes

## Visual foundation and responsive shell
- [x] Preserve the supplied Scalevo light glass visual language, monogram, typography, module accents, and readable responsive cards.
- [x] Provide a mobile navigation drawer with learner/admin actions at narrow widths; keep the workspace usable on phones, tablets, laptops, and desktop screens.

## Authentication and role separation
- [x] Keep learner sign-in on Google Identity Services with verified Gmail, full name, and phone number capture.
- [x] Keep administrator sign-in separate from Google authentication with the development credentials `admin` / `admin123`, overridable through environment variables.
- [x] Render the learner course workspace only for user sessions and the module/access/user-management workspace only for admin sessions.
- [x] Persist sessions with cross-site Preview-safe cookies and protect admin endpoints server-side.

## Curriculum and learner experience
- [x] Seed the 15-module curriculum with official tool logos where available, real recording IDs from the reference where available, and pending lesson slots for content that still needs admin configuration.
- [x] Show locked, pending, approved, and denied access states; require admin approval before recordings or documentation can be consumed.
- [x] Keep learner documentation empty by default and show a clear unpublished state instead of demo prose.
- [x] Keep recording playback inside the branded Scalevo player treatment without Google Drive branding or outbound Drive navigation.
- [x] Persist approved learner progress and expose it to the admin progress view.

## Admin workspace
- [x] Provide server-backed access request approval/denial, candidate directory, module CRUD, recording add/edit/delete/reorder, and progress reporting.
- [x] Provide a markdown editor that selects a module and topic, saves documentation to the database, and publishes it only to approved learners.
- [x] Provide safe empty states when no users, requests, recordings, or documentation are configured.

## Runtime and delivery
- [x] Serve the authenticated client, health endpoint, auth bootstrap, and route manifest from the managed Node runtime.
- [x] Validate server syntax, embedded client syntax, 15-module seeding, requested admin login, and protected admin content access.
- [x] Preserve a production Dockerfile and managed project metadata for later publication.
