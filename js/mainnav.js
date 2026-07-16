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
