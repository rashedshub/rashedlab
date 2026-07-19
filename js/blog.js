import { app } from "./firebase.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function excerpt(text, len) {
  if (!text) return "";
  return text.length > len ? text.slice(0, len).trim() + "…" : text;
}

(async () => {
  const body = document.getElementById("blogTableBody");
  let posts = [];
  try {
    const snap = await getDocs(query(collection(db, "blog_posts"), orderBy("createdAt", "desc")));
    posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Failed to load posts:", err);
  }

  if (!posts.length) {
    body.innerHTML = `<tr><td colspan="5" class="bw-empty">No posts yet — check back soon.</td></tr>`;
    return;
  }

  body.innerHTML = posts.map(p => `
    <tr>
      <td class="bw-thumb-cell">
        ${p.image
          ? `<img class="bw-thumb" src="${p.image}" alt="${p.title || ''}">`
          : `<div class="bw-thumb-placeholder">&#9998;</div>`}
      </td>
      <td>
        <div class="bw-title"><a href="blog-post.html?id=${p.id}">${p.title || "Untitled"}</a></div>
      </td>
      <td class="col-desc"><div class="bw-desc">${excerpt(p.content, 140)}</div></td>
      <td class="col-date"><span class="bw-meta">${formatDate(p.createdAt)}</span></td>
      <td><a class="bw-link" href="blog-post.html?id=${p.id}">Read →</a></td>
    </tr>
  `).join("");
})();
