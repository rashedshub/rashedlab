import { app } from "./firebase.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);

(async () => {
  const list = document.getElementById("blogList");
  const snap = await getDocs(query(collection(db, "blog_posts"), orderBy("createdAt", "desc")));
  if (snap.empty) {
    list.innerHTML = "<p>No posts yet — check back soon.</p>";
    return;
  }
  list.innerHTML = "";
  snap.forEach(d => {
    const p = d.data();
    const date = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "";
    const card = document.createElement("a");
    card.className = "card";
    card.href = `blog-post.html?id=${d.id}`;
    card.style.display = "block";
    card.innerHTML = `
      <h3>${p.title || "Untitled"}</h3>
      ${date ? `<p style="color:var(--muted);font-size:0.85rem;">${date}</p>` : ""}
      <p>${(p.content || "").slice(0, 200)}${(p.content || "").length > 200 ? "…" : ""}</p>
      <p style="color:var(--accent);">Read more &rarr;</p>
    `;
    list.appendChild(card);
  });
})();
