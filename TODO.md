# Delivery outcomes

## LMS learning workspace
- [x] Replace the directory-only landing page with an LMS-style learning workspace that presents seven DevOps modules as selectable course cards.
- [x] Open a dedicated module lesson view when a learner selects Linux Fundamentals, Version Control, Continuous Integration, Containers, Container Orchestration, Infrastructure as Code, or Continuous Delivery & Deployment.
- [x] Keep the customer-facing interface free of Google Drive folder links and repository-navigation controls.
- [x] Preserve responsive light-mode glassmorphism styling, accessible focus states, compact typography, and touch-friendly controls.

## Lesson playlist and progress
- [x] Show lesson names in a focused playlist for each module, using the inspected recording names and verified file IDs for Linux, Git, CI, Containers, Kubernetes, Terraform, and Continuous Delivery.
- [x] Replace mapped-only lesson rows for Containers, Container Orchestration, Infrastructure as Code, and Continuous Delivery with their actual public recording files.
- [x] Provide server-backed progress tracking with lesson completion controls, per-module progress bars, and dashboard completion totals.
- [x] Include module search and clear navigation back to the course library.

## In-app video player
- [x] Open a custom in-app video overlay from each indexed lesson rather than sending learners to a Google Drive folder.
- [x] Play indexed public Google Drive files through their `/file/{id}/preview` embed URL inside the overlay.
- [x] Include player close controls, Escape-key support, accessible dialog semantics, module context, and a mark-complete action.
- [x] Use verified public Drive file IDs for 60 videos across all seven modules instead of exposing a misleading folder link.

## Credits and content dashboard
- [x] Add a subtle footer credit line and keep the administrator entry point out of the normal candidate workspace navigation.
- [x] Require the protected administrator username/password before opening the content and candidate-progress dashboard.
- [x] Allow admins to create, edit, and delete modules with module name, module number, category, logo URL, accent, and description.
- [x] Allow admins to add, edit, and delete lesson videos using a video name plus a full Google Drive video URL or file ID.
- [x] Persist module and lesson changes in the managed database and refresh the customer-facing module library immediately.

## Candidate authentication and reporting
- [x] Gate the application behind a login screen with separate Candidate login and Admin login options.
- [x] Authenticate candidates through Google Identity Services, verify the credential server-side, and accept verified Gmail accounts only.
- [x] Require a candidate full name and phone number alongside Gmail authentication for identification.
- [x] Persist candidate accounts, sign-in timestamps, and synced lesson progress in the managed database.
- [x] Show each registered candidate's Gmail, name, phone, last sign-in, and completed-video progress to the administrator.
- [x] Configure the server-backed container deployment with `/api/health` and preserve the existing 60-recording catalog as database seed data.

## Scalevo brand and catalog presentation
- [x] Rebrand the customer-facing workspace as `Scalevo` / `scalevo.space` in the document title, metadata, header, login screen, and footer.
- [x] Add a reusable transparent Scalevo S/V-inspired monogram for the header, login screen, and platform logo metadata without a surrounding black or white container.
- [x] Serve the Scalevo mark as a correctly typed SVG asset from the Node server.
- [x] List modules in ascending numeric module-number order in both the server content API and the client catalog/dashboard.
- [x] Modernize the site typography with Manrope body text and Space Grotesk display headings.
- [x] Refine responsive spacing, logo sizing, lesson-row controls, and login layout for small devices.
- [x] Let admins drag lesson rows to reorder videos within the selected module, persist the ordered lesson IDs transactionally, and restore the order after refresh.
- [x] Add compact up/down reorder controls for touch and small-screen admin use where drag gestures are not reliable.
- [x] Prevent unique-position collisions during swaps by moving lesson rows through a temporary order range inside the transaction.

## Module access approval workflow
- [x] Require a candidate to request access before receiving the lesson links for any module.
- [x] Show each module's locked, pending, denied, or approved state in the candidate library and module view.
- [x] Notify administrators through a pending-access section at the top of the dashboard with candidate identity, module, timestamp, Approve, and Deny actions.
- [x] Persist one access request per candidate/module, allow denied candidates to request again, and record the administrator decision and review timestamp.
- [x] Return lesson links only for approved modules and reject direct progress writes for modules without approved access.
