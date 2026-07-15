import { app } from "./firebase.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);

const DEFAULT_EXPERIENCE = [
  { role: "Strategic Business Partner", company: "Youngone Corporation", years: "September 2025 – Present (Savar)",
    description: "HR Business Partner for Youngone Hi-Tech Sportswear Industries Ltd. (DEPZ) — driving employee engagement, organizational development, and strategic HR alignment with business goals.",
    bullets: ["Partner with business leaders to align HR strategy with operational needs.", "Lead workforce planning, promotion, and performance management.", "Drive cultural transformation and employee engagement initiatives.", "Advise leadership on people strategy, succession planning, and capability building."] },
  { role: "Deputy Manager, Human Resources", company: "Youngone Corporation", years: "June 2024 – Present · Dhaka, Bangladesh",
    description: "Led HR analytics, payroll, and digital transformation projects to support efficient HR operations and data-driven decisions.",
    bullets: ["Designed and maintained Power BI dashboards for HR KPIs and management insights.", "Managed payroll operations for 8,000+ employees with 100% compliance.", "Collaborated with IT to enhance HRMS automation and data accuracy.", "Introduced HR reporting standards and improved HR data visibility."] },
  { role: "Assistant Manager, Human Resources", company: "Youngone Corporation", years: "March 2021 – June 2024 · Dhaka, Bangladesh",
    description: "Focused on operational excellence through process optimization, analytics, and HR technology integration.",
    bullets: ["Delivered real-time HR dashboards and turnover reports for decision-making.", "Co-led HRMS rollout across departments.", "Oversaw payroll, appraisal, and increment cycles for 6,000+ employees."] },
  { role: "Senior Human Resources Officer", company: "Youngone Corporation", years: "November 2019 – March 2021 · Dhaka, Bangladesh",
    description: "", bullets: ["Supported HRMS deployment and inter-department collaboration.", "Managed payroll, reconciliations, and performance evaluation processes.", "Coordinated training & development programs and policy preparation."] },
  { role: "Human Resources Officer", company: "Youngone Corporation", years: "November 2018 – October 2019 · Dhaka, Bangladesh",
    description: "", bullets: ["Designed and delivered training programs (Skill Development, H&S, Labor Issues).", "Oversaw recruitment & selection aligned with company policy.", "Processed maternity benefits and managed compliance reporting."] },
  { role: "Assistant Human Resources Officer", company: "Youngone Corporation", years: "October 2016 – November 2018 · Dhaka, Bangladesh",
    description: "", bullets: ["Conducted training needs analysis and coordinated employee development initiatives.", "Supported Health & Safety and compliance training programs.", "Maintained records aligned with audit and legal requirements."] }
];

(async () => {
  const container = document.getElementById("resumeExperience");
  if (!container) return;
  let experience = DEFAULT_EXPERIENCE;
  try {
    const snap = await getDocs(query(collection(db, "experience"), orderBy("order", "asc")));
    if (!snap.empty) experience = snap.docs.map(d => d.data());
  } catch (err) { /* keep defaults */ }

  container.innerHTML = experience.map(e => `
    <div class="entry">
      <div class="role">${e.role || ""}${e.company ? ` — ${e.company}` : ""}</div>
      <div class="meta">${e.years || ""}</div>
      ${e.description ? `<p>${e.description}</p>` : ""}
      ${(e.bullets && e.bullets.length) ? `<ul>${e.bullets.map(b => `<li>${b}</li>`).join("")}</ul>` : ""}
    </div>
  `).join("");
})();
