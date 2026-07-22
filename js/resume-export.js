/* ============================================================
   Resume export — builds a real, standalone A4-formatted CV
   from the live rendered page, then:
   - "Download PDF": renders it via html2canvas + jsPDF into a
     multi-page PDF with proper page margins.
   - "Download DOC": wraps the same content in Word-compatible
     markup and downloads it as an editable .doc file.
   Both read the DOM at click-time, so they always reflect
   whatever content is currently on the page (including
   Firestore-loaded data), regardless of script load order.
   ============================================================ */

function text(el) { return el ? el.textContent.trim() : ""; }
function html(el) { return el ? el.innerHTML : ""; }

function extractEntries(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  return Array.from(container.querySelectorAll(".entry")).map(entry => ({
    role: text(entry.querySelector(".role")),
    meta: text(entry.querySelector(".meta")),
    paragraphs: Array.from(entry.querySelectorAll("p")).map(p => text(p)),
    items: Array.from(entry.querySelectorAll("li")).map(li => text(li)),
    links: Array.from(entry.querySelectorAll("a")).map(a => ({ text: text(a), href: a.href }))
  }));
}

function extractExperience() {
  const container = document.getElementById("resumeExperience");
  if (!container) return [];
  return Array.from(container.querySelectorAll(".exp-block")).map(block => ({
    company: text(block.querySelector(".exp-company")),
    role: text(block.querySelector(".exp-role")),
    years: text(block.querySelector(".exp-years")),
    tagline: text(block.querySelector(".exp-tagline")),
    roleCategory: text(block.querySelector(".exp-role-category")),
    subroles: Array.from(block.querySelectorAll(".subrole")).map(sr => ({
      title: text(sr.querySelector(".subrole-title span")),
      bullets: Array.from(sr.querySelectorAll("li")).map(li => text(li))
    }))
  }));
}

function buildResumeData() {
  return {
    name: text(document.getElementById("rName")),
    headline: text(document.getElementById("rHeadline")),
    photoSrc: document.getElementById("rPhoto") ? document.getElementById("rPhoto").src : "",
    contact: Array.from(document.querySelectorAll("#cvContactList li")).map(li => text(li)),
    skillGroups: Array.from(document.querySelectorAll("#resumeSkillGroups .cv-skill-group")).map(g => ({
      title: text(g.querySelector(".cv-skill-group-title")),
      tags: Array.from(g.querySelectorAll(".cv-skill-tags span")).map(s => text(s))
    })),
    languages: text(document.getElementById("rLanguages")),
    interests: Array.from(document.querySelectorAll("#resumeInterests .cv-interest-line")).map(line => ({
      title: text(line.querySelector(".ti")),
      sub: text(line.querySelector(".ts"))
    })),
    summary: text(document.getElementById("rSummary")),
    experience: extractExperience(),
    achievements: Array.from(document.querySelectorAll("#resumeAchievements .achv-card")).map(c => ({
      title: text(c.querySelector(".achv-title")),
      description: text(c.querySelector(".achv-desc"))
    })),
    projects: extractEntries("resumeProjects"),
    education: extractEntries("resumeEducation"),
    training: extractEntries("resumeTraining"),
    certifications: extractEntries("resumeCerts"),
    volunteering: extractEntries("resumeVolunteering"),
    references: text(document.getElementById("rReferences"))
  };
}

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* Builds a clean, single-column, print-formatted HTML document
   (used both as the source rendered for the PDF screenshot, and
   as the body content embedded directly into the .doc export). */
function buildExportHTML(d) {
  const sectionsHTML = [];

  if (d.summary) {
    sectionsHTML.push(`<h2>Summary</h2><p>${esc(d.summary)}</p>`);
  }

  if (d.experience.length) {
    sectionsHTML.push(`<h2>Experience</h2>` + d.experience.map(e => `
      <div class="blk">
        <div class="role-line">${esc(e.company)}</div>
        <div class="sub-line">${esc(e.role)}</div>
        <div class="meta-line">${esc(e.years)}</div>
        ${e.tagline ? `<div class="italic-line">${esc(e.tagline)}</div>` : ""}
        ${e.roleCategory ? `<div class="cat-line">${esc(e.roleCategory)}</div>` : ""}
        ${e.subroles.map(sr => `
          <div class="subrole-blk">
            <div class="subrole-h">${esc(sr.title)}</div>
            <ul>${sr.bullets.map(b => `<li>${esc(b)}</li>`).join("")}</ul>
          </div>
        `).join("")}
      </div>
    `).join(""));
  }

  if (d.achievements.length) {
    sectionsHTML.push(`<h2>Key Achievements</h2>` + d.achievements.map(a => `
      <div class="blk"><div class="role-line">${esc(a.title)}</div><p>${esc(a.description)}</p></div>
    `).join(""));
  }

  function entriesBlock(title, entries) {
    if (!entries.length) return "";
    return `<h2>${title}</h2>` + entries.map(e => `
      <div class="blk">
        ${e.role ? `<div class="role-line">${esc(e.role)}</div>` : ""}
        ${e.meta ? `<div class="meta-line">${esc(e.meta)}</div>` : ""}
        ${e.paragraphs.map(p => `<p>${esc(p)}</p>`).join("")}
        ${e.items.length ? `<ul>${e.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}
        ${e.links.map(l => `<p><a href="${l.href}">${esc(l.text)}</a></p>`).join("")}
      </div>
    `).join("");
  }

  sectionsHTML.push(entriesBlock("Projects", d.projects));
  sectionsHTML.push(entriesBlock("Education", d.education));
  sectionsHTML.push(entriesBlock("Training / Short Courses", d.training));
  sectionsHTML.push(entriesBlock("Certifications", d.certifications));
  sectionsHTML.push(entriesBlock("Volunteering", d.volunteering));

  if (d.references) sectionsHTML.push(`<h2>References</h2><p>${esc(d.references)}</p>`);

  const sidebarHTML = `
    <div class="side">
      ${d.photoSrc ? `<img class="photo" src="${d.photoSrc}" crossorigin="anonymous"/>` : ""}
      <div class="name">${esc(d.name)}</div>
      <div class="headline">${esc(d.headline)}</div>

      <div class="side-block">
        <div class="side-h">Contact</div>
        ${d.contact.map(c => `<div class="side-line">${esc(c)}</div>`).join("")}
      </div>

      ${d.skillGroups.length ? `
        <div class="side-block">
          <div class="side-h">Skills</div>
          ${d.skillGroups.map(g => `
            <div class="skill-g"><div class="skill-g-t">${esc(g.title)}</div>
            <div class="side-line">${esc(g.tags.join(", "))}</div></div>
          `).join("")}
        </div>` : ""}

      ${d.languages ? `<div class="side-block"><div class="side-h">Languages</div><div class="side-line">${esc(d.languages)}</div></div>` : ""}

      ${d.interests.length ? `
        <div class="side-block">
          <div class="side-h">Interests</div>
          ${d.interests.map(i => `<div class="side-line"><strong>${esc(i.title)}</strong>${i.sub ? ` — ${esc(i.sub)}` : ""}</div>`).join("")}
        </div>` : ""}
    </div>
  `;

  return `
    <table class="cv-table"><tr>
      <td class="side-cell">${sidebarHTML}</td>
      <td class="main-cell">${sectionsHTML.join("")}</td>
    </tr></table>
  `;
}

const EXPORT_STYLES = `
  body { font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 11pt; margin:0; }
  .cv-table { width: 100%; border-collapse: collapse; }
  .side-cell { width: 32%; vertical-align: top; padding: 0 18px 0 0; border-right: 1px solid #d1d5db; }
  .main-cell { width: 68%; vertical-align: top; padding: 0 0 0 22px; }
  .photo { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 2px solid #111827; margin-bottom: 10px; }
  .name { font-size: 15pt; font-weight: 700; color: #111827; }
  .headline { font-size: 10pt; font-weight: 600; color: #92702c; margin-bottom: 14px; }
  .side-block { margin-top: 14px; padding-top: 10px; border-top: 1px solid #e5e7eb; }
  .side-h { font-size: 8pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
  .side-line { font-size: 9pt; color: #374151; margin-bottom: 5px; line-height: 1.4; }
  .skill-g { margin-bottom: 8px; }
  .skill-g-t { font-size: 8.5pt; font-weight: 700; color: #111827; }
  h2 { font-size: 12pt; color: #111827; border-bottom: 2px solid #111827; padding-bottom: 5px; margin: 16px 0 10px; }
  .blk { margin-bottom: 14px; }
  .role-line { font-weight: 700; color: #111827; font-size: 10.5pt; }
  .sub-line { color: #92702c; font-weight: 600; font-size: 9.5pt; }
  .meta-line { color: #6b7280; font-size: 8.5pt; margin-bottom: 4px; }
  .italic-line { color: #6b7280; font-style: italic; font-size: 9pt; margin: 3px 0; }
  .cat-line { font-weight: 700; text-transform: uppercase; font-size: 8.5pt; letter-spacing: 0.5px; margin: 8px 0 3px; }
  .subrole-blk { margin: 6px 0 6px 0; }
  .subrole-h { font-weight: 700; font-size: 9.5pt; color: #111827; }
  p { font-size: 9.5pt; line-height: 1.5; color: #374151; margin: 4px 0; }
  ul { margin: 4px 0 4px 18px; padding: 0; }
  li { font-size: 9.5pt; color: #374151; margin-bottom: 3px; line-height: 1.45; }
  a { color: #92702c; }
`;

function setStatus(msg, isError) {
  const el = document.getElementById("downloadStatus");
  if (!el) return;
  el.style.color = isError ? "#dc2626" : "#6b7280";
  el.textContent = msg;
}

/* ── PDF download ─────────────────────────────────────────── */
document.getElementById("downloadResumeBtn").addEventListener("click", async () => {
  const btn = document.getElementById("downloadResumeBtn");
  btn.disabled = true;
  setStatus("Generating PDF…");

  const data = buildResumeData();
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-9999px";
  wrapper.style.top = "0";
  wrapper.style.width = "794px"; // A4 width at 96dpi
  wrapper.style.background = "#ffffff";
  wrapper.style.padding = "36px 40px";
  wrapper.innerHTML = `<style>${EXPORT_STYLES}</style>` + buildExportHTML(data);
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // mm
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    const imgWidthMm = usableWidth;
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

    let heightLeft = imgHeightMm;
    let position = 0;
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    pdf.addImage(imgData, "JPEG", margin, margin + position, imgWidthMm, imgHeightMm);
    heightLeft -= usableHeight;

    while (heightLeft > 0) {
      position -= usableHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, margin + position, imgWidthMm, imgHeightMm);
      heightLeft -= usableHeight;
    }

    pdf.save("Resume - Md Rashedul Haque.pdf");
    setStatus("PDF downloaded.");
    setTimeout(() => setStatus(""), 3000);
  } catch (err) {
    console.error("PDF generation failed:", err);
    setStatus("Couldn't generate the PDF — this can happen if the profile photo is hosted somewhere that blocks cross-site image access. Try a different photo host, or remove the photo and try again.", true);
  } finally {
    document.body.removeChild(wrapper);
    btn.disabled = false;
  }
});

/* ── DOC download (real, editable, opens in Word/Google Docs) ── */
document.getElementById("downloadDocBtn").addEventListener("click", () => {
  setStatus("Generating DOC…");
  const data = buildResumeData();
  const bodyHTML = `<style>${EXPORT_STYLES}</style>` + buildExportHTML(data);

  const docHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>${esc(data.name)} — Resume</title>
    <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
    </head>
    <body>${bodyHTML}</body></html>
  `;

  const blob = new Blob(["\ufeff", docHTML], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Resume - Md Rashedul Haque.doc";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  setStatus("DOC downloaded.");
  setTimeout(() => setStatus(""), 3000);
});
