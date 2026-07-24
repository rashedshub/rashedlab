/* ============================================================
   Resume export — ATS-friendly, single-column, standard format.
   - "Download PDF": real vector text via jsPDF (no screenshots),
     so it's genuinely parseable by Applicant Tracking Systems —
     content just flows top-to-bottom and pages naturally.
   - "Download DOC": same content as a simple single-column
     Word-compatible document.
   Both read the DOM at click-time, so they always reflect
   whatever content is currently on the page.
   ============================================================ */

function text(el) { return el ? el.textContent.trim() : ""; }

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

function setStatus(msg, isError) {
  const el = document.getElementById("downloadStatus");
  if (!el) return;
  el.style.color = isError ? "#dc2626" : "#6b7280";
  el.textContent = msg;
}

/* ── PDF: plain, standard, ATS-friendly (real text, single column) ── */
document.getElementById("downloadResumeBtn").addEventListener("click", () => {
  setStatus("Generating PDF…");
  try {
    const d = buildResumeData();
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "pt", format: "letter" });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    function checkPageBreak(need) {
      if (y + need > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
    }

    function heading(txt) {
      checkPageBreak(24);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(17, 24, 39);
      pdf.text(txt.toUpperCase(), margin, y);
      y += 4;
      pdf.setDrawColor(17, 24, 39);
      pdf.setLineWidth(1);
      pdf.line(margin, y, margin + maxWidth, y);
      y += 16;
    }

    function subheading(txt, size = 11) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(size);
      pdf.setTextColor(17, 24, 39);
      const lines = pdf.splitTextToSize(txt, maxWidth);
      checkPageBreak(lines.length * 14);
      lines.forEach(line => { pdf.text(line, margin, y); y += 14; });
    }

    function metaLine(txt) {
      if (!txt) return;
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(9.5);
      pdf.setTextColor(107, 114, 128);
      const lines = pdf.splitTextToSize(txt, maxWidth);
      checkPageBreak(lines.length * 12);
      lines.forEach(line => { pdf.text(line, margin, y); y += 12; });
      y += 2;
    }

    function paragraph(txt, size = 10) {
      if (!txt) return;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(size);
      pdf.setTextColor(55, 65, 81);
      const lines = pdf.splitTextToSize(txt, maxWidth);
      lines.forEach(line => {
        checkPageBreak(13);
        pdf.text(line, margin, y);
        y += 13;
      });
    }

    function bullet(txt) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(55, 65, 81);
      const indent = 14;
      const lines = pdf.splitTextToSize(txt, maxWidth - indent);
      lines.forEach((line, i) => {
        checkPageBreak(13);
        if (i === 0) pdf.text("\u2022", margin, y);
        pdf.text(line, margin + indent, y);
        y += 13;
      });
    }

    function spacer(h = 8) { y += h; }

    /* Header */
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.setTextColor(17, 24, 39);
    pdf.text(d.name || "", margin, y);
    y += 22;

    if (d.headline) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(80, 80, 80);
      pdf.text(d.headline, margin, y);
      y += 16;
    }

    if (d.contact.length) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      pdf.setTextColor(80, 80, 80);
      const contactLine = d.contact.join("   |   ");
      const lines = pdf.splitTextToSize(contactLine, maxWidth);
      lines.forEach(line => { pdf.text(line, margin, y); y += 12; });
    }
    y += 8;
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.75);
    pdf.line(margin, y, margin + maxWidth, y);
    y += 18;

    /* Summary */
    if (d.summary) {
      heading("Summary");
      paragraph(d.summary);
      spacer(14);
    }

    /* Skills */
    if (d.skillGroups.length) {
      heading("Skills");
      d.skillGroups.forEach(g => {
        if (!g.tags.length) return;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(17, 24, 39);
        checkPageBreak(13);
        pdf.text(`${g.title}: `, margin, y);
        const labelWidth = pdf.getTextWidth(`${g.title}: `);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(55, 65, 81);
        const lines = pdf.splitTextToSize(g.tags.join(", "), maxWidth - labelWidth);
        lines.forEach((line, i) => {
          if (i > 0) checkPageBreak(13);
          pdf.text(line, margin + (i === 0 ? labelWidth : 0), y);
          y += 13;
        });
      });
      spacer(6);
    }

    /* Experience */
    if (d.experience.length) {
      heading("Experience");
      d.experience.forEach(e => {
        subheading(e.company, 11);
        subheading(e.role, 10.5);
        metaLine(e.years);
        if (e.tagline) paragraph(e.tagline, 9.5);
        if (e.roleCategory) {
          spacer(2);
          subheading(e.roleCategory, 9.5);
          spacer(2);
        }
        e.subroles.forEach(sr => {
          subheading(sr.title, 10);
          sr.bullets.forEach(b => bullet(b));
          spacer(4);
        });
        spacer(10);
      });
    }

    /* Key Achievements */
    if (d.achievements.length) {
      heading("Key Achievements");
      d.achievements.forEach(a => {
        subheading(a.title, 10.5);
        paragraph(a.description, 9.5);
        spacer(8);
      });
    }

    /* Generic entry-based sections */
    function entriesSection(title, entries) {
      if (!entries.length) return;
      heading(title);
      entries.forEach(e => {
        if (e.role) subheading(e.role, 10.5);
        if (e.meta) metaLine(e.meta);
        e.paragraphs.forEach(p => paragraph(p, 9.5));
        e.items.forEach(i => bullet(i));
        e.links.forEach(l => {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9.5);
          pdf.setTextColor(37, 99, 235);
          checkPageBreak(13);
          pdf.textWithLink(l.text, margin, y, { url: l.href });
          y += 13;
        });
        spacer(8);
      });
    }

    entriesSection("Projects", d.projects);
    entriesSection("Education", d.education);
    entriesSection("Training / Short Courses", d.training);
    entriesSection("Certifications", d.certifications);
    entriesSection("Volunteering", d.volunteering);

    /* Languages & Interests */
    if (d.languages) {
      heading("Languages");
      paragraph(d.languages);
      spacer(10);
    }

    if (d.interests.length) {
      heading("Interests");
      d.interests.forEach(i => {
        paragraph(i.sub ? `${i.title} — ${i.sub}` : i.title, 9.5);
      });
      spacer(10);
    }

    if (d.references) {
      heading("References");
      paragraph(d.references);
    }

    pdf.save("Resume - Md Rashedul Haque.pdf");
    setStatus("PDF downloaded.");
    setTimeout(() => setStatus(""), 3000);
  } catch (err) {
    console.error("PDF generation failed:", err);
    setStatus(`Couldn't generate the PDF: ${err.message}`, true);
  }
});

/* ── DOC: same content, simple single-column Word document ── */
document.getElementById("downloadDocBtn").addEventListener("click", () => {
  setStatus("Generating DOC…");
  try {
    const d = buildResumeData();

    const parts = [];
    parts.push(`<h1>${esc(d.name)}</h1>`);
    if (d.headline) parts.push(`<p class="headline">${esc(d.headline)}</p>`);
    if (d.contact.length) parts.push(`<p class="contact">${d.contact.map(esc).join(" &nbsp;|&nbsp; ")}</p>`);
    parts.push(`<hr/>`);

    if (d.summary) parts.push(`<h2>Summary</h2><p>${esc(d.summary)}</p>`);

    if (d.skillGroups.length) {
      parts.push(`<h2>Skills</h2>`);
      d.skillGroups.forEach(g => {
        if (!g.tags.length) return;
        parts.push(`<p><strong>${esc(g.title)}:</strong> ${esc(g.tags.join(", "))}</p>`);
      });
    }

    if (d.experience.length) {
      parts.push(`<h2>Experience</h2>`);
      d.experience.forEach(e => {
        parts.push(`<p class="role-line">${esc(e.company)}</p>`);
        parts.push(`<p class="sub-line">${esc(e.role)}</p>`);
        if (e.years) parts.push(`<p class="meta-line">${esc(e.years)}</p>`);
        if (e.tagline) parts.push(`<p class="italic-line">${esc(e.tagline)}</p>`);
        if (e.roleCategory) parts.push(`<p class="cat-line">${esc(e.roleCategory)}</p>`);
        e.subroles.forEach(sr => {
          parts.push(`<p class="subrole-h">${esc(sr.title)}</p>`);
          if (sr.bullets.length) parts.push(`<ul>${sr.bullets.map(b => `<li>${esc(b)}</li>`).join("")}</ul>`);
        });
      });
    }

    if (d.achievements.length) {
      parts.push(`<h2>Key Achievements</h2>`);
      d.achievements.forEach(a => {
        parts.push(`<p class="role-line">${esc(a.title)}</p><p>${esc(a.description)}</p>`);
      });
    }

    function entriesSection(title, entries) {
      if (!entries.length) return;
      parts.push(`<h2>${title}</h2>`);
      entries.forEach(e => {
        if (e.role) parts.push(`<p class="role-line">${esc(e.role)}</p>`);
        if (e.meta) parts.push(`<p class="meta-line">${esc(e.meta)}</p>`);
        e.paragraphs.forEach(p => parts.push(`<p>${esc(p)}</p>`));
        if (e.items.length) parts.push(`<ul>${e.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>`);
        e.links.forEach(l => parts.push(`<p><a href="${l.href}">${esc(l.text)}</a></p>`));
      });
    }

    entriesSection("Projects", d.projects);
    entriesSection("Education", d.education);
    entriesSection("Training / Short Courses", d.training);
    entriesSection("Certifications", d.certifications);
    entriesSection("Volunteering", d.volunteering);

    if (d.languages) parts.push(`<h2>Languages</h2><p>${esc(d.languages)}</p>`);

    if (d.interests.length) {
      parts.push(`<h2>Interests</h2>`);
      d.interests.forEach(i => parts.push(`<p>${esc(i.title)}${i.sub ? ` — ${esc(i.sub)}` : ""}</p>`));
    }

    if (d.references) parts.push(`<h2>References</h2><p>${esc(d.references)}</p>`);

    const styles = `
      body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #111827; }
      h1 { font-size: 20pt; margin: 0 0 4px; }
      .headline { color: #555; font-size: 11pt; margin: 0 0 6px; }
      .contact { color: #555; font-size: 9.5pt; margin: 0 0 10px; }
      hr { border: none; border-top: 1px solid #bbb; margin: 10px 0 16px; }
      h2 { font-size: 13pt; border-bottom: 1.5px solid #111827; padding-bottom: 4px; margin: 18px 0 10px; page-break-after: avoid; mso-pagination: avoid; }
      p { font-size: 10pt; line-height: 1.5; margin: 4px 0; }
      .role-line { font-weight: 700; font-size: 11pt; margin: 10px 0 0; }
      .sub-line { color: #92702c; font-weight: 600; font-size: 10pt; margin: 0; }
      .meta-line { color: #666; font-size: 9pt; font-style: italic; margin: 0 0 4px; }
      .italic-line { color: #666; font-style: italic; font-size: 9.5pt; }
      .cat-line { font-weight: 700; text-transform: uppercase; font-size: 9pt; letter-spacing: 0.5px; margin: 8px 0 2px; }
      .subrole-h { font-weight: 700; font-size: 10pt; margin: 6px 0 2px; }
      ul { margin: 4px 0 8px 20px; padding: 0; }
      li { font-size: 10pt; margin-bottom: 3px; line-height: 1.4; }
      a { color: #2563eb; }
      @page { size: 8.5in 11in; margin: 0.6in; }
    `;

    const docHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>${esc(d.name)} — Resume</title>
      <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
      <style>${styles}</style>
      </head>
      <body>${parts.join("")}</body></html>
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
  } catch (err) {
    console.error("DOC generation failed:", err);
    setStatus(`Couldn't generate the DOC: ${err.message}`, true);
  }
});
