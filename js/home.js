import { app } from "./firebase.js";
import { getFirestore, doc, getDoc, collection, getDocs, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);

/* ── Fallback defaults (used if Firestore has no data yet) ─── */
const DEFAULT_ABOUT = {
  name: "Md. Rashedul Haque",
  location: "Savar, Dhaka-1340",
  degree: "MBA-HRM, BS-EEE",
  experienceYears: "9",
  phone: "On request",
  email: "rhaque.eee@gmail.com",
  availability: "Open to opportunities",
  typedRoles: "HR Business Partner, People Strategy Leader, HR Analytics Specialist, Payroll & Compliance Expert",
  socialLinkedin: "https://www.linkedin.com/in/rashedulhaque",
  bio: "I am a passionate Human Resources professional with a strong background in HR operations, data analytics, and strategic business partnering. Currently serving as a Strategic Partner at Youngone Hi-Tech (Dhaka EPZ), I focus on aligning people strategies with organizational goals, driving employee engagement, and supporting leadership in building a high-performing culture."
};

const DEFAULT_SKILLS = [
  { name: "HR Business Partnering", percentage: 95 },
  { name: "Employee Relations & Engagement", percentage: 92 },
  { name: "HR Analytics & Reporting", percentage: 90 },
  { name: "Payroll Management", percentage: 90 },
  { name: "HRMS Automation", percentage: 85 },
  { name: "Power BI Dashboards", percentage: 88 }
];

const DEFAULT_EXPERIENCE = [
  { role: "Deputy Manager, Human Resource", company: "Youngone Corporation", years: "October 2016 – Present",
    subroles: [
      { title: "HR Business Partner" }, { title: "Data Analyst" }, { title: "Payroll Manager" },
      { title: "L&D Specialist" }, { title: "HR Policy & Process Analyst" },
      { title: "Risk & Compliance Coordinator" }, { title: "Team Lead" }
    ] }
];

/* ── About Me ────────────────────────────────────────────── */
(async () => {
  let about = DEFAULT_ABOUT;
  try {
    const snap = await getDoc(doc(db, "site_content", "home"));
    if (snap.exists() && Object.keys(snap.data()).length) about = { ...DEFAULT_ABOUT, ...snap.data() };
  } catch (err) { /* keep defaults */ }

  const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
  set("sbName", about.name);
  set("aboutBio", about.bio);
  set("infoName", about.name);
  set("infoLocation", about.location);
  set("infoDegree", about.degree);
  set("infoExperience", about.experienceYears ? `${about.experienceYears}+ Years` : null);
  set("infoPhone", about.phone);
  set("infoEmail", about.email);
  set("infoAvailability", about.availability);
  set("statExperience", about.experienceYears);
  if (about.photoURL) {
    const photoEl = document.getElementById("sbPhoto");
    if (photoEl) photoEl.src = about.photoURL;
  }
  if (about.typedRoles && typeof window.initTyped === "function") {
    const roles = about.typedRoles.split(",").map(s => s.trim()).filter(Boolean);
    if (roles.length) window.initTyped(roles);
  }

  const socialMap = {
    socialTwitter: about.socialTwitter,
    socialFacebook: about.socialFacebook,
    socialLinkedin: about.socialLinkedin,
    socialInstagram: about.socialInstagram,
    socialGithub: about.socialGithub
  };
  Object.entries(socialMap).forEach(([id, url]) => {
    const linkEl = document.getElementById(id);
    if (linkEl && url) {
      linkEl.href = url;
      linkEl.classList.remove("d-none");
    }
  });
})();

/* ── Skills ──────────────────────────────────────────────── */
(async () => {
  const container = document.getElementById("skillsContainer");
  if (!container) return;
  let skills = DEFAULT_SKILLS;
  try {
    const snap = await getDocs(collection(db, "skills"));
    if (!snap.empty) skills = snap.docs.map(d => d.data());
  } catch (err) { /* keep defaults */ }

  const half = Math.ceil(skills.length / 2);
  const cols = [skills.slice(0, half), skills.slice(half)];
  container.innerHTML = cols.map(col => `
    <div class="col-sm-6">
      ${col.map(s => `
        <div class="skill mb-4">
          <div class="d-flex justify-content-between">
            <p class="mb-2">${s.name || ""}</p>
            <p class="mb-2">${s.percentage || 0}%</p>
          </div>
          <div class="progress">
            <div class="progress-bar bg-primary" role="progressbar" style="width:${s.percentage || 0}%" aria-valuenow="${s.percentage || 0}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        </div>
      `).join("")}
    </div>
  `).join("");
})();

/* ── Experience (short summary version for Home) ────────── */
(async () => {
  const container = document.getElementById("experienceContainer");
  if (!container) return;
  let experience = DEFAULT_EXPERIENCE;
  try {
    const snap = await getDocs(query(collection(db, "experience"), orderBy("order", "asc")));
    if (!snap.empty) experience = snap.docs.map(d => d.data());
  } catch (err) { /* keep defaults */ }

  container.innerHTML = experience.map(e => `
    <div class="position-relative mb-4">
      <span class="bi bi-arrow-right fs-4 text-light position-absolute" style="top: -5px; left: -50px;"></span>
      <h5 class="mb-1">${e.role || ""}</h5>
      <p class="mb-2">${e.company || ""} ${e.years ? `| <small>${e.years}</small>` : ""}</p>
      ${e.tagline ? `<p class="fst-italic mb-2" style="opacity:0.75;">${e.tagline}</p>` : ""}
      ${(e.subroles && e.subroles.length) ? `
        <ul class="mb-0 ps-3">
          ${e.subroles.map(sr => `<li class="mb-1">${sr.title || ""}</li>`).join("")}
        </ul>
      ` : (e.description ? `<p>${e.description}</p>` : "")}
    </div>
  `).join("");
})();

/* ── Services ────────────────────────────────────────────── */
const DEFAULT_SERVICES = [
  { icon: "fa-people-arrows", title: "HR Strategy Consulting", description: "Aligning people strategy with business goals — workforce planning, org design, and capability building." },
  { icon: "fa-money-check-alt", title: "Payroll & Compliance", description: "End-to-end payroll operations at scale, with 100% compliance across large, multi-site workforces." },
  { icon: "fa-network-wired", title: "HRMS Implementation", description: "Leading HRMS rollouts and automation projects that improve data accuracy and reporting speed." },
  { icon: "fa-chalkboard-teacher", title: "Learning & Development", description: "Designing training programs, from onboarding to leadership development and compliance training." }
];

(async () => {
  const container = document.getElementById("servicesContainer");
  if (!container) return;
  let services = DEFAULT_SERVICES;
  try {
    const snap = await getDocs(collection(db, "services"));
    if (!snap.empty) services = snap.docs.map(d => d.data());
  } catch (err) { /* keep defaults */ }

  container.innerHTML = services.map(s => `
    <div class="col-md-6">
      <div class="service-item">
        <i class="fa fa-2x ${s.icon || 'fa-briefcase'} mx-auto mb-4"></i>
        <h5 class="mb-2">${s.title || ""}</h5>
        <p class="mb-0">${s.description || ""}</p>
      </div>
    </div>
  `).join("");
})();

/* ── Portfolio (reuses the same "projects" collection as projects.html) ── */
(async () => {
  const container = document.getElementById("portfolioContainer");
  if (!container) return;
  try {
    const snap = await getDocs(collection(db, "projects"));
    if (snap.empty) {
      container.innerHTML = `<p style="color:rgba(242,242,242,0.6);">No projects added yet — add some from the admin panel.</p>`;
      return;
    }
    container.innerHTML = snap.docs.map(d => {
      const p = d.data();
      return `
        <div class="col-md-6 mb-4">
          <div class="position-relative overflow-hidden mb-2" style="background:var(--secondary);border-radius:6px;">
            ${p.image
              ? `<img class="img-fluid w-100" src="${p.image}" alt="${p.title || ''}" style="aspect-ratio:16/10;object-fit:cover;">`
              : `<div style="aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;"><i class="fa fa-2x fa-briefcase text-primary"></i></div>`}
            <div class="portfolio-btn d-flex align-items-center justify-content-center">
              ${p.link ? `<a href="${p.link}" target="_blank" rel="noopener"><i class="bi bi-plus text-light"></i></a>` : ""}
            </div>
          </div>
          <h6 class="mb-0">${p.title || ""}</h6>
        </div>
      `;
    }).join("");
  } catch (err) {
    console.error("Failed to load portfolio:", err);
  }
})();


