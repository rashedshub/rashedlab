/* Task Tracker — client-side only. Tasks live in this browser's localStorage. */
(function () {
  "use strict";

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

  /* ── storage ─────────────────────────────────────────── */
  let storageOk = true;
  function load() {
    try {
      const a = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(a) ? a.filter((t) => t && t.title) : [];
    } catch (e) { storageOk = false; return []; }
  }
  let tasks = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(tasks)); storageOk = true; }
    catch (e) { storageOk = false; }
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
    if (!storageOk) html += `<div class="tt-alert err">This browser is blocking local storage, so tasks won't be saved after you leave the page.</div>`;
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
    if (b.dataset.a === "done") { t.st = t.st === "Completed" ? "In progress" : "Completed"; save(); renderTasks(); }
    if (b.dataset.a === "del" && confirm(`Delete "${t.title}"?`)) {
      tasks = tasks.filter((x) => x.id !== t.id); save(); renderTasks();
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
    if (editingId) {
      const t = tasks.find((x) => x.id === editingId);
      if (t) Object.assign(t, data);
    } else {
      tasks.push(Object.assign({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }, data));
    }
    save(); closeForm(); renderTasks();
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
  window.addEventListener("hashchange", route);
  route();
})();
