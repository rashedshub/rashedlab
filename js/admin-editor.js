import { app } from "./firebase.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc,
  collection, getDocs, addDoc, updateDoc, deleteDoc, orderBy, query
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const el = (id) => document.getElementById(id);

// ── Auth guard ──────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "admin-login.html"; return; }
  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || snap.data().role !== "admin") {
    window.location.href = "admin-login.html";
    return;
  }
  loadProjects();
  loadPosts();
  loadMessages();
});

el("logoutBtn").addEventListener("click", () => signOut(auth).then(() => window.location.href = "admin-login.html"));

// ── Tabs ────────────────────────────────────────────────────
document.querySelectorAll(".tabs button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    el(`panel-${btn.dataset.panel}`).classList.add("active");
  });
});

// ── Projects ────────────────────────────────────────────────
function clearProjectForm() {
  el("projectId").value = "";
  el("projectTitle").value = "";
  el("projectDesc").value = "";
  el("projectLink").value = "";
  el("projectImage").value = "";
}
el("clearProjectForm").addEventListener("click", clearProjectForm);

async function loadProjects() {
  const snap = await getDocs(collection(db, "projects"));
  const list = el("projectList");
  list.innerHTML = "";
  snap.forEach(d => {
    const p = d.data();
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `<strong>${p.title || ""}</strong><p>${p.description || ""}</p>
      <button data-edit="${d.id}">Edit</button>
      <button data-delete="${d.id}">Delete</button>`;
    list.appendChild(row);
  });
  list.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", async () => {
    const s = await getDoc(doc(db, "projects", b.dataset.edit));
    const p = s.data();
    el("projectId").value = b.dataset.edit;
    el("projectTitle").value = p.title || "";
    el("projectDesc").value = p.description || "";
    el("projectLink").value = p.link || "";
    el("projectImage").value = p.image || "";
  }));
  list.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Delete this project?")) return;
    await deleteDoc(doc(db, "projects", b.dataset.delete));
    loadProjects();
  }));
}

el("saveProject").addEventListener("click", async () => {
  const data = {
    title: el("projectTitle").value,
    description: el("projectDesc").value,
    link: el("projectLink").value,
    image: el("projectImage").value
  };
  const id = el("projectId").value;
  if (id) {
    await updateDoc(doc(db, "projects", id), data);
  } else {
    await addDoc(collection(db, "projects"), data);
  }
  el("projectMsg").textContent = "Saved.";
  setTimeout(() => el("projectMsg").textContent = "", 2000);
  clearProjectForm();
  loadProjects();
});

// ── Blog ────────────────────────────────────────────────────
function clearPostForm() {
  el("postId").value = "";
  el("postTitle").value = "";
  el("postContent").value = "";
}
el("clearPostForm").addEventListener("click", clearPostForm);

async function loadPosts() {
  const snap = await getDocs(query(collection(db, "blog_posts"), orderBy("createdAt", "desc")));
  const list = el("postList");
  list.innerHTML = "";
  snap.forEach(d => {
    const p = d.data();
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `<strong>${p.title || ""}</strong>
      <button data-edit="${d.id}">Edit</button>
      <button data-delete="${d.id}">Delete</button>`;
    list.appendChild(row);
  });
  list.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", async () => {
    const s = await getDoc(doc(db, "blog_posts", b.dataset.edit));
    const p = s.data();
    el("postId").value = b.dataset.edit;
    el("postTitle").value = p.title || "";
    el("postContent").value = p.content || "";
  }));
  list.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Delete this post? Its comments will remain but be orphaned.")) return;
    await deleteDoc(doc(db, "blog_posts", b.dataset.delete));
    loadPosts();
  }));
}

el("savePost").addEventListener("click", async () => {
  const id = el("postId").value;
  const data = { title: el("postTitle").value, content: el("postContent").value };
  if (id) {
    await updateDoc(doc(db, "blog_posts", id), data);
  } else {
    data.createdAt = Date.now();
    await addDoc(collection(db, "blog_posts"), data);
  }
  el("postMsg").textContent = "Saved.";
  setTimeout(() => el("postMsg").textContent = "", 2000);
  clearPostForm();
  loadPosts();
});

// ── Messages ────────────────────────────────────────────────
async function loadMessages() {
  const snap = await getDocs(query(collection(db, "contact_messages"), orderBy("createdAt", "desc")));
  const list = el("messageList");
  list.innerHTML = "";
  if (snap.empty) { list.innerHTML = "<p>No messages yet.</p>"; return; }
  snap.forEach(d => {
    const m = d.data();
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `<strong>${m.name || ""}</strong> — ${m.email || ""}
      <p style="color:var(--muted);font-size:0.85rem;">${m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</p>
      <p>${m.message || ""}</p>`;
    list.appendChild(row);
  });
}
