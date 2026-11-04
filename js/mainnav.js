// Mobile toggle — works on every page
(function () {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
})();

// Active-tab highlighting
(function () {
  const tabs = document.querySelectorAll(".mainnav-links a[data-target]");
  if (!tabs.length) return;

  const path = window.location.pathname.split("/").pop() || "index.html";
  const onHome = path === "" || path === "index.html";

  if (onHome) {
    // Scrollspy: highlight the anchor tab whose section is in view
    const setActive = (id) => {
      tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.target === id));
    };
    const sections = Array.from(tabs)
      .filter(tab => tab.dataset.anchor === "true")
      .map(tab => document.getElementById(tab.dataset.target))
      .filter(Boolean);

    if (sections.length && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      }, { rootMargin: "-160px 0px -60% 0px", threshold: 0 });
      sections.forEach(sec => observer.observe(sec));
    }
  } else {
    // On a standalone page: highlight the tab matching this page
    tabs.forEach(tab => {
      if (tab.dataset.page === path) tab.classList.add("active");
    });
  }
})();

// Scroll-reveal for any ".reveal" element on any page
(function () {
  const revealEls = document.querySelectorAll(".reveal");
  if (!revealEls.length) return;

  if (!("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in-view"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => io.observe(el));
})();

// Pages sidebar — the single place the page links live. To add a page to the
// sidebar on every page of the site, add one line to PAGES below.
(function () {
  const inner = document.querySelector(".mainnav-inner");
  if (!inner || document.getElementById("pagesbar")) return;

  const svg = (d) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

  const PAGES = [
    { href: "projects.html", label: "Projects",
      icon: svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>') },
    { href: "resume.html", label: "Resume",
      icon: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>') },
    { href: "blog.html", label: "Blog",
      icon: svg('<path d="M4 5h13a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z"/><path d="M18 9h2a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2M8 9h6M8 13h6M8 17h4"/>') },
    { href: "gallery.html", label: "Gallery",
      icon: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-9 9"/>') },
    { href: "poems.html", label: "Poems",
      icon: svg('<path d="M20.2 4.8a5.5 5.5 0 0 0-7.8 0L5 12.2V19h6.8l7.4-7.4a5.5 5.5 0 0 0 0-7.8Z"/><path d="M16 8 3 21M17.5 15H9"/>') },
    { href: "tasks.html", label: "Tasks",
      icon: svg('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>') }
  ];
  // detail pages highlight their parent section
  const PARENT = { "project-detail.html": "projects.html", "blog-post.html": "blog.html" };

  const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const current = PARENT[file] || file;

  const bar = document.createElement("aside");
  bar.id = "pagesbar";
  bar.className = "pagesbar";
  bar.setAttribute("aria-label", "Site pages");
  bar.innerHTML = `
    <div class="pagesbar-head">
      <span class="pagesbar-title">Pages</span>
      <button type="button" class="pagesbar-close" aria-label="Hide sidebar">${svg('<path d="m15 6-6 6 6 6"/>')}</button>
    </div>
    <nav class="pagesbar-list">
      ${PAGES.map((p) =>
        `<a href="${p.href}"${p.href === current ? ' class="active" aria-current="page"' : ""}>${p.icon}<span>${p.label}</span></a>`
      ).join("")}
    </nav>
    <div class="pagesbar-foot">&copy; Md. Rashedul Haque</div>`;

  const backdrop = document.createElement("div");
  backdrop.className = "pagesbar-backdrop";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "pagesbar-toggle";
  toggle.setAttribute("aria-controls", "pagesbar");
  toggle.setAttribute("aria-label", "Show or hide the pages sidebar");
  toggle.title = "Pages";
  toggle.innerHTML = svg('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>');

  document.body.appendChild(bar);
  document.body.appendChild(backdrop);
  inner.classList.add("has-pagesbar");
  inner.insertBefore(toggle, inner.firstChild);

  // ≥1280px: pushes the page, open by default, remembers your choice.
  // Below that: slide-over drawer that always starts closed.
  const KEY = "rh.pagesbar";
  const root = document.documentElement;
  const wide = window.matchMedia("(min-width: 1280px)");
  let open = false;

  const saved = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const remember = (v) => { try { localStorage.setItem(KEY, v ? "open" : "closed"); } catch (e) { /* private mode */ } };

  function setOpen(v, persist) {
    open = v;
    root.classList.toggle("pb-open", v);
    root.classList.toggle("pb-closed", !v);
    toggle.setAttribute("aria-expanded", String(v));
    if (persist && wide.matches) remember(v);
  }
  const initial = () => (wide.matches ? saved() !== "closed" : false);

  setOpen(initial(), false);
  // enable transitions only after the first paint
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("pb-anim")));

  toggle.addEventListener("click", () => setOpen(!open, true));
  bar.querySelector(".pagesbar-close").addEventListener("click", () => { setOpen(false, true); toggle.focus(); });
  backdrop.addEventListener("click", () => setOpen(false, false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open && !wide.matches) { setOpen(false, false); toggle.focus(); }
  });
  const onBreakpoint = () => setOpen(initial(), false);
  if (wide.addEventListener) wide.addEventListener("change", onBreakpoint);
  else if (wide.addListener) wide.addListener(onBreakpoint);
})();
