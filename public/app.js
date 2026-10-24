const app = document.querySelector('#app');
const toast = document.querySelector('#toast');

const icon = (name, cls = '') => `<i data-lucide="${name}"${cls ? ` class="${cls}"` : ''} aria-hidden="true"></i>`;
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
const slugify = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const formatDate = (value) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));

const ICONS = {
  aws: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg',
  linux: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',
  git: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
  jenkins: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg',
  docker: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
  kubernetes: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg',
  terraform: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/terraform/terraform-original.svg',
  ansible: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ansible/ansible-original.svg',
  argocd: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/argocd/argocd-original.svg',
  grafana: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grafana/grafana-original.svg',
  jira: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jira/jira-original.svg',
  mlflow: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mlflow/mlflow-original.svg',
};

const batches = [
  { id: 'platform-26', name: 'Platform Engineering · 2026', status: 'Active', start: '2026-09-14', end: '2026-12-18', schedule: 'Mon–Thu · 7:00 PM–8:30 PM', timezone: 'IST (UTC+5:30)', modules: 8, members: 28, description: 'A guided evening cohort for building reliable delivery habits from Linux fundamentals through GitOps.' },
  { id: 'cloud-native-27', name: 'Cloud Native Foundations · 2027', status: 'Open for requests', start: '2027-01-11', end: '2027-04-09', schedule: 'Sat · 10:00 AM–12:00 PM', timezone: 'IST (UTC+5:30)', modules: 10, members: 16, description: 'A weekend pathway through cloud, containers, Kubernetes, and infrastructure as code.' },
  { id: 'secure-delivery', name: 'Secure Delivery Lab', status: 'Draft', start: '2027-02-08', end: '2027-03-19', schedule: 'Tue–Fri · 6:30 PM–7:45 PM', timezone: 'IST (UTC+5:30)', modules: 5, members: 0, description: 'A focused lab for DevSecOps, observability, and capstone delivery patterns.' },
];

const state = {
  modules: [],
  loaded: false,
  search: '',
  docSearch: '',
  completed: new Set(['linux:0', 'linux:1', 'git:0', 'ci:0', 'containers:0']),
  read: new Set(['intro-devops:devops-principles', 'linux:linux-distributions', 'git:git-fundamentals']),
  access: {},
  batchRequests: {},
  player: null,
  playing: false,
  playerProgress: 26,
  adminTab: 'batches',
};

function loadDemoState() {
  try {
    const saved = JSON.parse(localStorage.getItem('scalevo-demo-state') || '{}');
    if (Array.isArray(saved.completed)) state.completed = new Set(saved.completed);
    if (Array.isArray(saved.read)) state.read = new Set(saved.read);
    state.access = saved.access || {};
    state.batchRequests = saved.batchRequests || {};
  } catch (error) {
    console.warn('Demo state could not be restored', error);
  }
}
function persistDemoState() {
  localStorage.setItem('scalevo-demo-state', JSON.stringify({
    completed: [...state.completed],
    read: [...state.read],
    access: state.access,
    batchRequests: state.batchRequests,
  }));
}
loadDemoState();

const effectiveAccess = (module) => state.access[module.id] || module.access || 'locked';
const moduleProgress = (module) => {
  const recordings = module.recordings || [];
  const complete = recordings.reduce((count, _, index) => count + (state.completed.has(`${module.id}:${index}`) ? 1 : 0), 0);
  const read = (module.topics || []).reduce((count, topic) => count + (state.read.has(`${module.id}:${topic.slug}`) ? 1 : 0), 0);
  const total = recordings.length + module.topics.length;
  return { complete, read, total, percent: total ? Math.round(((complete + read) / total) * 100) : 0 };
};
const isUnlocked = (module) => effectiveAccess(module) === 'approved';

function moduleIcon(module, size = '') {
  const asset = ICONS[module.icon];
  if (asset) return `<span class="module-icon" style="--accent:${module.accent}"><img src="${asset}" alt="${escapeHtml(module.title)} tool icon" class="icon-img" /></span>`;
  const lucide = module.icon === 'shield' ? 'shield-check' : module.icon === 'rocket' ? 'rocket' : 'workflow';
  return `<span class="module-icon" style="--accent:${module.accent}">${icon(lucide, size || '')}</span>`;
}

function navItem(path, label, iconName, active) {
  return `<a href="${path}" data-route="${path}" class="nav-item ${active ? 'active' : ''}">${icon(iconName)}<span>${label}</span></a>`;
}

function currentPath() { return window.location.pathname.replace(/\/$/, '') || '/'; }
function activeNav(path) {
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/modules')) return 'modules';
  if (path.startsWith('/batches')) return 'batches';
  return 'dashboard';
}
function pageTitle(path) {
  if (path.startsWith('/admin')) return path.includes('access') ? 'Access requests' : 'Batch management';
  if (path.startsWith('/modules/')) return 'Module workspace';
  if (path === '/modules') return 'Module library';
  if (path === '/batches') return 'Batches';
  return 'Dashboard';
}
function appShell(content) {
  const path = currentPath();
  const active = activeNav(path);
  return `<div class="app-shell shell-bg">
    <aside class="sidebar" id="sidebar">
      <a class="brand" href="/dashboard" data-route="/dashboard" aria-label="Scalevo dashboard">
        <img src="/scalevo-mark.svg" alt="Scalevo" />
        <span class="brand-wordmark">Scalevo<small>DevOps learning workspace</small></span>
      </a>
      <div class="nav-label">Workspace</div>
      <nav class="nav-list" aria-label="Primary navigation">
        ${navItem('/dashboard', 'Dashboard', 'layout-dashboard', active === 'dashboard')}
        ${navItem('/modules', 'Modules', 'layers-3', active === 'modules')}
        ${navItem('/batches', 'Batches / My batch', 'users-round', active === 'batches')}
      </nav>
      <div class="nav-label">Manage</div>
      <nav class="nav-list" aria-label="Management navigation">
        ${navItem('/admin/batches', 'Admin workspace', 'settings-2', active === 'admin')}
        ${navItem('/admin/access-requests', 'Access requests', 'inbox', false)}
      </nav>
      <div class="sidebar-spacer"></div>
      <div class="callout" style="padding:12px; margin: 0 4px 12px;">
        ${icon('sparkles')}
        <div><strong>Study rhythm</strong><p>One concept, one focused session, then a small win.</p></div>
      </div>
      <div class="profile-mini">
        <span class="avatar">AM</span><div><strong>Aarav Menon</strong><span>Learner · Platform Engineering</span></div>
      </div>
    </aside>
    <main class="main">
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:10px;min-width:0;">
          <button class="mobile-menu" data-toggle-sidebar aria-label="Open navigation">${icon('menu')}</button>
          <div class="breadcrumbs">${icon('chevron-right')}<strong>${escapeHtml(pageTitle(path))}</strong></div>
        </div>
        <div class="top-actions"><span class="status-pill"><span class="status-dot"></span> Workspace online</span><span class="avatar" aria-label="Aarav Menon">AM</span></div>
      </header>
      ${content}
    </main>
  </div>`;
}

function renderLoading() {
  app.innerHTML = `<div class="shell-bg" style="display:grid;min-height:100vh;place-items:center;"><div class="glass" style="border-radius:18px;padding:28px;text-align:center;">${icon('loader-circle', 'spin')}<p style="margin:12px 0 0;color:#66728a;font-size:12px;font-weight:700;">Preparing your learning workspace…</p></div></div>`;
  if (window.lucide) lucide.createIcons();
}

function renderDashboard() {
  const approved = state.modules.filter(isUnlocked).length;
  const totalTopics = state.modules.reduce((sum, module) => sum + module.topics.length, 0);
  const readCount = state.read.size;
  const completeCount = state.completed.size;
  const focus = state.modules.find((module) => isUnlocked(module) && moduleProgress(module).percent < 100) || state.modules[0];
  const recent = state.modules.filter((module) => isUnlocked(module)).slice(0, 4);
  return appShell(`<div class="page">
    <section class="hero"><div class="hero-copy"><div class="eyebrow">Your learning path</div><h1>Build the habit.<br /><em>Ship the concept.</em></h1><p>Keep your DevOps learning moving with short recordings, clear documentation, and a workspace that remembers what you have already understood.</p></div><div class="hero-action"><a class="button secondary" href="/modules" data-route="/modules">Browse modules ${icon('arrow-up-right')}</a></div></section>
    <section class="metrics">
      <div class="metric glass"><small>Curriculum</small><strong>${state.modules.length}</strong><p>modules in your pathway</p></div>
      <div class="metric glass"><small>Accessible</small><strong>${approved}</strong><p>modules currently unlocked</p></div>
      <div class="metric glass"><small>Topics read</small><strong>${readCount}<span style="font-size:14px;color:#a1adbf;"> / ${totalTopics}</span></strong><p>documentation progress</p></div>
      <div class="metric glass"><small>Recordings</small><strong>${completeCount}</strong><p>sessions completed</p></div>
    </section>
    <div class="dashboard-grid">
      <section class="glass panel"><div class="panel-head"><div><div class="eyebrow">Continue where you left off</div><h3>${escapeHtml(focus?.title || 'Start your pathway')}</h3><p>${focus ? `${moduleProgress(focus).percent}% of this module is in motion.` : 'Choose a module to begin.'}</p></div>${focus ? `<a class="button secondary" href="/modules/${focus.id}/documentation" data-route="/modules/${focus.id}/documentation">Open module ${icon('arrow-right')}</a>` : ''}</div><div class="list">${recent.map((module) => renderRecentRow(module)).join('')}</div></section>
      <aside class="aside-stack"><section class="glass panel"><div class="eyebrow">This week</div><h3>Keep a small streak</h3><p style="color:#66728a;font-size:11px;line-height:1.7;margin:7px 0 0;">A little consistency compounds faster than a weekend sprint.</p><div class="streak">${['M','T','W','T','F','S','S'].map((day, index) => `<span class="streak-day ${index < 4 ? 'active' : index === 4 ? 'soft-active' : ''}">${day}</span>`).join('')}</div><div style="display:flex;justify-content:space-between;color:#94a3b8;font-size:10px;font-weight:800;"><span>4 day streak</span><span>Next: docs</span></div></section><section class="glass panel"><div class="callout" style="border:0;padding:0;background:transparent;"><span style="display:grid;place-items:center;flex:0 0 auto;width:32px;height:32px;border-radius:10px;color:#3568f5;background:#edf3ff;">${icon('bookmark')}</span><div><strong style="color:#2f4371;">Your next best move</strong><p>Read the topic notes before you press play. Context makes the recording stick.</p></div></div></section></aside>
    </div>
    <section style="margin-top:34px;"><div class="section-head"><div><div class="eyebrow">Course library</div><h2>Pick the next concept</h2></div><a class="button ghost" href="/modules" data-route="/modules">See all ${icon('arrow-right')}</a></div><div class="module-grid">${state.modules.slice(0, 6).map(renderModuleCard).join('')}</div></section>
  </div>`);
}

function renderRecentRow(module) {
  const progress = moduleProgress(module);
  return `<a class="list-row" href="/modules/${module.id}/recordings" data-route="/modules/${module.id}/recordings"><span class="list-icon" style="color:${module.accent};background:color-mix(in srgb, ${module.accent} 10%, white);">${icon(module.icon === 'shield' ? 'shield' : module.icon === 'rocket' ? 'rocket' : 'play-circle')}</span><main><strong>${escapeHtml(module.title)}</strong><p>${progress.complete} recordings · ${progress.read} topics read · ${progress.percent}% total</p></main><span style="color:#a1adbf;">${icon('chevron-right')}</span></a>`;
}

function renderModules() {
  const query = state.search.trim().toLowerCase();
  const modules = state.modules.filter((module) => `${module.title} ${module.category} ${module.description}`.toLowerCase().includes(query));
  return appShell(`<div class="page"><section class="hero"><div class="hero-copy"><div class="eyebrow">Course library · 15 modules</div><h1>From first command to <em>production confidence.</em></h1><p>Follow the pathway in order or open the concept your current project needs. Every module keeps recordings and documentation side by side.</p></div><div class="hero-action"><span class="status-pill">${modules.length} visible paths</span></div></section><section><div class="section-head"><div><div class="eyebrow">Your catalog</div><h2>All modules</h2></div><label class="searchbox">${icon('search')}<input data-module-search type="search" placeholder="Search modules" value="${escapeHtml(state.search)}" aria-label="Search modules" /></label></div>${modules.length ? `<div class="module-grid">${modules.map(renderModuleCard).join('')}</div>` : `<div class="glass empty">${icon('search')}<h3>No matching modules</h3><p>Try a tool name, category, or a broader concept.</p></div>`}</section></div>`);
}

function renderModuleCard(module) {
  const progress = moduleProgress(module);
  const access = effectiveAccess(module);
  const accessLabel = access === 'approved' ? 'Approved' : access === 'pending' ? 'Pending review' : access === 'denied' ? 'Request denied' : 'Locked';
  return `<a href="/modules/${module.id}/recordings" data-route="/modules/${module.id}/recordings" class="module-card card glass" style="--accent:${module.accent}"><div><div class="module-top">${moduleIcon(module)}<span class="module-number">${module.number}</span></div><h3>${escapeHtml(module.title)}</h3><p>${escapeHtml(module.description)}</p></div><div class="module-foot"><div class="module-stats"><span>${icon('play-circle')} ${module.recordings.length} recordings</span><span>${module.topics.length} topics</span></div><div class="progress" style="margin-top:10px;"><span style="width:${progress.percent}%;"></span></div><div class="module-cta"><span class="badge ${access}">${accessLabel}</span><span class="round">${icon(access === 'approved' ? 'arrow-up-right' : access === 'pending' ? 'clock-3' : 'lock-keyhole')}</span></div></div></a>`;
}

function moduleFromPath() {
  const parts = currentPath().split('/').filter(Boolean);
  return state.modules.find((module) => module.id === parts[1]);
}
function moduleTab(module, label, tab, iconName, active) {
  const path = `/modules/${module.id}/${tab}`;
  return `<a class="tab ${active ? 'active' : ''}" href="${path}" data-route="${path}">${icon(iconName)}${label}</a>`;
}
function renderModulePage(module) {
  const path = currentPath();
  const docs = path.includes('/documentation');
  const progress = moduleProgress(module);
  return appShell(`<div class="page narrow"><div style="margin-bottom:16px;"><a href="/modules" data-route="/modules" class="button ghost">${icon('arrow-left')} Back to modules</a></div><section class="detail-hero"><div><div class="detail-title">${moduleIcon(module)}<div><div class="eyebrow">Module ${module.number} · ${escapeHtml(module.category)}</div><h1>${escapeHtml(module.title)}</h1></div></div><p>${escapeHtml(module.description)}</p></div><div class="detail-metrics"><div class="detail-metric glass"><small>Progress</small><strong>${progress.percent}%</strong></div><div class="detail-metric glass"><small>Access</small><strong>${effectiveAccess(module) === 'approved' ? 'Open' : 'Locked'}</strong></div></div></section><nav class="tabs" aria-label="Module sections">${moduleTab(module, 'Recordings', 'recordings', 'play-circle', !docs)}${moduleTab(module, 'Documentation', 'documentation', 'book-open', docs)}</nav>${docs ? renderDocumentation(module) : renderRecordings(module)}</div>`);
}

function accessPanel(module) {
  const access = effectiveAccess(module);
  const copy = access === 'pending' ? 'Your request is queued for admin review. You will receive module access after it is approved.' : access === 'denied' ? 'This request was not approved. You can send a new request with more context.' : 'This module is part of the full pathway. Request access to unlock recordings and documentation.';
  return `<div class="glass empty" style="max-width:620px;margin:30px auto;">${icon(access === 'pending' ? 'clock-3' : access === 'denied' ? 'shield-x' : 'lock-keyhole')}<h3>${access === 'pending' ? 'Access request pending' : access === 'denied' ? 'Access needs a second look' : 'This module is locked'}</h3><p>${copy}</p><div style="margin-top:18px;">${access === 'pending' ? '<span class="badge pending">Pending review</span>' : `<button class="button" data-request-access="${module.id}">${icon('send')} Request access</button>`}</div></div>`;
}

function renderRecordings(module) {
  if (!isUnlocked(module)) return accessPanel(module);
  return `<div class="detail-layout"><section><div class="section-head"><div><div class="eyebrow">Recording library</div><h2>Sessions in this module</h2></div><span class="status-pill">${module.recordings.length} sessions</span></div><div class="lesson-list">${module.recordings.map((title, index) => renderLesson(module, title, index)).join('')}</div></section><aside class="aside-stack"><section class="glass side-card"><div class="eyebrow">Study rhythm</div><h3>One session at a time.</h3><p>Watch inside the workspace, mark the session complete, and use the documentation tab when you need a calmer reference.</p><div class="side-list"><div>${icon('play-circle')} Branded in-app player</div><div>${icon('check-circle-2')} Progress saved locally</div><div>${icon('bookmark')} Documentation beside you</div></div></section><section class="glass side-card"><div class="eyebrow">Documentation</div><h3>Before you press play</h3><p>Build the mental model first, then use the recording for the walkthrough and practical details.</p><a class="button secondary" style="margin-top:14px;" href="/modules/${module.id}/documentation" data-route="/modules/${module.id}/documentation">Open documentation ${icon('arrow-right')}</a></section></aside></div>`;
}

function renderLesson(module, title, index) {
  const done = state.completed.has(`${module.id}:${index}`);
  return `<div class="lesson-row ${done ? 'done' : ''}"><span class="lesson-index">${String(index + 1).padStart(2, '0')}</span><main><strong>${escapeHtml(title)}</strong><p>Recording · focused walkthrough · ${done ? 'completed' : 'not started'}</p></main><div class="lesson-actions"><button class="button secondary" data-play="${module.id}|${index}">${icon('play', 'fill-current')} Watch</button><button class="check-button ${done ? 'done' : ''}" data-toggle-complete="${module.id}|${index}" aria-label="${done ? 'Mark incomplete' : 'Mark complete'}">${icon(done ? 'check' : 'circle')}</button></div></div>`;
}

function renderDocumentation(module) {
  if (!isUnlocked(module)) return accessPanel(module);
  const parts = currentPath().split('/').filter(Boolean);
  const slug = parts[4] || module.topics[0]?.slug;
  const topic = module.topics.find((item) => item.slug === slug) || module.topics[0];
  const index = Math.max(0, module.topics.findIndex((item) => item.slug === topic.slug));
  const topicSearch = state.docSearch.trim().toLowerCase();
  const topics = topicSearch ? module.topics.filter((item) => `${item.title} ${item.definition} ${item.why} ${item.how}`.toLowerCase().includes(topicSearch)) : module.topics;
  return `<div class="topic-layout"><aside class="glass topic-nav"><div class="eyebrow" style="margin:0 8px;">In this module</div><h3>Documentation</h3><label class="searchbox" style="width:100%;margin:0 0 10px;">${icon('search')}<input data-doc-search type="search" value="${escapeHtml(state.docSearch)}" placeholder="Search topics" aria-label="Search documentation" /></label><div class="topic-links">${topics.map((item) => `<a class="topic-link ${item.slug === topic.slug ? 'active' : ''}" href="/modules/${module.id}/documentation/${item.slug}" data-route="/modules/${module.id}/documentation/${item.slug}"><span>${String(module.topics.indexOf(item) + 1).padStart(2, '0')}</span>${escapeHtml(item.title)}</a>`).join('')}</div>${topics.length ? '' : '<p style="margin:12px 8px;color:#9aa7ba;font-size:10px;line-height:1.5;">No topic matches that search.</p>'}</aside><article class="topic-content"><div class="eyebrow">Topic ${String(index + 1).padStart(2, '0')} of ${module.topics.length}</div><h1>${escapeHtml(topic.title)}</h1><p class="topic-lead">${escapeHtml(topic.definition)}</p><section class="topic-section"><h2>Why it matters</h2><p>${escapeHtml(topic.why)}</p></section><section class="topic-section"><h2>How it works</h2><p>${escapeHtml(topic.how)}</p></section><div class="example"><small>Practical example</small><p>${escapeHtml(topic.example)}</p></div><section class="topic-section"><h2>Common mistake</h2><p>${escapeHtml(topic.mistake)}</p></section><section class="topic-section"><h2>Recap</h2><p>${escapeHtml(topic.recap)}</p></section><div class="topic-bottom"><button class="topic-nav-button" data-topic-prev="${module.id}|${index}">${icon('arrow-left')}<span><small>Previous topic</small>${index > 0 ? escapeHtml(module.topics[index - 1].title) : 'Module overview'}</span></button><button class="read-button ${state.read.has(`${module.id}:${topic.slug}`) ? 'read' : ''}" data-mark-read="${module.id}|${topic.slug}">${icon(state.read.has(`${module.id}:${topic.slug}`) ? 'check' : 'bookmark')} ${state.read.has(`${module.id}:${topic.slug}`) ? 'Read saved' : 'Mark as read'}</button><button class="topic-nav-button next" data-topic-next="${module.id}|${index}"><span><small>Next topic</small>${index < module.topics.length - 1 ? escapeHtml(module.topics[index + 1].title) : 'Recordings'}</span>${icon('arrow-right')}</button></div></article></div>`;
}

function renderBatches() {
  return appShell(`<div class="page"><section class="hero"><div class="hero-copy"><div class="eyebrow">Batches / My batch</div><h1>Learn with a little <em>structure around you.</em></h1><p>Batch access keeps schedules, module assignments, and review status in one place. A request is only a request until an admin approves it.</p></div><div class="hero-action"><span class="status-pill">${batches.length} programmes</span></div></section><div class="callout" style="margin-bottom:22px;">${icon('info')}<div><strong>Access is permission-based</strong><p>Viewing a batch card does not unlock its modules. Approved membership is what grants access.</p></div></div><div class="batch-grid">${batches.map(renderBatchCard).join('')}</div></div>`);
}
function renderBatchCard(batch) {
  const status = state.batchRequests[batch.id] || (batch.id === 'platform-26' ? 'Approved member' : 'Not requested');
  const isRequested = status === 'Pending review';
  return `<section class="glass batch-card"><div class="batch-card-head"><div><div class="eyebrow">${escapeHtml(batch.status)}</div><h3>${escapeHtml(batch.name)}</h3><p>${escapeHtml(batch.description)}</p></div><span class="badge ${batch.status === 'Active' ? 'approved' : batch.status === 'Open for requests' ? 'pending' : 'locked'}">${escapeHtml(batch.status)}</span></div><div class="batch-meta"><div><small>Dates</small><strong>${formatDate(batch.start)}<br />${formatDate(batch.end)}</strong></div><div><small>Schedule</small><strong>${escapeHtml(batch.schedule)}</strong></div><div><small>Modules</small><strong>${batch.modules} assigned · ${batch.members} learners</strong></div></div><div class="batch-footer"><span>${status === 'Approved member' ? `${icon('badge-check')} ${status}` : status}</span>${batch.status === 'Open for requests' ? (isRequested ? '<span class="badge pending">Pending review</span>' : `<button class="button secondary" data-batch-request="${batch.id}">${icon('send')} Request access</button>`) : batch.status === 'Active' ? '<span class="badge approved">My batch</span>' : '<span class="badge locked">Coming later</span>'}</div></section>`;
}

function renderAdmin() {
  const requests = [
    { name: 'Meera Shah', email: 'meera.shah@example.com', batch: 'Cloud Native Foundations · 2027', status: 'Pending', when: '12 min ago' },
    { name: 'Rohan Iyer', email: 'rohan.iyer@example.com', batch: 'Secure Delivery Lab', status: 'Pending', when: '1 hr ago' },
    { name: 'Nisha Thomas', email: 'nisha.thomas@example.com', batch: 'Platform Engineering · 2026', status: 'Approved', when: 'Yesterday' },
  ];
  const adminAccess = currentPath() === '/admin/access-requests';
  return appShell(`<div class="page"><section class="hero" style="padding-bottom:22px;"><div class="hero-copy"><div class="eyebrow">Admin workspace</div><h1>Make access <em>deliberate.</em></h1><p>Review batch requests, keep module assignments clear, and make the learner’s next step obvious.</p></div><div class="hero-action"><button class="button purple" data-admin-action="create">${icon('plus')} Create batch</button></div></section><div class="admin-tabs"><a class="admin-tab ${!adminAccess ? 'active' : ''}" href="/admin/batches" data-route="/admin/batches">Batch management</a><a class="admin-tab ${adminAccess ? 'active' : ''}" href="/admin/access-requests" data-route="/admin/access-requests">Access requests <span class="badge pending" style="margin-left:4px;padding:4px 6px;">2</span></a></div>${adminAccess ? renderAdminRequests(requests) : renderAdminBatches()}</div>`);
}
function renderAdminBatches() {
  return `<div class="dashboard-grid"><section class="glass panel"><div class="panel-head"><div><div class="eyebrow">Programmes</div><h3>Batch management</h3><p>Assign modules once, then let approved members inherit access.</p></div><span class="status-pill">${batches.length} records</span></div><div class="list">${batches.map((batch) => `<div class="list-row"><span class="list-icon" style="color:${batch.status === 'Active' ? '#16a34a' : '#3568f5'};background:${batch.status === 'Active' ? '#eaf9ef' : '#edf3ff'};">${icon(batch.status === 'Active' ? 'radio' : 'calendar-days')}</span><main><strong>${escapeHtml(batch.name)}</strong><p>${batch.modules} modules · ${batch.members} members · ${escapeHtml(batch.schedule)}</p></main><span class="badge ${batch.status === 'Active' ? 'approved' : batch.status === 'Open for requests' ? 'pending' : 'locked'}">${escapeHtml(batch.status)}</span><button class="button ghost" data-admin-action="edit">${icon('pencil')}</button></div>`).join('')}</div></section><aside class="aside-stack"><section class="glass panel"><div class="eyebrow">Access model</div><h3>Effective access</h3><p>Direct grants and approved batch memberships are evaluated together. Pending or rejected requests grant no module access.</p><div class="side-list"><div>${icon('check-circle-2')} Approved membership</div><div>${icon('link-2')} Batch → module mapping</div><div>${icon('shield-check')} Server-side authorization</div></div></section><section class="glass panel"><div class="eyebrow">Audit note</div><h3>Changes stay explainable</h3><p>Every approval, removal, and module assignment should record who acted, when it happened, and why.</p></section></aside></div>`;
}
function renderAdminRequests(requests) {
  return `<section class="glass panel"><div class="panel-head"><div><div class="eyebrow">Review queue</div><h3>Pending batch requests</h3><p>Approve only when the learner should inherit the assigned module access.</p></div><span class="badge pending">2 pending</span></div><div style="margin-top:19px;">${requests.map((request, index) => `<div class="request-row"><span class="avatar" style="background:${index === 0 ? 'linear-gradient(135deg,#3568f5,#4f46e5)' : 'linear-gradient(135deg,#f59e0b,#ef4444)'};">${request.name.split(' ').map((x) => x[0]).join('')}</span><main><strong>${escapeHtml(request.name)} <span style="color:#9aa7ba;font-weight:600;">requested access to</span> ${escapeHtml(request.batch)}</strong><p>${escapeHtml(request.email)} · ${request.when}</p></main><span class="badge ${request.status.toLowerCase() === 'pending' ? 'pending' : 'approved'}">${request.status}</span>${request.status === 'Pending' ? `<div class="request-actions"><button class="button green" data-admin-action="approve">${icon('check')} Approve</button><button class="button secondary" data-admin-action="reject">${icon('x')} Reject</button></div>` : ''}</div>`).join('')}</div></section>`;
}

function render() {
  if (!state.loaded) return renderLoading();
  const path = currentPath();
  if (path === '/' || path === '/dashboard') app.innerHTML = renderDashboard();
  else if (path === '/modules') app.innerHTML = renderModules();
  else if (path === '/batches') app.innerHTML = renderBatches();
  else if (path.startsWith('/admin/')) app.innerHTML = renderAdmin();
  else if (path.startsWith('/modules/')) {
    const module = moduleFromPath();
    app.innerHTML = module ? renderModulePage(module) : appShell(`<div class="page"><div class="glass empty">${icon('circle-alert')}<h3>Module not found</h3><p>Return to the library and choose an available module.</p><a class="button" style="margin-top:16px;" href="/modules" data-route="/modules">Back to modules</a></div></div>`);
  } else app.innerHTML = renderDashboard();
  if (window.lucide) lucide.createIcons({ attrs: { 'stroke-width': 2 } });
}

function navigate(path) {
  if (path === currentPath()) return;
  history.pushState({}, '', path);
  state.docSearch = '';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
}
function updateInput(key, value, selector) {
  state[key] = value;
  render();
  const input = document.querySelector(selector);
  if (input) { input.focus(); input.setSelectionRange(value.length, value.length); }
}
function updatePlayerTime() {
  const time = Math.round((Number(state.playerProgress) / 100) * 1458);
  const minutes = String(Math.floor(time / 60)).padStart(2, '0');
  const seconds = String(time % 60).padStart(2, '0');
  const label = document.querySelector('[data-player-time]');
  if (label) label.textContent = `${minutes}:${seconds} / 24:18`;
  const progress = document.querySelector('[data-player-progress]');
  if (progress) progress.value = String(state.playerProgress);
}
function openPlayer(module, index) {
  state.player = { moduleId: module.id, index };
  state.playing = false;
  state.playerProgress = 26;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" data-player-backdrop role="dialog" aria-modal="true" aria-label="Branded lesson player"><div class="player-modal"><div class="player-head"><div><strong>${escapeHtml(module.recordings[index])}</strong><small>${escapeHtml(module.title)} · Scalevo session</small></div><button class="close-button" data-close-player aria-label="Close player">${icon('x')}</button></div><div class="player-stage"><div class="player-grid"></div><div class="player-center"><button class="play-large" data-player-play aria-label="Play lesson">${icon('play')}</button><strong>Ready when you are.</strong><span>Playback is contained inside your Scalevo workspace.</span></div></div><div class="player-controls"><input class="player-progress" type="range" min="0" max="100" value="${state.playerProgress}" data-player-progress aria-label="Lesson progress" /><div class="player-control-row"><div class="player-control-set"><button class="player-control" data-player-play aria-label="Play or pause">${icon('play')}</button><span class="player-control-label" data-player-time>06:42 / 24:18</span><button class="player-control" aria-label="Volume">${icon('volume-2')}</button><select class="player-speed" aria-label="Playback speed"><option>1×</option><option>1.25×</option><option>1.5×</option><option>2×</option></select></div><div class="player-control-set"><button class="player-control" aria-label="Captions">${icon('captions')}</button><button class="player-control" aria-label="Picture in picture">${icon('picture-in-picture-2')}</button><button class="player-control" aria-label="Fullscreen">${icon('maximize')}</button></div></div></div><div class="player-foot"><p>Custom Scalevo player · no outbound video navigation</p><button class="button green" data-player-complete>${icon('check')} Mark complete</button></div></div></div>`);
  if (window.lucide) lucide.createIcons();
  document.querySelector('[data-close-player]')?.focus();
  updatePlayerTime();
}
function closePlayer() { clearInterval(state.playerTimer); state.playerTimer = null; document.querySelector('[data-player-backdrop]')?.remove(); state.player = null; state.playing = false; }
function togglePlayer() {
  state.playing = !state.playing;
  clearInterval(state.playerTimer);
  if (state.playing) {
    state.playerTimer = setInterval(() => {
      state.playerProgress = Math.min(100, Number(state.playerProgress) + 0.35);
      updatePlayerTime();
      if (state.playerProgress >= 100) togglePlayer();
    }, 1000);
  }
  document.querySelectorAll('[data-player-play]').forEach((button) => { button.innerHTML = icon(state.playing ? 'pause' : 'play'); });
  const label = document.querySelector('[data-player-label]');
  if (label) label.textContent = state.playing ? 'Playing your lesson preview' : 'Lesson paused';
  if (window.lucide) lucide.createIcons();
  showToast(state.playing ? 'Playing lesson preview' : 'Lesson paused');
}

app.addEventListener('click', (event) => {
  const route = event.target.closest('[data-route]');
  if (route) { event.preventDefault(); document.querySelector('#sidebar')?.classList.remove('open'); navigate(route.dataset.route); return; }
  const toggleSidebar = event.target.closest('[data-toggle-sidebar]');
  if (toggleSidebar) { document.querySelector('#sidebar')?.classList.toggle('open'); return; }
  const requestAccess = event.target.closest('[data-request-access]');
  if (requestAccess) { state.access[requestAccess.dataset.requestAccess] = 'pending'; persistDemoState(); render(); showToast('Access request sent to the administrator'); return; }
  const batchRequest = event.target.closest('[data-batch-request]');
  if (batchRequest) { state.batchRequests[batchRequest.dataset.batchRequest] = 'Pending review'; persistDemoState(); render(); showToast('Batch request sent for review'); return; }
  const markRead = event.target.closest('[data-mark-read]');
  if (markRead) { const [moduleId, slug] = markRead.dataset.markRead.split('|'); const key = `${moduleId}:${slug}`; state.read.has(key) ? state.read.delete(key) : state.read.add(key); persistDemoState(); render(); return; }
  const complete = event.target.closest('[data-toggle-complete]');
  if (complete) { const [moduleId, index] = complete.dataset.toggleComplete.split('|'); const key = `${moduleId}:${index}`; state.completed.has(key) ? state.completed.delete(key) : state.completed.add(key); persistDemoState(); render(); showToast(state.completed.has(key) ? 'Lesson marked complete' : 'Lesson marked incomplete'); return; }
  const play = event.target.closest('[data-play]');
  if (play) { const [moduleId, index] = play.dataset.play.split('|'); const module = state.modules.find((item) => item.id === moduleId); if (module) openPlayer(module, Number(index)); return; }
  const prev = event.target.closest('[data-topic-prev]');
  if (prev) { const [moduleId, index] = prev.dataset.topicPrev.split('|'); const module = state.modules.find((item) => item.id === moduleId); const nextPath = Number(index) > 0 ? `/modules/${moduleId}/documentation/${module.topics[Number(index) - 1].slug}` : `/modules/${moduleId}/recordings`; navigate(nextPath); return; }
  const next = event.target.closest('[data-topic-next]');
  if (next) { const [moduleId, index] = next.dataset.topicNext.split('|'); const module = state.modules.find((item) => item.id === moduleId); const nextPath = Number(index) < module.topics.length - 1 ? `/modules/${moduleId}/documentation/${module.topics[Number(index) + 1].slug}` : `/modules/${moduleId}/recordings`; navigate(nextPath); return; }
  if (event.target.closest('[data-close-player]') || event.target.matches('[data-player-backdrop]')) { closePlayer(); return; }
  if (event.target.closest('[data-player-play]')) { togglePlayer(); return; }
  const playerComplete = event.target.closest('[data-player-complete]');
  if (playerComplete && state.player) { const key = `${state.player.moduleId}:${state.player.index}`; state.completed.add(key); persistDemoState(); closePlayer(); render(); showToast('Lesson marked complete'); return; }
  const adminAction = event.target.closest('[data-admin-action]');
  if (adminAction) { const action = adminAction.dataset.adminAction; showToast(action === 'approve' ? 'Request approved; membership updated' : action === 'reject' ? 'Request rejected with audit note' : action === 'create' ? 'Batch creation form is ready for the next step' : 'Edit mode opened'); return; }
});

document.addEventListener('input', (event) => {
  if (event.target.matches('[data-module-search]')) updateInput('search', event.target.value, '[data-module-search]');
  if (event.target.matches('[data-doc-search]')) updateInput('docSearch', event.target.value, '[data-doc-search]');
  if (event.target.matches('[data-player-progress]')) { state.playerProgress = event.target.value; updatePlayerTime(); }
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closePlayer(); });
window.addEventListener('popstate', () => { state.docSearch = ''; render(); });

async function bootstrap() {
  renderLoading();
  try {
    const response = await fetch('/api/catalog');
    state.modules = (await response.json()).sort((a, b) => Number(a.number) - Number(b.number));
  } catch (error) {
    state.modules = [];
    showToast('Catalog could not be loaded');
  }
  state.loaded = true;
  render();
}
bootstrap();
