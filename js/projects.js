import { app } from "./firebase.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);

(async () => {
  const grid = document.getElementById("projectGrid");
  const snap = await getDocs(collection(db, "projects"));
  if (snap.empty) return; // leave placeholder cards if nothing added yet
  grid.innerHTML = "";
  snap.forEach(d => {
    const p = d.data();
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      ${p.image ? `<img src="${p.image}" alt="${p.title || ''}" style="width:100%;border-radius:8px;margin-bottom:10px;"/>` : ""}
      <h3>${p.title || "Untitled"}</h3>
      <p>${p.description || ""}</p>
      ${p.link ? `<a href="${p.link}" target="_blank" rel="noopener">View &rarr;</a>` : ""}
    `;
    grid.appendChild(card);
  });
})();
