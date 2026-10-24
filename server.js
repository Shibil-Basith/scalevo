const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const mysql = require("mysql2/promise");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const INDEX = path.join(ROOT, "index.html");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "content-seed.json"), "utf8"));
let pool;

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(payload);
}

function html(res, status, body) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
  res.end(body);
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const at = part.indexOf("=");
    return at < 0 ? [part, ""] : [part.slice(0, at), decodeURIComponent(part.slice(at + 1))];
  }));
}

function setSession(res, token, req) {
  const forwarded = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const secure = forwarded === "https" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `devops_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=None; Max-Age=604800${secure}`);
}

function clearSession(res, req) {
  const forwarded = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const secure = forwarded === "https" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `devops_session=; Path=/; HttpOnly; SameSite=None; Max-Age=0${secure}`);
}

async function body(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (raw.length > 1024 * 1024) throw new Error("Request too large");
  return raw ? JSON.parse(raw) : {};
}

function safe(value, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, 1000) : fallback;
}

async function db() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not available");
    pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 5, waitForConnections: true, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

async function ensureSchema() {
  const connection = await (await db()).getConnection();
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      google_sub VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(320) NOT NULL UNIQUE,
      full_name VARCHAR(180) NOT NULL,
      phone VARCHAR(40) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_login_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await connection.query(`CREATE TABLE IF NOT EXISTS sessions (
      token CHAR(64) NOT NULL PRIMARY KEY,
      user_id BIGINT UNSIGNED NULL,
      role VARCHAR(20) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX (user_id), INDEX (expires_at)
    )`);
    await connection.query(`CREATE TABLE IF NOT EXISTS progress (
      user_id BIGINT UNSIGNED NOT NULL,
      module_id VARCHAR(100) NOT NULL,
      lesson_title VARCHAR(255) NOT NULL,
      completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, module_id, lesson_title),
      INDEX (module_id)
    )`);
    await connection.query(`CREATE TABLE IF NOT EXISTS content_modules (
      id VARCHAR(100) NOT NULL PRIMARY KEY,
      module_number VARCHAR(20) NOT NULL,
      category VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      accent VARCHAR(30) NOT NULL,
      icon TEXT NOT NULL,
      description TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    await connection.query(`CREATE TABLE IF NOT EXISTS content_lessons (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      module_id VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      drive_id VARCHAR(255) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      UNIQUE KEY module_lesson_order (module_id, sort_order),
      INDEX (module_id)
    )`);
    await connection.query(`CREATE TABLE IF NOT EXISTS module_access_requests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      module_id VARCHAR(100) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP NULL DEFAULT NULL,
      reviewed_by VARCHAR(100) NULL DEFAULT NULL,
      UNIQUE KEY user_module_access (user_id, module_id),
      INDEX (module_id), INDEX (status), INDEX (requested_at)
    )`);
    await connection.query(`CREATE TABLE IF NOT EXISTS content_documentation (
      module_id VARCHAR(100) NOT NULL,
      topic_slug VARCHAR(255) NOT NULL,
      topic_title VARCHAR(255) NOT NULL,
      markdown LONGTEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (module_id, topic_slug),
      INDEX (module_id)
    )`);
    await connection.query(`CREATE TABLE IF NOT EXISTS batches (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(180) NOT NULL,
      description TEXT NOT NULL,
      schedule VARCHAR(180) NOT NULL,
      start_date DATE NULL,
      end_date DATE NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'open',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (status), INDEX (start_date)
    )`);
    await connection.query(`CREATE TABLE IF NOT EXISTS batch_requests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      batch_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT UNSIGNED NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP NULL DEFAULT NULL,
      reviewed_by VARCHAR(100) NULL DEFAULT NULL,
      UNIQUE KEY user_batch_request (batch_id, user_id),
      INDEX (batch_id), INDEX (user_id), INDEX (status)
    )`);
    const [[count]] = await connection.query("SELECT COUNT(*) AS count FROM content_modules");
    if (Number(count.count) === 0) {
      for (let index = 0; index < seed.length; index += 1) {
        const module = seed[index];
        await connection.query("INSERT INTO content_modules (id, module_number, category, title, accent, icon, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [module.id, module.number, module.category, module.title, module.accent, module.icon, module.description, index]);
        for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex += 1) {
          const lesson = module.lessons[lessonIndex];
          await connection.query("INSERT INTO content_lessons (module_id, title, drive_id, sort_order) VALUES (?, ?, ?, ?)", [module.id, lesson.title, lesson.id, lessonIndex]);
        }
      }
    }
  } finally {
    connection.release();
  }
}

async function getSession(req) {
  const token = parseCookies(req).devops_session;
  if (!token) return null;
  const [rows] = await (await db()).query("SELECT s.token, s.role, s.user_id, s.expires_at, u.email, u.full_name, u.phone FROM sessions s LEFT JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at > NOW() LIMIT 1", [token]);
  return rows[0] || null;
}

function requireUser(session) {
  return session && (session.role === "user" || session.role === "admin");
}

function requireAdmin(session) {
  return session && session.role === "admin";
}

async function createSession(res, req, userId, role, extra = {}) {
  const token = crypto.randomBytes(32).toString("hex");
  await (await db()).query("INSERT INTO sessions (token, user_id, role, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))", [token, userId || null, role]);
  setSession(res, token, req);
  return { token, role, ...extra };
}

async function getContent(accessUserId = null) {
  const database = await db();
  const [modules] = await database.query("SELECT id, module_number AS number, category, title, accent, icon, description, sort_order FROM content_modules ORDER BY CAST(module_number AS UNSIGNED), module_number, title");
  const [lessons] = await database.query("SELECT id AS lessonId, module_id AS moduleId, title, drive_id AS driveId, sort_order AS sortOrder FROM content_lessons ORDER BY module_id, sort_order");
  const [documentation] = await database.query("SELECT module_id AS moduleId, topic_slug AS topicSlug, topic_title AS topicTitle, markdown, sort_order AS sortOrder, updated_at AS updatedAt FROM content_documentation ORDER BY module_id, sort_order, topic_title");
  const accessRows = accessUserId ? (await database.query("SELECT module_id AS moduleId, status FROM module_access_requests WHERE user_id=?", [accessUserId]))[0] : [];
  const accessByModule = Object.fromEntries(accessRows.map((row) => [row.moduleId, row.status]));
  const docsByModule = documentation.reduce((result, doc) => { (result[doc.moduleId] ||= []).push(doc); return result; }, {});
  return modules.map((module) => { const unlocked = !accessUserId || accessByModule[module.id] === "approved"; const moduleLessons = lessons.filter((lesson) => lesson.moduleId === module.id).map((lesson) => ({ id: lesson.driveId, title: lesson.title, ready: Boolean(lesson.driveId), lessonId: lesson.lessonId })); return { ...module, accessStatus: accessUserId ? (accessByModule[module.id] || "locked") : "admin", unlocked, lessonCount: moduleLessons.length, lessons: unlocked ? moduleLessons : [], documentation: unlocked || !accessUserId ? (docsByModule[module.id] || []) : [] }; });
}

async function verifyGoogleCredential(credential) {
  if (!process.env.GOOGLE_CLIENT_ID) throw new Error("Google Sign-In is not configured");
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!response.ok) throw new Error("Google credential could not be verified");
  const profile = await response.json();
  if (profile.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error("Google credential belongs to another application");
  if (!["accounts.google.com", "https://accounts.google.com"].includes(profile.iss)) throw new Error("Invalid Google issuer");
  if (profile.email_verified !== "true") throw new Error("Verified Google email is required");
  if (!String(profile.email || "").toLowerCase().endsWith("@gmail.com")) throw new Error("Please use a Gmail account");
  return profile;
}

async function api(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/health") return json(res, 200, { ok: true, service: "devops-learning-workspace" });
  if (req.method === "GET" && pathname === "/api/config") return json(res, 200, { googleClientId: process.env.GOOGLE_CLIENT_ID || "" });
  let session = null;
  try { session = await getSession(req); } catch (error) {
    if (req.method === "GET" && pathname === "/api/auth/me") return json(res, 200, { authenticated: false, user: null, setupRequired: true });
    throw error;
  }
  if (req.method === "GET" && pathname === "/api/auth/me") return json(res, 200, { authenticated: Boolean(session), user: session ? { role: session.role, email: session.email || null, name: session.full_name || "Administrator", phone: session.phone || "" } : null });
  if (req.method === "POST" && pathname === "/api/auth/logout") { if (session) await (await db()).query("DELETE FROM sessions WHERE token=?", [session.token]); clearSession(res, req); return json(res, 200, { ok: true }); }
  if (req.method === "POST" && pathname === "/api/auth/admin") {
    const input = await body(req);
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    if (safe(input.username) !== adminUsername || String(input.password || "") !== adminPassword) return json(res, 401, { error: "Invalid administrator credentials" });
    await createSession(res, req, null, "admin");
    return json(res, 200, { ok: true, user: { role: "admin", name: "Administrator", email: null, phone: "" } });
  }
  if (req.method === "POST" && pathname === "/api/auth/google") {
    const input = await body(req);
    const fullName = safe(input.name);
    const phone = safe(input.phone);
    if (fullName.length < 2 || phone.length < 7) return json(res, 400, { error: "Full name and phone number are required" });
    const profile = await verifyGoogleCredential(String(input.credential || ""));
    const database = await db();
    await database.query(`INSERT INTO users (google_sub, email, full_name, phone, last_login_at) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE email=VALUES(email), full_name=VALUES(full_name), phone=VALUES(phone), last_login_at=NOW()`, [profile.sub, profile.email, fullName, phone]);
    const [[user]] = await database.query("SELECT id, email, full_name, phone FROM users WHERE google_sub=? LIMIT 1", [profile.sub]);
    await createSession(res, req, user.id, "user");
    return json(res, 200, { ok: true, user: { role: "user", email: user.email, name: user.full_name, phone: user.phone } });
  }
  const accessRequestMatch = pathname.match(/^\/api\/modules\/([^/]+)\/access-request$/);
  if (req.method === "POST" && accessRequestMatch) {
    if (!requireUser(session) || !session.user_id) return json(res, 401, { error: "Candidate login required" });
    const [[module]] = await (await db()).query("SELECT id FROM content_modules WHERE id=? LIMIT 1", [accessRequestMatch[1]]);
    if (!module) return json(res, 404, { error: "Module not found" });
    await (await db()).query("INSERT INTO module_access_requests (user_id, module_id, status, requested_at, reviewed_at, reviewed_by) VALUES (?, ?, 'pending', NOW(), NULL, NULL) ON DUPLICATE KEY UPDATE status='pending', requested_at=NOW(), reviewed_at=NULL, reviewed_by=NULL", [session.user_id, accessRequestMatch[1]]);
    return json(res, 200, { ok: true, status: "pending" });
  }
  if (req.method === "GET" && pathname === "/api/content") { if (!requireUser(session)) return json(res, 401, { error: "Login required" }); return json(res, 200, { modules: await getContent(session.user_id) }); }
  if (req.method === "GET" && pathname === "/api/progress") { if (!requireUser(session) || !session.user_id) return json(res, 401, { error: "Candidate login required" }); const [rows] = await (await db()).query("SELECT module_id AS moduleId, lesson_title AS lessonTitle FROM progress WHERE user_id=?", [session.user_id]); return json(res, 200, { progress: rows }); }
  if (req.method === "POST" && pathname === "/api/progress") { if (!requireUser(session) || !session.user_id) return json(res, 401, { error: "Candidate login required" }); const input = await body(req); const moduleId = safe(input.moduleId, ""); const lessonTitle = safe(input.lessonTitle, ""); if (!moduleId || !lessonTitle) return json(res, 400, { error: "Progress item is incomplete" }); const [[access]] = await (await db()).query("SELECT status FROM module_access_requests WHERE user_id=? AND module_id=? LIMIT 1", [session.user_id, moduleId]); if (access?.status !== "approved") return json(res, 403, { error: "Module access has not been approved" }); if (input.completed) await (await db()).query("INSERT IGNORE INTO progress (user_id, module_id, lesson_title) VALUES (?, ?, ?)", [session.user_id, moduleId, lessonTitle]); else await (await db()).query("DELETE FROM progress WHERE user_id=? AND module_id=? AND lesson_title=?", [session.user_id, moduleId, lessonTitle]); return json(res, 200, { ok: true }); }
  if (pathname.startsWith("/api/admin/") && !requireAdmin(session)) return json(res, 403, { error: "Administrator access required" });
  if (req.method === "GET" && pathname === "/api/admin/content") return json(res, 200, { modules: await getContent() });
  if (req.method === "GET" && pathname === "/api/admin/documentation") return json(res, 200, { documentation: (await getContent()).flatMap((module) => (module.documentation || []).map((doc) => ({ ...doc, moduleTitle: module.title }))) });
  if (req.method === "GET" && pathname === "/api/admin/access-requests") {
    const [requests] = await (await db()).query("SELECT r.id, r.module_id AS moduleId, m.module_number AS moduleNumber, m.title AS moduleTitle, r.status, r.requested_at AS requestedAt, r.reviewed_at AS reviewedAt, u.email, u.full_name AS name, u.phone FROM module_access_requests r JOIN users u ON u.id=r.user_id JOIN content_modules m ON m.id=r.module_id ORDER BY CASE WHEN r.status='pending' THEN 0 ELSE 1 END, r.requested_at DESC");
    return json(res, 200, { requests });
  }
  const accessDecisionMatch = pathname.match(/^\/api\/admin\/access-requests\/([0-9]+)$/);
  if (accessDecisionMatch && req.method === "PATCH") {
    const input = await body(req); const status = input.status === "approved" ? "approved" : input.status === "denied" ? "denied" : "";
    if (!status) return json(res, 400, { error: "Decision must be approved or denied" });
    const result = await (await db()).query("UPDATE module_access_requests SET status=?, reviewed_at=NOW(), reviewed_by='admin' WHERE id=?", [status, accessDecisionMatch[1]]);
    if (!result[0].affectedRows) return json(res, 404, { error: "Access request not found" });
    return json(res, 200, { ok: true, status });
  }
  if (req.method === "GET" && pathname === "/api/admin/users") {
    const [users] = await (await db()).query(`SELECT u.id, u.email, u.full_name AS name, u.phone, u.created_at AS createdAt, u.last_login_at AS lastLoginAt, COUNT(p.lesson_title) AS completed FROM users u LEFT JOIN progress p ON p.user_id=u.id GROUP BY u.id ORDER BY u.last_login_at DESC`);
    const [totals] = await (await db()).query("SELECT COUNT(*) AS total FROM content_lessons");
    return json(res, 200, { users, totalLessons: Number(totals[0].total) });
  }
  const documentationMatch = pathname.match(/^\/api\/admin\/modules\/([^/]+)\/documentation\/([^/]+)$/);
  if (documentationMatch && req.method === "PATCH") {
    const input = await body(req);
    const topicTitle = safe(input.topicTitle || input.topicSlug, "Untitled topic");
    const markdown = typeof input.markdown === "string" ? input.markdown.slice(0, 50000) : "";
    const [[module]] = await (await db()).query("SELECT id FROM content_modules WHERE id=? LIMIT 1", [documentationMatch[1]]);
    if (!module) return json(res, 404, { error: "Module not found" });
    await (await db()).query("INSERT INTO content_documentation (module_id, topic_slug, topic_title, markdown, sort_order) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE topic_title=VALUES(topic_title), markdown=VALUES(markdown)", [documentationMatch[1], documentationMatch[2], topicTitle, markdown, Number(input.sortOrder) || 0]);
    return json(res, 200, { ok: true });
  }
  if (req.method === "GET" && pathname === "/api/batches") {
    if (!requireUser(session) || !session.user_id) return json(res, 401, { error: "Candidate login required" });
    const database = await db();
    const [batches] = await database.query(`SELECT b.id, b.name, b.description, b.schedule, b.start_date AS startDate, b.end_date AS endDate, b.status, b.created_at AS createdAt, r.id AS requestId, r.status AS requestStatus FROM batches b LEFT JOIN batch_requests r ON r.batch_id=b.id AND r.user_id=? WHERE b.status <> 'archived' ORDER BY COALESCE(b.start_date, '9999-12-31'), b.name`, [session.user_id]);
    return json(res, 200, { batches });
  }
  const batchRequestMatch = pathname.match(/^\/api\/batches\/([0-9]+)\/request$/);
  if (batchRequestMatch && req.method === "POST") {
    if (!requireUser(session) || !session.user_id) return json(res, 401, { error: "Candidate login required" });
    const [[batch]] = await (await db()).query("SELECT id, status FROM batches WHERE id=? LIMIT 1", [batchRequestMatch[1]]);
    if (!batch || batch.status === "archived") return json(res, 404, { error: "Batch not found" });
    await (await db()).query("INSERT INTO batch_requests (batch_id, user_id, status, requested_at, reviewed_at, reviewed_by) VALUES (?, ?, 'pending', NOW(), NULL, NULL) ON DUPLICATE KEY UPDATE status='pending', requested_at=NOW(), reviewed_at=NULL, reviewed_by=NULL", [batchRequestMatch[1], session.user_id]);
    return json(res, 200, { ok: true, status: "pending" });
  }
  if (req.method === "GET" && pathname === "/api/admin/batches") {
    const database = await db();
    const [batches] = await database.query(`SELECT b.id, b.name, b.description, b.schedule, b.start_date AS startDate, b.end_date AS endDate, b.status, b.created_at AS createdAt, COUNT(CASE WHEN r.status='approved' THEN 1 END) AS memberCount, COUNT(CASE WHEN r.status='pending' THEN 1 END) AS pendingCount FROM batches b LEFT JOIN batch_requests r ON r.batch_id=b.id GROUP BY b.id ORDER BY COALESCE(b.start_date, '9999-12-31'), b.name`);
    const [requests] = await database.query(`SELECT r.id, r.batch_id AS batchId, b.name AS batchName, r.status, r.requested_at AS requestedAt, u.id AS userId, u.full_name AS name, u.email, u.phone FROM batch_requests r JOIN batches b ON b.id=r.batch_id JOIN users u ON u.id=r.user_id ORDER BY CASE WHEN r.status='pending' THEN 0 ELSE 1 END, r.requested_at DESC`);
    return json(res, 200, { batches, requests });
  }
  if (req.method === "POST" && pathname === "/api/admin/batches") {
    const input = await body(req); const name = safe(input.name); if (!name) return json(res, 400, { error: "Batch name is required" });
    const result = await (await db()).query("INSERT INTO batches (name, description, schedule, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)", [name, safe(input.description), safe(input.schedule), input.startDate || null, input.endDate || null, ["open", "upcoming", "closed", "archived"].includes(input.status) ? input.status : "open"]);
    return json(res, 201, { id: result[0].insertId });
  }
  const adminBatchMatch = pathname.match(/^\/api\/admin\/batches\/([0-9]+)$/);
  if (adminBatchMatch && req.method === "PATCH") {
    const input = await body(req); const status = ["open", "upcoming", "closed", "archived"].includes(input.status) ? input.status : "open";
    const result = await (await db()).query("UPDATE batches SET name=?, description=?, schedule=?, start_date=?, end_date=?, status=? WHERE id=?", [safe(input.name), safe(input.description), safe(input.schedule), input.startDate || null, input.endDate || null, status, adminBatchMatch[1]]);
    if (!result[0].affectedRows) return json(res, 404, { error: "Batch not found" });
    return json(res, 200, { ok: true });
  }
  if (adminBatchMatch && req.method === "DELETE") {
    await (await db()).query("DELETE FROM batch_requests WHERE batch_id=?", [adminBatchMatch[1]]); await (await db()).query("DELETE FROM batches WHERE id=?", [adminBatchMatch[1]]); return json(res, 200, { ok: true });
  }
  const batchDecisionMatch = pathname.match(/^\/api\/admin\/batch-requests\/([0-9]+)$/);
  if (batchDecisionMatch && req.method === "PATCH") {
    const input = await body(req); const status = input.status === "approved" ? "approved" : input.status === "denied" ? "denied" : ""; if (!status) return json(res, 400, { error: "Decision must be approved or denied" });
    const result = await (await db()).query("UPDATE batch_requests SET status=?, reviewed_at=NOW(), reviewed_by='admin' WHERE id=?", [status, batchDecisionMatch[1]]); if (!result[0].affectedRows) return json(res, 404, { error: "Batch request not found" }); return json(res, 200, { ok: true, status });
  }
  const moduleMatch = pathname.match(/^\/api\/admin\/modules\/([^/]+)$/);
  const reorderMatch = pathname.match(/^\/api\/admin\/modules\/([^/]+)\/lessons\/reorder$/);
  const lessonMatch = pathname.match(/^\/api\/admin\/modules\/([^/]+)\/lessons(?:\/([0-9]+))?$/);
  if (req.method === "POST" && pathname === "/api/admin/modules") {
    const input = await body(req); const id = safe(input.id) || safe(input.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "module"); const database = await db(); const [[max]] = await database.query("SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM content_modules"); await database.query("INSERT INTO content_modules (id, module_number, category, title, accent, icon, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id, safe(input.number), safe(input.category, "General"), safe(input.title), safe(input.accent, "#3568f5"), safe(input.icon), safe(input.description, "A new DevOps learning module."), Number(max.maxOrder) + 1]); return json(res, 201, { module: (await getContent()).find((item) => item.id === id) });
  }
  if (moduleMatch && req.method === "PATCH") { const input = await body(req); await (await db()).query("UPDATE content_modules SET module_number=?, category=?, title=?, accent=?, icon=?, description=? WHERE id=?", [safe(input.number), safe(input.category, "General"), safe(input.title), safe(input.accent, "#3568f5"), safe(input.icon), safe(input.description), moduleMatch[1]]); return json(res, 200, { ok: true }); }
  if (moduleMatch && req.method === "DELETE") { await (await db()).query("DELETE FROM content_lessons WHERE module_id=?", [moduleMatch[1]]); await (await db()).query("DELETE FROM content_modules WHERE id=?", [moduleMatch[1]]); return json(res, 200, { ok: true }); }
  if (reorderMatch && req.method === "PATCH") {
    const input = await body(req); const lessonIds = Array.isArray(input.lessonIds) ? input.lessonIds.map((id) => Number(id)).filter(Number.isInteger) : [];
    const connection = await (await db()).getConnection();
    try {
      await connection.beginTransaction();
      const [existing] = await connection.query("SELECT id FROM content_lessons WHERE module_id=? ORDER BY sort_order, id", [reorderMatch[1]]);
      const existingIds = existing.map((lesson) => Number(lesson.id));
      if (lessonIds.length !== existingIds.length || lessonIds.some((id) => !existingIds.includes(id))) {
        await connection.rollback(); connection.release(); return json(res, 400, { error: "The lesson order is incomplete or invalid" });
      }
      // Move every row into a temporary, collision-free range before assigning final positions.
      await connection.query("UPDATE content_lessons SET sort_order=sort_order+100000 WHERE module_id=?", [reorderMatch[1]]);
      for (let index = 0; index < lessonIds.length; index += 1) await connection.query("UPDATE content_lessons SET sort_order=? WHERE id=? AND module_id=?", [index, lessonIds[index], reorderMatch[1]]);
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
    return json(res, 200, { ok: true });
  }
  if (lessonMatch && req.method === "POST") { const input = await body(req); const [[max]] = await (await db()).query("SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM content_lessons WHERE module_id=?", [lessonMatch[1]]); await (await db()).query("INSERT INTO content_lessons (module_id, title, drive_id, sort_order) VALUES (?, ?, ?, ?)", [lessonMatch[1], safe(input.title), safe(input.driveId), Number(max.maxOrder) + 1]); return json(res, 201, { ok: true }); }
  if (lessonMatch && lessonMatch[2] && req.method === "PATCH") { const input = await body(req); await (await db()).query("UPDATE content_lessons SET title=?, drive_id=? WHERE id=? AND module_id=?", [safe(input.title), safe(input.driveId), lessonMatch[2], lessonMatch[1]]); return json(res, 200, { ok: true }); }
  if (lessonMatch && lessonMatch[2] && req.method === "DELETE") { await (await db()).query("DELETE FROM content_lessons WHERE id=? AND module_id=?", [lessonMatch[2], lessonMatch[1]]); return json(res, 200, { ok: true }); }
  return json(res, 404, { error: "Not found" });
}

async function start() {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      if (url.pathname.startsWith("/api/")) return await api(req, res, url.pathname);
      if (req.method !== "GET" && req.method !== "HEAD") return json(res, 405, { error: "Method not allowed" });
      if (url.pathname === "/manus-routes.json") { res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache" }); return res.end(fs.readFileSync(path.join(ROOT, "manus-routes.json"), "utf8")); }
      if (url.pathname === "/scalevo-mark.svg") { res.writeHead(200, { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" }); return res.end(fs.readFileSync(path.join(ROOT, "scalevo-mark.svg"), "utf8")); }
      return html(res, 200, fs.readFileSync(INDEX, "utf8"));
    } catch (error) {
      console.error(error);
      if (!res.headersSent) json(res, 500, { error: "Server error" }); else res.end();
    }
  });
  server.listen(PORT, "0.0.0.0", () => console.log(`DevOps workspace listening on ${PORT}`));
  ensureSchema().catch((error) => console.error("Database initialization pending:", error.message));
}

start().catch((error) => { console.error(error); process.exit(1); });
