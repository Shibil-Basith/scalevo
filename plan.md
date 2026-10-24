
# Focused admin information architecture update

The authenticated workspace now uses URL-backed History API routes instead of one congested admin render: `/admin` for overview, `/admin/modules/new` for module creation, `/admin/modules/edit` for module identity changes, `/admin/recordings` for recording CRUD and ordering, `/admin/documentation` for Markdown topic publishing, `/admin/access-requests` for access decisions, and `/admin/users` for learner progress. Learner dashboard and module details use `/dashboard`, `/modules`, and `/modules/:moduleId`. The client reapplies the active URL after asynchronous workspace bootstrap so deep links, refreshes, and browser Back/Forward remain stable.
