import { app } from "./firebase.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);

function escapeHtml(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Supports **bold**, __bold__, *italic*, _italic_ — everything else is
// HTML-escaped first, so this can never introduce real markup/scripts.
function renderFormattedText(raw) {
  let out = escapeHtml(raw);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__(.+?)__/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*(?!\*)([^*]+?)\*(?!\*)/g, "$1<em>$2</em>");
  out = out.replace(/(^|[^_])_(?!_)([^_]+?)_(?!_)/g, "$1<em>$2</em>");
  return out;
}

(async () => {
  const list = document.getElementById("poemsList");
  let poems = [];
  try {
    const snap = await getDocs(query(collection(db, "poems"), orderBy("order", "asc")));
    poems = snap.docs.map(d => d.data());
  } catch (err) {
    console.error("Failed to load poems:", err);
  }

  if (!poems.length) {
    list.innerHTML = `<p class="poems-empty">No poems posted yet — check back soon.</p>`;
    return;
  }

  list.innerHTML = poems.map(p => `
    <article class="poem-card">
      <h2 class="poem-title">${escapeHtml(p.title || "Untitled")}</h2>
      ${p.date ? `<span class="poem-date">${escapeHtml(p.date)}</span>` : ""}
      <div class="poem-text">${renderFormattedText(p.text || "")}</div>
    </article>
  `).join("");
})();
