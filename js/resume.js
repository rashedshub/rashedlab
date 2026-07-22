import { app } from "./firebase.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);
const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };

/* ── Defaults, seeded from the uploaded CV (v4) ─────────────── */
const DEFAULT_HEADER = {
  name: "Md. Rashedul Haque",
  headline: "Human Resource Business Partner",
  location: "Savar, Dhaka",
  email: "mail.rashedulhaque@gmail.com",
  phone: "(+880) 1622 702 800",
  website: "https://bit.ly/rashedul_haque",
  birthday: "07 May 1989 (Age 37)",
  summary: "Results-driven HR professional with 9+ years of experience in HR operations, data analytics, and strategic business partnering. Currently working as an HR Business Partner at Youngone Hi-Tech, supporting leadership in aligning people strategies, strengthening employee engagement, and building a high-performance culture. Skilled in payroll management, L&D, talent acquisition, policy development, HR process automation, and performance management. Passionate about using data and technology to drive smarter HR decisions, including HRMS development and analytical dashboards.",
  skillsHR: "Payroll Management, Training & Development, HR Automation, Policy Development, Project Management, Compliance Management",
  skillsTechnical: "Word, Excel, PowerPoint, Power BI, HRMS Proficiency, SQL, Python",
  skillsLeadership: "Problem Solving, Decision Making, Time Management, Emotional Intelligence, Project Management, Eisenhower Matrix, Pareto Principle (80/20 Rule), SMART Goals, Active Listening, Stakeholder Mapping",
  interests: "Artificial Intelligence | OpenAI, ChatGPT, Deepseek\nDigital Transformation | New technologies and tech-driven HR solutions\nData Analytics | Data Analysis, Data Science\nLeadership & Innovation |",
  languages: "English · Bangla",
  volunteeringTitle: "Blood Donor",
  volunteeringDesc: "Regular voluntary blood donor, contributing to life-saving initiatives and community health programs.",
  references: "Available upon request."
};

const DEFAULT_EXPERIENCE = [{
  company: "Youngone Corporation | Factory: Youngone Hi-Tech Sportswear Industries Ltd. — DEPZ (Old), Savar, Dhaka",
  companyLink: "https://youngonecorporation.com/",
  role: "Deputy Manager Human Resource",
  years: "Oct 2016 – Present",
  tagline: "Leading company in sportswear manufacturing",
  roleCategory: "Diverse HR Responsibilities",
  order: 1,
  subroles: [
    { title: "HR Business Partner", bullets: [
      "Supported change management initiatives, enhancing HR process efficiency and service quality.",
      "Led performance management cycles, OKRs implementation, and manager coaching, improving goal alignment and accountability.",
      "Implemented functional competency frameworks and talent management initiatives, strengthening skills development and succession planning."
    ]},
    { title: "Data Analyst", bullets: [
      "Led 10+ HR analytics projects using Power BI and Excel to deliver actionable dashboards for senior leadership.",
      "Automated data processes using Power Query, improving reporting accuracy and reducing reporting time by two-thirds compared to manual methods."
    ]},
    { title: "Payroll Manager", bullets: [
      "Managed end-to-end payroll for 8,000+ staff, ensuring accurate disbursement, increments, and HRMS reconciliation.",
      "Streamlined payroll workflows, reducing manual errors by 25% and improving audit readiness."
    ]},
    { title: "L&D Specialist", bullets: [
      "Designed and conducted 30+ skill-based and compliance trainings, achieving 90% satisfaction and measurable safety gains.",
      "Handled logistics and evaluation for all mandatory programs on H&S, workers' rights, and labor law compliance."
    ]},
    { title: "HR Policy & Process Analyst", bullets: [
      "Developed 15+ HR policies and SOPs.",
      "Created visual tools for policy awareness, leading to a 30% increase in employee acknowledgment rates."
    ]},
    { title: "Risk & Compliance Coordinator", bullets: [
      "Delivered timely and accurate HR data for K-SOX, internal, and third-party audits across HR functions."
    ]},
    { title: "Team Lead", bullets: [
      "Supervised HR team, driving performance reviews, coaching, and boost in team productivity.",
      "Fostered a culture of accountability and continuous improvement across daily HR operations."
    ]}
  ]
}];

const DEFAULT_ACHIEVEMENTS = [
  { title: "Leadership in Payroll Management", description: "Successfully managed payroll operations for over 8,000 employees while ensuring compliance and operational efficiency." },
  { title: "HRMS Development & Implementation", description: "Successfully collaborated with the software team to develop and launch a comprehensive HR Management System (HRMS) featuring full HR modules and automated reporting capabilities." },
  { title: "HR Analytics & Reporting", description: "Improved HR reporting accuracy by 50% and led 10+ analytics projects by developing automated dashboards using Power BI, Excel, and Power Query." }
];

const DEFAULT_PROJECTS = [{
  title: "HR Automation",
  years: "March 2018 – January 2020",
  order: 1,
  bullets: [
    "Spearheaded HRMS implementation project, overseeing planning, testing, and replacing existing systems.",
    "Reduced manual HR processes by 40% through automation, improving data accuracy and reducing processing time.",
    "Collaborated with IT and software development teams to customize HRMS modules for payroll, attendance, and performance tracking."
  ]
}];

const DEFAULT_EDUCATION = [
  { degree: "Master of Business Administration (MBA), Human Resource Management", school: "Jahangirnagar University", years: "2015 – 2017", order: 1 },
  { degree: "Bachelor of Science (BSc), Electrical & Electronic Engineering", school: "University of Asia Pacific", years: "2009 – 2013", order: 2 }
];

const DEFAULT_TRAINING = [
  { title: "Corporate Training on Basic to IELTS", provider: "S@ifurs — English Speaking Development Program", years: "Nov 2023 – Mar 2024", link: "https://bit.ly/view-cert-saifurs", order: 1 },
  { title: "Training of Trainers (ToT)", provider: "Compliance Training (BD) Ltd. — Certificate Course", years: "24 Feb 2023", link: "https://bit.ly/view-cert-tot", order: 2 }
];

const DEFAULT_CERTS = [
  { title: "Youngone Leadership Development Program (YLDP)", org: "Youngone Corporation", date: "July 2025",
    description: "Successfully completed an intensive program focused on developing core leadership competencies and management tools. Gained practical skills in decision-making (Fishbone Method), time management (Eisenhower Matrix), and project execution (RACI Matrix, Stakeholder Mapping). Strengthened emotional intelligence, conflict resolution, and team leadership using Situational Leadership and active listening techniques.", order: 1 }
];

/* ── Header / Summary / Skills / Interests / Languages / Volunteering / References ── */
(async () => {
  let d = DEFAULT_HEADER;
  try {
    const snap = await getDoc(doc(db, "site_content", "resume"));
    if (snap.exists() && Object.keys(snap.data()).length) d = { ...DEFAULT_HEADER, ...snap.data() };
  } catch (err) { /* keep defaults */ }

  // Profile photo — pulled from the same Firestore field the admin's
  // About Me photo uploader writes to (site_content/home.photoURL)
  try {
    const homeSnap = await getDoc(doc(db, "site_content", "home"));
    if (homeSnap.exists() && homeSnap.data().photoURL) {
      document.getElementById("rPhoto").src = homeSnap.data().photoURL;
    }
  } catch (err) { /* keep default image */ }

  set("rName", d.name);
  set("rHeadline", d.headline);
  set("rSummary", d.summary);
  set("rLanguages", d.languages);
  set("rReferences", d.references);

  const icons = {
    location: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1c-2.8 0-5 2.2-5 5 0 3.75 5 9 5 9s5-5.25 5-9c0-2.8-2.2-5-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" fill="currentColor"/></svg>`,
    email: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 4l6.5 5 6.5-5" stroke="currentColor" stroke-width="1.3"/></svg>`,
    phone: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 2h2.5l1 3.5-1.5 1.2a9 9 0 0 0 4.3 4.3l1.2-1.5 3.5 1V14a1 1 0 0 1-1 1C7 15 1 9 1 3a1 1 0 0 1 1-1Z" fill="currentColor"/></svg>`,
    website: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 8h13M8 1.5c1.8 1.8 2.7 4 2.7 6.5S9.8 12.7 8 14.5C6.2 12.7 5.3 10.5 5.3 8S6.2 3.3 8 1.5Z" stroke="currentColor" stroke-width="1.3"/></svg>`,
    calendar: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 6h13M5 1v3M11 1v3" stroke="currentColor" stroke-width="1.3"/></svg>`
  };

  const contactEl = document.getElementById("cvContactList");
  if (contactEl) {
    const rows = [
      d.location ? { icon: icons.location, html: d.location } : null,
      d.email ? { icon: icons.email, html: `<a href="mailto:${d.email}">${d.email}</a>` } : null,
      d.phone ? { icon: icons.phone, html: d.phone } : null,
      d.website ? { icon: icons.website, html: `<a href="${d.website}" target="_blank" rel="noopener">${d.website.replace(/^https?:\/\//, "")}</a>` } : null,
      d.birthday ? { icon: icons.calendar, html: d.birthday } : null
    ].filter(Boolean);
    contactEl.innerHTML = rows.map(r => `<li>${r.icon}<span>${r.html}</span></li>`).join("");
  }

  const groupsEl = document.getElementById("resumeSkillGroups");
  if (groupsEl) {
    const groups = [
      { title: "HR & Business", raw: d.skillsHR },
      { title: "Technical", raw: d.skillsTechnical },
      { title: "Leadership", raw: d.skillsLeadership }
    ].filter(g => g.raw);
    groupsEl.innerHTML = groups.map(g => `
      <div class="cv-skill-group">
        <div class="cv-skill-group-title">${g.title}</div>
        <div class="cv-skill-tags">
          ${g.raw.split(",").map(s => s.trim()).filter(Boolean).map(s => `<span>${s}</span>`).join("")}
        </div>
      </div>
    `).join("");
  }

  const interestsEl = document.getElementById("resumeInterests");
  if (interestsEl && d.interests) {
    const lines = d.interests.split("\n").map(l => l.trim()).filter(Boolean);
    interestsEl.innerHTML = lines.map(line => {
      const [title, sub] = line.split("|").map(s => (s || "").trim());
      return `<div class="cv-interest-line">
        <span class="ti">${title}</span>
        ${sub ? `<span class="ts">${sub}</span>` : ""}
      </div>`;
    }).join("");
  }

  const volEl = document.getElementById("resumeVolunteering");
  if (volEl && d.volunteeringTitle) {
    volEl.innerHTML = `<div class="entry">
      <div class="role">${d.volunteeringTitle}</div>
      <p>${d.volunteeringDesc || ""}</p>
    </div>`;
  }
})();

/* ── Experience (with nested sub-roles) ─────────────────────── */
(async () => {
  const container = document.getElementById("resumeExperience");
  if (!container) return;
  let experience = DEFAULT_EXPERIENCE;
  try {
    const snap = await getDocs(query(collection(db, "experience"), orderBy("order", "asc")));
    if (!snap.empty) experience = snap.docs.map(d => d.data());
  } catch (err) { /* keep defaults */ }

  container.innerHTML = experience.map(e => `
    <div class="exp-block">
      <div class="exp-company">${e.companyLink ? `<a href="${e.companyLink}" target="_blank" rel="noopener">${e.company || ""}</a>` : (e.company || "")}</div>
      <div class="exp-role">${e.role || ""}</div>
      <div class="exp-years">${e.years || ""}</div>
      ${e.tagline ? `<p class="exp-tagline">${e.tagline}</p>` : ""}
      ${e.roleCategory ? `<div class="exp-role-category">${e.roleCategory}</div>` : ""}
      ${(e.subroles || []).map(sr => `
        <div class="subrole open">
          <div class="subrole-title">
            <span>${sr.title || ""}</span>
            <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="subrole-body">
            <ul>${(sr.bullets || []).map(b => `<li>${b}</li>`).join("")}</ul>
          </div>
        </div>
      `).join("")}
    </div>
  `).join("");

  container.querySelectorAll(".subrole-title").forEach(title => {
    title.addEventListener("click", () => {
      title.closest(".subrole").classList.toggle("open");
    });
  });
})();

/* ── Key Achievements ────────────────────────────────────────── */
(async () => {
  const container = document.getElementById("resumeAchievements");
  if (!container) return;
  let items = DEFAULT_ACHIEVEMENTS;
  try {
    const snap = await getDocs(query(collection(db, "achievements"), orderBy("order", "asc")));
    if (!snap.empty) items = snap.docs.map(d => d.data());
  } catch (err) { /* keep defaults */ }

  container.innerHTML = items.map(a => `
    <div class="achv-card">
      <div class="achv-title">${a.title || ""}</div>
      <div class="achv-desc">${a.description || ""}</div>
    </div>
  `).join("");
})();

/* ── Projects (CV projects, separate from Portfolio "projects" collection) ── */
(async () => {
  const container = document.getElementById("resumeProjects");
  if (!container) return;
  let items = DEFAULT_PROJECTS;
  try {
    const snap = await getDocs(query(collection(db, "resume_projects"), orderBy("order", "asc")));
    if (!snap.empty) items = snap.docs.map(d => d.data());
  } catch (err) { /* keep defaults */ }

  container.innerHTML = items.map(p => `
    <div class="entry">
      <div class="role">${p.title || ""}</div>
      <div class="meta">${p.years || ""}</div>
      <ul>${(p.bullets || []).map(b => `<li>${b}</li>`).join("")}</ul>
    </div>
  `).join("");
})();

/* ── Education ───────────────────────────────────────────────── */
(async () => {
  const container = document.getElementById("resumeEducation");
  if (!container) return;
  let items = DEFAULT_EDUCATION;
  try {
    const snap = await getDocs(query(collection(db, "education"), orderBy("order", "asc")));
    if (!snap.empty) items = snap.docs.map(d => d.data());
  } catch (err) { /* keep defaults */ }

  container.innerHTML = items.map(e => `
    <div class="entry">
      <div class="role">${e.degree || ""}${e.school ? ` — ${e.school}` : ""}</div>
      <div class="meta">${e.years || ""}</div>
    </div>
  `).join("");
})();

/* ── Training / Short Courses ────────────────────────────────── */
(async () => {
  const container = document.getElementById("resumeTraining");
  if (!container) return;
  let items = DEFAULT_TRAINING;
  try {
    const snap = await getDocs(query(collection(db, "training"), orderBy("order", "asc")));
    if (!snap.empty) items = snap.docs.map(d => d.data());
  } catch (err) { /* keep defaults */ }

  container.innerHTML = items.map(t => `
    <div class="entry">
      <div class="role">${t.title || ""}${t.provider ? ` — ${t.provider}` : ""}</div>
      <div class="meta">${t.years || ""}</div>
      ${t.link ? `<p><a href="${t.link}" target="_blank" rel="noopener">View Certificate →</a></p>` : ""}
    </div>
  `).join("");
})();

/* ── Certifications ──────────────────────────────────────────── */
(async () => {
  const container = document.getElementById("resumeCerts");
  if (!container) return;
  let items = DEFAULT_CERTS;
  try {
    const snap = await getDocs(query(collection(db, "certifications"), orderBy("order", "asc")));
    if (!snap.empty) items = snap.docs.map(d => d.data());
  } catch (err) { /* keep defaults */ }

  container.innerHTML = items.map(c => `
    <div class="entry">
      <div class="role">${c.title || ""}${c.org ? ` — ${c.org}` : ""}</div>
      <div class="meta">${c.date || ""}</div>
      ${c.description ? `<p>${c.description}</p>` : ""}
    </div>
  `).join("");
})();
