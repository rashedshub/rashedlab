import { app } from "./firebase.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, deleteDoc,
  collection, addDoc, getDocs, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const params = new URLSearchParams(window.location.search);
const postId = params.get("id");

let currentUser = null;
let isAdmin = false;

if (!postId) {
  document.getElementById("postTitle").textContent = "Post not found";
} else {
  loadPost();
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
  if (p.image) {
    const imgEl = document.getElementById("postImage");
    imgEl.src = p.image;
    imgEl.alt = p.title || "";
    imgEl.style.display = "block";
  }
  const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";
  document.getElementById("postDate").textContent = `By Md. Rashedul Haque${dateStr ? ` · ${dateStr}` : ""}`;
}

/* Comments are rendered using textContent (never innerHTML) for any
   field a visitor supplied — comment text, display name — so a
   malicious comment can never inject executable markup. */
async function loadComments() {
  const list = document.getElementById("commentList");
  const q = query(collection(db, "comments"), where("postId", "==", postId), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  list.innerHTML = "";

  if (snap.empty) {
    const empty = document.createElement("p");
    empty.style.color = "var(--muted)";
    empty.textContent = "No comments yet.";
    list.appendChild(empty);
    return;
  }

  snap.forEach(d => {
    const c = d.data();

    const wrap = document.createElement("div");
    wrap.className = "comment";

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${c.userName || "Anonymous"} · ${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}`;

    const body = document.createElement("div");
    body.textContent = c.text || "";

    wrap.appendChild(meta);
    wrap.appendChild(body);

    // Moderation: the comment's own author, or the site admin, can remove it
    if (currentUser && (currentUser.uid === c.userId || isAdmin)) {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.textContent = "Delete";
      delBtn.className = "comment-delete-btn";
      delBtn.addEventListener("click", async () => {
        if (!confirm("Delete this comment?")) return;
        try {
          await deleteDoc(doc(db, "comments", d.id));
          loadComments();
        } catch (err) {
          console.error("Failed to delete comment:", err);
          alert("Couldn't delete that comment. Please try again.");
        }
      });
      wrap.appendChild(delBtn);
    }

    list.appendChild(wrap);
  });
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  isAdmin = false;

  if (user) {
    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      isAdmin = userSnap.exists() && userSnap.data().role === "admin";
    } catch (err) { /* not admin */ }
  }

  loadComments();

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
