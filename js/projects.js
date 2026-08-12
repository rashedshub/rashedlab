import { app } from "./firebase.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);

(async () => {
  const grid = document.getElementById("projectGrid");
  let projects = [];
  try {
    const snap = await getDocs(collection(db, "projects"));
    projects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Failed to load projects:", err);
  }

  if (!projects.length) {
    grid.innerHTML = `<p class="bw-empty">No projects added yet — check back soon, or add some from the admin panel.</p>`;
    return;
  }

  grid.innerHTML = projects.map(p => `
    <a class="proj-card" href="project-detail.html?id=${p.id}">
      ${p.image
        ? `<img class="proj-card-thumb" src="${p.image}" alt="${p.title || ''}">`
        : `<div class="proj-card-thumb-placeholder">&#9679;</div>`}
      <div class="proj-card-body">
        <div class="proj-card-title">${p.title || "Untitled"}</div>
        <div class="proj-card-summary">${(p.description || "").slice(0, 130)}${(p.description || "").length > 130 ? "…" : ""}</div>
        <span class="proj-card-cta">View Project →</span>
      </div>
    </a>
  `).join("");
})();
