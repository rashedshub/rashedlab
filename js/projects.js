import { app } from "./firebase.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);

(async () => {
  const body = document.getElementById("projectTableBody");
  let projects = [];
  try {
    const snap = await getDocs(collection(db, "projects"));
    projects = snap.docs.map(d => d.data());
  } catch (err) {
    console.error("Failed to load projects:", err);
  }

  if (!projects.length) {
    body.innerHTML = `<tr><td colspan="4" class="bw-empty">No projects added yet — check back soon, or add some from the admin panel.</td></tr>`;
    return;
  }

  body.innerHTML = projects.map(p => `
    <tr>
      <td class="bw-thumb-cell">
        ${p.image
          ? `<img class="bw-thumb" src="${p.image}" alt="${p.title || ''}">`
          : `<div class="bw-thumb-placeholder">&#9679;</div>`}
      </td>
      <td>
        <div class="bw-title">${p.link ? `<a href="${p.link}" target="_blank" rel="noopener">${p.title || "Untitled"}</a>` : (p.title || "Untitled")}</div>
      </td>
      <td class="col-desc"><div class="bw-desc">${p.description || ""}</div></td>
      <td>${p.link ? `<a class="bw-link" href="${p.link}" target="_blank" rel="noopener">View →</a>` : ""}</td>
    </tr>
  `).join("");
})();
