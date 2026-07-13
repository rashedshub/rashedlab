import { app } from "./firebase.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc,
  collection, addDoc, getDocs, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const params = new URLSearchParams(window.location.search);
const postId = params.get("id");

if (!postId) {
  document.getElementById("postTitle").textContent = "Post not found";
} else {
  loadPost();
  loadComments();
}

async function loadPost() {
  const snap = await getDoc(doc(db, "blog_posts", postId));
  if (!snap.exists()) {
    document.getElementById("postTitle").textContent = "Post not found";
    return;
  }
  const p = snap.data();
  document.getElementById("postTitle").textContent = p.title || "Untitled";
  document.getElementById("postContent").textContent = p.content || "";
  if (p.createdAt) {
    document.getElementById("postDate").textContent = new Date(p.createdAt).toLocaleDateString();
  }
}

async function loadComments() {
  const list = document.getElementById("commentList");
  const q = query(collection(db, "comments"), where("postId", "==", postId), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  list.innerHTML = "";
  if (snap.empty) {
    list.innerHTML = "<p style='color:var(--muted);'>No comments yet.</p>";
    return;
  }
  snap.forEach(d => {
    const c = d.data();
    const div = document.createElement("div");
    div.className = "comment";
    div.innerHTML = `<div class="meta">${c.userName || "Anonymous"} &middot; ${new Date(c.createdAt).toLocaleDateString()}</div>
      <div>${c.text || ""}</div>`;
    list.appendChild(div);
  });
}

onAuthStateChanged(auth, (user) => {
  const formArea = document.getElementById("commentForm");
  if (!user) {
    formArea.innerHTML = `<p><a href="login.html">Log in</a> to leave a comment.</p>`;
    return;
  }
  formArea.innerHTML = `
    <form id="newCommentForm">
      <textarea id="commentText" rows="3" placeholder="Add a comment…" required></textarea>
      <button type="submit">Post Comment</button>
    </form>`;
  document.getElementById("newCommentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = document.getElementById("commentText").value.trim();
    if (!text) return;
    await addDoc(collection(db, "comments"), {
      postId,
      text,
      userId: user.uid,
      userName: user.displayName || user.email.split("@")[0],
      createdAt: Date.now()
    });
    document.getElementById("commentText").value = "";
    loadComments();
  });
});
