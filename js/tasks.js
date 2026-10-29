/* Task Tracker — tasks are stored in Firestore (`tasks` collection), private to the
   admin account, and sync live across every device where you're signed in. */
import { app } from "./firebase.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

(function () {
  "use strict";

  const auth = getAuth(app);
  const db = getFirestore(app);
  const col = collection(db, "tasks");

  const KEY = "tt.tasks.v1";
  const STATUSES = ["Not started", "In progress", "On hold", "Completed"];
  const CATS = ["Work", "Personal", "Learning", "Health", "Finance", "Other"];
  const PRIS = ["High", "Medium", "Low"];
  const QUADS = [
    { id: "q1", label: "Do first", sub: "Urgent & important" },
    { id: "q2", label: "Schedule", sub: "Important, not urgent" },
    { id: "q3", label: "Delegate", sub: "Urgent, not important" },
    { id: "q4", label: "Eliminate", sub: "Neither" }
  ];

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const slug = (s) => s.toLowerCase().replace(/\s+/g, "-");
  const quadLabel = (id) => (QUADS.find((q) => q.id === id) || QUADS[1]).label;

  /* ── state ───────────────────────────────────────────── */
  let tasks = [];
  let syncError = "";
  let unsub = null;

  // Tasks saved in this browser by the earlier local-only version of this page
  const LEGACY_KEY = "tt.tasks.v1";
  function loadLegacy() {
    try {
      const a = JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]");
      return Array.isArray(a) ? a.filter((t) => t && t.title && t.date) : [];
    } catch (e) { return []; }
  }

  // Run a Firestore write; surface failures in the alert area
  async function run(fn) {
    try { await fn(); if (syncError) { syncError = ""; refresh(); } }
    catch (e) {
      console.error("Task save failed:", e);
      syncError = e && e.code === "permission-denied"
        ? "Permission denied — publish the updated Firestore rules (they must include the tasks collection)."
        : "Couldn't save that change: " + (e && e.message ? e.message : "unknown error");
      refresh();
    }
  }

  /* ── dates ───────────────────────────────────────────── */
  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function today() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function parse(s) {
    const p = (s || "").split("-");
    if (p.length !== 3) return null;
    const d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d) ? null : d;
  }
  function diffDays(s) {
    const d = parse(s);
    return d ? Math.round((d - today()) / 86400000) : null;
  }
  function fmt(s) {
    const d = parse(s);
    return d ? d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "";
  }
  const isOpen = (t) => t.st !== "Completed";
  const isOverdue = (t) => { const n = diffDays(t.date); return isOpen(t) && n !== null && n < 0; };
  function relText(t) {
    const n = diffDays(t.date);
    if (n === null || !isOpen(t)) return "";
    if (n < 0) return `${-n}d overdue`;
    if (n === 0) return "Due today";
    return n === 1 ? "Due tomorrow" : `in ${n}d`;
  }

  /* ── selects ─────────────────────────────────────────── */
  function fill(el, pairs, allLabel) {
    el.innerHTML = (allLabel ? `<option value="">${esc(allLabel)}</option>` : "") +
      pairs.map((p) => `<option value="${esc(p[0])}">${esc(p[1])}</option>`).join("");
  }
  const same = (a) => a.map((x) => [x, x]);
  fill($("fs"), same(STATUSES), "All statuses");
  fill($("fc"), same(CATS), "All categories");
  fill($("fp"), same(PRIS), "All priorities");
  fill($("fq"), QUADS.map((q) => [q.id, q.label]), "All matrix");
  fill($("f-cat"), same(CATS));
  fill($("f-pri"), same(PRIS));
  fill($("f-q"), QUADS.map((q) => [q.id, `${q.label} — ${q.sub}`]));
  fill($("f-st"), same(STATUSES));

  /* ── tasks view ──────────────────────────────────────── */
  function cmp(a, b) {
    if (isOpen(a) !== isOpen(b)) return isOpen(a) ? -1 : 1;
    return (a.date || "").localeCompare(b.date || "") || a.title.localeCompare(b.title);
  }
  function filtered() {
    const q = $("q").value.trim().toLowerCase();
    const fs = $("fs").value, fc = $("fc").value, fp = $("fp").value, fq = $("fq").value;
    return tasks.filter((t) =>
      (!q || t.title.toLowerCase().includes(q)) &&
      (!fs || t.st === fs) && (!fc || t.cat === fc) &&
      (!fp || t.pri === fp) && (!fq || t.q === fq)
    ).sort(cmp);
  }

  function renderAlert() {
    const od = tasks.filter(isOverdue).length;
    const dt = tasks.filter((t) => isOpen(t) && diffDays(t.date) === 0).length;
    const parts = [];
    if (od) parts.push(`<strong>${od}</strong> overdue`);
    if (dt) parts.push(`<strong>${dt}</strong> due today`);
    let html = "";
    if (syncError) html += `<div class="tt-alert err">${esc(syncError)}</div>`;
    const legacy = loadLegacy();
    if (legacy.length) html += `<div class="tt-alert warn">Found <strong>${legacy.length}</strong> task${legacy.length > 1 ? "s" : ""} saved in this browser from before. <button type="button" class="tt-btn ghost" data-a="import">Import to my account</button></div>`;
    if (parts.length) html += `<div class="tt-alert warn">${parts.join(" · ")}</div>`;
    $("alert").innerHTML = html;
  }

  function renderTasks() {
    renderAlert();
    const list = filtered();
    $("rows").innerHTML = list.map((t) => {
      const rel = relText(t);
      return `<tr class="${t.st === "Completed" ? "done" : ""}">
        <td class="tt-ti">${esc(t.title)}</td>
        <td class="${isOverdue(t) ? "od" : ""}">${esc(fmt(t.date))}${rel ? `<small>${esc(rel)}</small>` : ""}</td>
        <td>${esc(t.cat)}</td>
        <td><span class="tt-b p-${slug(t.pri)}">${esc(t.pri)}</span></td>
        <td>${esc(quadLabel(t.q))}</td>
        <td><span class="tt-b s-${slug(t.st)}">${esc(t.st)}</span></td>
        <td class="tt-ac">
          <button type="button" data-a="done" data-id="${esc(t.id)}" title="${t.st === "Completed" ? "Reopen" : "Mark complete"}">${t.st === "Completed" ? "Reopen" : "Done"}</button>
          <button type="button" data-a="edit" data-id="${esc(t.id)}">Edit</button>
          <button type="button" data-a="del" data-id="${esc(t.id)}">Delete</button>
        </td></tr>`;
    }).join("");
    $("empty").style.display = list.length ? "none" : "";
  }

  $("rows").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-a]");
    if (!b) return;
    const t = tasks.find((x) => x.id === b.dataset.id);
    if (!t) return;
    if (b.dataset.a === "edit") openForm(t);
    if (b.dataset.a === "done") {
      run(() => updateDoc(doc(db, "tasks", t.id), { st: t.st === "Completed" ? "In progress" : "Completed" }));
    }
    if (b.dataset.a === "del" && confirm(`Delete "${t.title}"?`)) {
      run(() => deleteDoc(doc(db, "tasks", t.id)));
    }
  });
  ["q", "fs", "fc", "fp", "fq"].forEach((id) => {
    $(id).addEventListener(id === "q" ? "input" : "change", renderTasks);
  });

  /* ── add / edit modal ────────────────────────────────── */
  let editingId = null;
  function openForm(t) {
    editingId = t ? t.id : null;
    $("mt").textContent = t ? "Edit task" : "Add task";
    $("f-title").value = t ? t.title : "";
    $("f-date").value = t ? t.date : toISO(today());
    $("f-cat").value = t ? t.cat : CATS[0];
    $("f-pri").value = t ? t.pri : "Medium";
    $("f-q").value = t ? t.q : "q2";
    $("f-st").value = t ? t.st : "Not started";
    $("ov").classList.add("show");
    $("f-title").focus();
  }
  function closeForm() { $("ov").classList.remove("show"); editingId = null; }

  $("add").addEventListener("click", () => openForm(null));
  $("cancel").addEventListener("click", closeForm);
  $("ov").addEventListener("click", (e) => { if (e.target === $("ov")) closeForm(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeForm(); });

  $("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = $("f-title").value.trim();
    if (!title || !$("f-date").value) return;
    const data = {
      title, date: $("f-date").value, cat: $("f-cat").value,
      pri: $("f-pri").value, q: $("f-q").value, st: $("f-st").value
    };
    const id = editingId;
    closeForm();
    if (id) run(() => updateDoc(doc(db, "tasks", id), data));
    else run(() => addDoc(col, Object.assign({ createdAt: Date.now() }, data)));
  });

  /* ── dashboard ───────────────────────────────────────── */
  const charts = {};
  function drawChart(id, type, labels, values, colors) {
    const cv = $(id);
    if (!cv) return;
    if (typeof Chart === "undefined") {
      cv.parentNode.innerHTML = `<p class="tt-empty">Charts couldn't load (Chart.js is blocked or offline).</p>`;
      return;
    }
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(cv, {
      type,
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, borderRadius: type === "bar" ? 4 : 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: type !== "bar", position: "bottom" } },
        scales: type === "bar" ? { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } : {}
      }
    });
  }
  const count = (key, val) => tasks.filter((t) => t[key] === val).length;

  function renderDashboard() {
    const total = tasks.length, done = count("st", "Completed");
    const od = tasks.filter(isOverdue).length;
    const week = tasks.filter((t) => { const n = diffDays(t.date); return isOpen(t) && n !== null && n >= 0 && n <= 7; }).length;
    const cards = [
      ["Total tasks", total, ""],
      ["Completed", done, total ? Math.round((done / total) * 100) + "% of all" : ""],
      ["In progress", count("st", "In progress"), ""],
      ["Due in 7 days", week, ""],
      ["Overdue", od, od ? "needs attention" : "all clear"]
    ];
    $("cards").innerHTML = cards.map((c) =>
      `<div class="tt-stat${c[0] === "Overdue" && od ? " bad" : ""}"><span>${c[0]}</span><strong>${c[1]}</strong><small>${c[2]}</small></div>`).join("");

    drawChart("c1", "bar", CATS, CATS.map((c) => count("cat", c)), ["#0F1B33", "#B6863A", "#2E7A6B", "#9297A3", "#4FA492", "#DCB067"]);
    drawChart("c2", "doughnut", STATUSES, STATUSES.map((s) => count("st", s)), ["#9aa3b8", "#4a74c9", "#c9a04a", "#2E7A6B"]);
    drawChart("c3", "bar", PRIS, PRIS.map((p) => count("pri", p)), ["#b3261e", "#DCB067", "#4FA492"]);

    $("mx").innerHTML = QUADS.map((q) => {
      const open = tasks.filter((t) => t.q === q.id && isOpen(t));
      return `<div class="tt-q ${q.id}">
        <div class="tt-qh"><strong>${q.label}</strong><span>${open.length}</span></div>
        <small>${q.sub}</small>
        <ul>${open.slice(0, 4).map((t) => `<li>${esc(t.title)}</li>`).join("")}${open.length > 4 ? `<li class="more">+${open.length - 4} more</li>` : ""}</ul>
      </div>`;
    }).join("");

    const overdue = tasks.filter(isOverdue).sort(cmp);
    $("ovrows").innerHTML = overdue.map((t) => `<tr>
      <td class="tt-ti">${esc(t.title)}</td>
      <td class="od">${esc(fmt(t.date))}<small>${esc(relText(t))}</small></td>
      <td>${esc(t.cat)}</td>
      <td><span class="tt-b p-${slug(t.pri)}">${esc(t.pri)}</span></td>
      <td><span class="tt-b s-${slug(t.st)}">${esc(t.st)}</span></td></tr>`).join("");
    $("ovempty").style.display = overdue.length ? "none" : "";
  }

  /* ── routing between the two tabs ────────────────────── */
  function route() {
    const dash = location.hash === "#dashboard";
    $("tt-v-tasks").style.display = dash ? "none" : "";
    $("tt-v-dashboard").style.display = dash ? "" : "none";
    $("tt-n-tasks").classList.toggle("on", !dash);
    $("tt-n-dashboard").classList.toggle("on", dash);
    if (dash) renderDashboard(); else renderTasks();
  }
  const refresh = route;
  window.addEventListener("hashchange", route);

  $("alert").addEventListener("click", (e) => {
    if (!e.target.closest('[data-a="import"]')) return;
    const legacy = loadLegacy();
    run(async () => {
      await Promise.all(legacy.map((t) => addDoc(col, {
        title: String(t.title), date: t.date, cat: CATS.includes(t.cat) ? t.cat : "Other",
        pri: PRIS.includes(t.pri) ? t.pri : "Medium", q: QUADS.some((q) => q.id === t.q) ? t.q : "q2",
        st: STATUSES.includes(t.st) ? t.st : "Not started", createdAt: Date.now()
      })));
      localStorage.removeItem(LEGACY_KEY);
      refresh();
    });
  });

  /* ── access gate: tasks are private to the admin account ── */
  const wrap = document.querySelector(".tt-wrap");
  const gate = document.createElement("div");
  gate.className = "tt-card tt-gate";
  wrap.insertBefore(gate, wrap.querySelector(".tt-tabs"));

  function lock(html) { wrap.classList.add("tt-locked"); gate.innerHTML = html; gate.style.display = ""; }
  function unlock() { wrap.classList.remove("tt-locked"); gate.style.display = "none"; }

  onAuthStateChanged(auth, async (user) => {
    if (unsub) { unsub(); unsub = null; }
    tasks = [];
    if (!user) {
      lock(`<h3>Private task tracker</h3><p>Sign in with your admin account to see and manage your tasks. They sync across all your devices.</p><a class="tt-btn" href="admin-login.html">Admin login</a>`);
      return;
    }
    lock(`<p>Checking your account…</p>`);
    let admin = false;
    try { const s = await getDoc(doc(db, "users", user.uid)); admin = s.exists() && s.data().role === "admin"; }
    catch (e) { /* treated as not admin */ }
    if (!admin) {
      lock(`<h3>No access</h3><p>This tracker is only available to the site owner's admin account.</p>`);
      return;
    }
    unlock();
    route();
    unsub = onSnapshot(col, (snap) => {
      tasks = snap.docs.map((d) => Object.assign({ id: d.id }, d.data())).filter((t) => t.title);
      syncError = "";
      refresh();
    }, (err) => {
      console.error("Task sync failed:", err);
      syncError = err && err.code === "permission-denied"
        ? "Permission denied — publish the updated Firestore rules (they must include the tasks collection)."
        : "Couldn't load your tasks: " + (err && err.message ? err.message : "unknown error");
      refresh();
    });
  });
})();
