import { app } from "./firebase.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc,
  collection, getDocs, addDoc, updateDoc, deleteDoc, orderBy, query
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const el = (id) => document.getElementById(id);

// ── Auth guard ──────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "admin-login.html"; return; }
  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || snap.data().role !== "admin") {
    window.location.href = "admin-login.html";
    return;
  }
  loadAbout();
  loadSkills();
  loadExperience();
  loadResumeInfo();
  loadEducation();
  loadAchievements();
  loadResumeProjects();
  loadTraining();
  loadCertifications();
  loadProjects();
  loadPosts();
  loadMessages();
  loadServices();
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

// ── About Me ────────────────────────────────────────────────
async function loadAbout() {
  const snap = await getDoc(doc(db, "site_content", "home"));
  if (!snap.exists()) return;
  const d = snap.data();
  el("aboutName").value = d.name || "";
  el("aboutLocation").value = d.location || "";
  el("aboutDegree").value = d.degree || "";
  el("aboutExperienceYears").value = d.experienceYears || "";
  el("aboutPhone").value = d.phone || "";
  el("aboutEmail").value = d.email || "";
  el("aboutAvailability").value = d.availability || "";
  el("aboutBio").value = d.bio || "";
  el("aboutTypedRoles").value = d.typedRoles || "";
  el("socialFacebook").value = d.socialFacebook || "";
  el("socialLinkedin").value = d.socialLinkedin || "";
  el("socialTwitter").value = d.socialTwitter || "";
  el("socialInstagram").value = d.socialInstagram || "";
  el("socialGithub").value = d.socialGithub || "";
  if (d.photoURL) {
    el("profilePreview").src = d.photoURL;
    el("profileUrl").value = d.photoURL;
  }
}

// Show a local preview immediately when a file is chosen
el("profileFile").addEventListener("change", () => {
  const file = el("profileFile").files[0];
  if (!file) return;
  el("profilePreview").src = URL.createObjectURL(file);
});

el("uploadProfile").addEventListener("click", async () => {
  const file = el("profileFile").files[0];
  if (!file) {
    el("profileMsg").style.color = "#ff8080";
    el("profileMsg").textContent = "Choose an image file first.";
    return;
  }
  if (!file.type.startsWith("image/")) {
    el("profileMsg").style.color = "#ff8080";
    el("profileMsg").textContent = "Please choose an image file.";
    return;
  }
  el("profileMsg").style.color = "";
  el("profileMsg").textContent = "Uploading…";
  try {
    const fileRef = ref(storage, `profile/profile-${Date.now()}.${file.name.split('.').pop()}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    await setDoc(doc(db, "site_content", "home"), { photoURL: url }, { merge: true });
    el("profilePreview").src = url;
    el("profileMsg").textContent = "Photo updated.";
    setTimeout(() => el("profileMsg").textContent = "", 2500);
  } catch (err) {
    console.error("Failed to upload photo:", err);
    el("profileMsg").style.color = "#ff8080";
    el("profileMsg").textContent = err.code === "storage/unauthorized"
      ? "Upload failed — permission denied. Check your Firebase Storage rules."
      : `Upload failed: ${err.message}`;
  }
});

el("saveProfileUrl").addEventListener("click", async () => {
  const url = el("profileUrl").value.trim();
  if (!url) {
    el("profileUrlMsg").style.color = "#ff8080";
    el("profileUrlMsg").textContent = "Paste an image link first.";
    return;
  }
  try {
    new URL(url);
  } catch {
    el("profileUrlMsg").style.color = "#ff8080";
    el("profileUrlMsg").textContent = "That doesn't look like a valid URL.";
    return;
  }
  el("profileUrlMsg").style.color = "";
  el("profileUrlMsg").textContent = "Saving…";
  try {
    await setDoc(doc(db, "site_content", "home"), { photoURL: url }, { merge: true });
    el("profilePreview").src = url;
    el("profileUrlMsg").textContent = "Photo updated.";
    setTimeout(() => el("profileUrlMsg").textContent = "", 2500);
  } catch (err) {
    console.error("Failed to save photo URL:", err);
    el("profileUrlMsg").style.color = "#ff8080";
    el("profileUrlMsg").textContent = `Save failed: ${err.message}`;
  }
});

el("saveAbout").addEventListener("click", async () => {
  el("aboutMsg").style.color = "";
  el("aboutMsg").textContent = "Saving…";
  try {
    await setDoc(doc(db, "site_content", "home"), {
      name: el("aboutName").value,
      location: el("aboutLocation").value,
      degree: el("aboutDegree").value,
      experienceYears: el("aboutExperienceYears").value,
      phone: el("aboutPhone").value,
      email: el("aboutEmail").value,
      availability: el("aboutAvailability").value,
      bio: el("aboutBio").value,
      typedRoles: el("aboutTypedRoles").value,
      socialFacebook: el("socialFacebook").value,
      socialLinkedin: el("socialLinkedin").value,
      socialTwitter: el("socialTwitter").value,
      socialInstagram: el("socialInstagram").value,
      socialGithub: el("socialGithub").value
    }, { merge: true });
    el("aboutMsg").textContent = "Saved.";
    setTimeout(() => el("aboutMsg").textContent = "", 2500);
  } catch (err) {
    console.error("Failed to save About Me:", err);
    el("aboutMsg").style.color = "#ff8080";
    el("aboutMsg").textContent = err.code === "permission-denied"
      ? "Save failed — permission denied. Check your Firestore rules for the site_content collection."
      : `Save failed: ${err.message}`;
  }
});

// ── Skills ──────────────────────────────────────────────────
function clearSkillForm() {
  el("skillId").value = "";
  el("skillName").value = "";
  el("skillPercentage").value = "";
}
el("clearSkillForm").addEventListener("click", clearSkillForm);

async function loadSkills() {
  const snap = await getDocs(collection(db, "skills"));
  const list = el("skillList");
  list.innerHTML = "";
  snap.forEach(d => {
    const s = d.data();
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `<strong>${s.name || ""}</strong> — ${s.percentage || 0}%
      <div>
        <button data-edit="${d.id}">Edit</button>
        <button data-delete="${d.id}">Delete</button>
      </div>`;
    list.appendChild(row);
  });
  list.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", async () => {
    const s = await getDoc(doc(db, "skills", b.dataset.edit));
    const d = s.data();
    el("skillId").value = b.dataset.edit;
    el("skillName").value = d.name || "";
    el("skillPercentage").value = d.percentage || "";
  }));
  list.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Delete this skill?")) return;
    await deleteDoc(doc(db, "skills", b.dataset.delete));
    loadSkills();
  }));
}

el("saveSkill").addEventListener("click", async () => {
  const data = {
    name: el("skillName").value,
    percentage: Number(el("skillPercentage").value) || 0
  };
  const id = el("skillId").value;
  el("skillMsg").style.color = "";
  el("skillMsg").textContent = "Saving…";
  try {
    if (id) {
      await updateDoc(doc(db, "skills", id), data);
    } else {
      await addDoc(collection(db, "skills"), data);
    }
    el("skillMsg").textContent = "Saved.";
    setTimeout(() => el("skillMsg").textContent = "", 2500);
    clearSkillForm();
    loadSkills();
  } catch (err) {
    console.error("Failed to save skill:", err);
    el("skillMsg").style.color = "#ff8080";
    el("skillMsg").textContent = `Save failed: ${err.message}`;
  }
});

// ── Experience (with sub-roles) ────────────────────────────
function parseSubroles(raw) {
  const blocks = raw.split(/\n(?=##\s)/).map(b => b.trim()).filter(Boolean);
  return blocks.map(block => {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    const title = (lines[0] || "").replace(/^##\s*/, "").trim();
    const bullets = lines.slice(1)
      .filter(l => l.startsWith("-"))
      .map(l => l.replace(/^-\s*/, "").trim())
      .filter(Boolean);
    return { title, bullets };
  }).filter(sr => sr.title);
}

function serializeSubroles(subroles) {
  return (subroles || []).map(sr =>
    `## ${sr.title}\n${(sr.bullets || []).map(b => `- ${b}`).join("\n")}`
  ).join("\n\n");
}

function clearExpForm() {
  el("expId").value = "";
  el("expRole").value = "";
  el("expCompany").value = "";
  el("expYears").value = "";
  el("expOrder").value = "";
  el("expSubroles").value = "";
}
el("clearExpForm").addEventListener("click", clearExpForm);

async function loadExperience() {
  const snap = await getDocs(query(collection(db, "experience"), orderBy("order", "asc")));
  const list = el("expList");
  list.innerHTML = "";
  snap.forEach(d => {
    const e = d.data();
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `<strong>${e.role || ""}</strong>
      <p>${e.company || ""} ${e.years ? `· ${e.years}` : ""}</p>
      <p style="font-size:0.8rem;">${(e.subroles || []).map(sr => sr.title).join(" · ")}</p>
      <div>
        <button data-edit="${d.id}">Edit</button>
        <button data-delete="${d.id}">Delete</button>
      </div>`;
    list.appendChild(row);
  });
  list.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", async () => {
    const s = await getDoc(doc(db, "experience", b.dataset.edit));
    const e = s.data();
    el("expId").value = b.dataset.edit;
    el("expRole").value = e.role || "";
    el("expCompany").value = e.company || "";
    el("expYears").value = e.years || "";
    el("expOrder").value = e.order ?? "";
    el("expSubroles").value = serializeSubroles(e.subroles);
  }));
  list.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Delete this experience entry?")) return;
    await deleteDoc(doc(db, "experience", b.dataset.delete));
    loadExperience();
  }));
}

el("saveExp").addEventListener("click", async () => {
  const data = {
    role: el("expRole").value,
    company: el("expCompany").value,
    years: el("expYears").value,
    order: Number(el("expOrder").value) || 0,
    subroles: parseSubroles(el("expSubroles").value)
  };
  const id = el("expId").value;
  el("expMsg").style.color = "";
  el("expMsg").textContent = "Saving…";
  try {
    if (id) {
      await updateDoc(doc(db, "experience", id), data);
    } else {
      await addDoc(collection(db, "experience"), data);
    }
    el("expMsg").textContent = "Saved.";
    setTimeout(() => el("expMsg").textContent = "", 2500);
    clearExpForm();
    loadExperience();
  } catch (err) {
    console.error("Failed to save experience:", err);
    el("expMsg").style.color = "#ff8080";
    el("expMsg").textContent = `Save failed: ${err.message}`;
  }
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
  el("projectMsg").style.color = "";
  el("projectMsg").textContent = "Saving…";
  try {
    if (id) {
      await updateDoc(doc(db, "projects", id), data);
    } else {
      await addDoc(collection(db, "projects"), data);
    }
    el("projectMsg").textContent = "Saved.";
    setTimeout(() => el("projectMsg").textContent = "", 2500);
    clearProjectForm();
    loadProjects();
  } catch (err) {
    console.error("Failed to save project:", err);
    el("projectMsg").style.color = "#ff8080";
    el("projectMsg").textContent = `Save failed: ${err.message}`;
  }
});

// ── Blog ────────────────────────────────────────────────────
function clearPostForm() {
  el("postId").value = "";
  el("postTitle").value = "";
  el("postContent").value = "";
  el("postImage").value = "";
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
    el("postImage").value = p.image || "";
  }));
  list.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Delete this post? Its comments will remain but be orphaned.")) return;
    await deleteDoc(doc(db, "blog_posts", b.dataset.delete));
    loadPosts();
  }));
}

el("savePost").addEventListener("click", async () => {
  const id = el("postId").value;
  const data = { title: el("postTitle").value, content: el("postContent").value, image: el("postImage").value };
  el("postMsg").style.color = "";
  el("postMsg").textContent = "Saving…";
  try {
    if (id) {
      await updateDoc(doc(db, "blog_posts", id), data);
    } else {
      data.createdAt = Date.now();
      await addDoc(collection(db, "blog_posts"), data);
    }
    el("postMsg").textContent = "Saved.";
    setTimeout(() => el("postMsg").textContent = "", 2500);
    clearPostForm();
    loadPosts();
  } catch (err) {
    console.error("Failed to save post:", err);
    el("postMsg").style.color = "#ff8080";
    el("postMsg").textContent = `Save failed: ${err.message}`;
  }
});

// ── Messages ────────────────────────────────────────────────
async function loadMessages() {
  const snap = await getDocs(query(collection(db, "contact_messages"), orderBy("createdAt", "desc")));
  const list = el("messageList");
  list.innerHTML = "";
  if (snap.empty) { list.innerHTML = "<p style='color:rgba(242,242,242,0.6);'>No messages yet.</p>"; return; }
  snap.forEach(d => {
    const m = d.data();
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `<strong>${m.name || ""}</strong> — ${m.email || ""}
      ${m.subject ? `<p style="color:var(--primary,#00B87B);font-weight:500;">${m.subject}</p>` : ""}
      <p>${m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</p>
      <p>${m.message || ""}</p>`;
    list.appendChild(row);
  });
}

// ── Services ────────────────────────────────────────────────
function clearServiceForm() {
  el("serviceId").value = "";
  el("serviceTitle").value = "";
  el("serviceDescription").value = "";
  el("serviceIcon").value = "";
}
el("clearServiceForm").addEventListener("click", clearServiceForm);

async function loadServices() {
  const snap = await getDocs(collection(db, "services"));
  const list = el("serviceList");
  list.innerHTML = "";
  snap.forEach(d => {
    const s = d.data();
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `<strong>${s.title || ""}</strong><p>${s.description || ""}</p>
      <div>
        <button data-edit="${d.id}">Edit</button>
        <button data-delete="${d.id}">Delete</button>
      </div>`;
    list.appendChild(row);
  });
  list.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", async () => {
    const s = await getDoc(doc(db, "services", b.dataset.edit));
    const d = s.data();
    el("serviceId").value = b.dataset.edit;
    el("serviceTitle").value = d.title || "";
    el("serviceDescription").value = d.description || "";
    el("serviceIcon").value = d.icon || "";
  }));
  list.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Delete this service?")) return;
    await deleteDoc(doc(db, "services", b.dataset.delete));
    loadServices();
  }));
}

el("saveService").addEventListener("click", async () => {
  const data = {
    title: el("serviceTitle").value,
    description: el("serviceDescription").value,
    icon: el("serviceIcon").value || "fa-briefcase"
  };
  const id = el("serviceId").value;
  el("serviceMsg").style.color = "";
  el("serviceMsg").textContent = "Saving…";
  try {
    if (id) {
      await updateDoc(doc(db, "services", id), data);
    } else {
      await addDoc(collection(db, "services"), data);
    }
    el("serviceMsg").textContent = "Saved.";
    setTimeout(() => el("serviceMsg").textContent = "", 2500);
    clearServiceForm();
    loadServices();
  } catch (err) {
    console.error("Failed to save service:", err);
    el("serviceMsg").style.color = "#ff8080";
    el("serviceMsg").textContent = `Save failed: ${err.message}`;
  }
});



// ── Resume Info (single doc: site_content/resume) ──────────
async function loadResumeInfo() {
  const snap = await getDoc(doc(db, "site_content", "resume"));
  if (!snap.exists()) return;
  const d = snap.data();
  el("rfName").value = d.name || "";
  el("rfHeadline").value = d.headline || "";
  el("rfLocation").value = d.location || "";
  el("rfEmail").value = d.email || "";
  el("rfPhone").value = d.phone || "";
  el("rfWebsite").value = d.website || "";
  el("rfBirthday").value = d.birthday || "";
  el("rfSummary").value = d.summary || "";
  el("rfSkillsHR").value = d.skillsHR || "";
  el("rfSkillsTechnical").value = d.skillsTechnical || "";
  el("rfSkillsLeadership").value = d.skillsLeadership || "";
  el("rfInterests").value = d.interests || "";
  el("rfLanguages").value = d.languages || "";
  el("rfVolTitle").value = d.volunteeringTitle || "";
  el("rfVolDesc").value = d.volunteeringDesc || "";
  el("rfReferences").value = d.references || "";
}

el("saveResumeInfo").addEventListener("click", async () => {
  const data = {
    name: el("rfName").value,
    headline: el("rfHeadline").value,
    location: el("rfLocation").value,
    email: el("rfEmail").value,
    phone: el("rfPhone").value,
    website: el("rfWebsite").value,
    birthday: el("rfBirthday").value,
    summary: el("rfSummary").value,
    skillsHR: el("rfSkillsHR").value,
    skillsTechnical: el("rfSkillsTechnical").value,
    skillsLeadership: el("rfSkillsLeadership").value,
    interests: el("rfInterests").value,
    languages: el("rfLanguages").value,
    volunteeringTitle: el("rfVolTitle").value,
    volunteeringDesc: el("rfVolDesc").value,
    references: el("rfReferences").value
  };
  el("resumeInfoMsg").style.color = "";
  el("resumeInfoMsg").textContent = "Saving…";
  try {
    await setDoc(doc(db, "site_content", "resume"), data, { merge: true });
    el("resumeInfoMsg").textContent = "Saved.";
    setTimeout(() => el("resumeInfoMsg").textContent = "", 2500);
  } catch (err) {
    console.error("Failed to save resume info:", err);
    el("resumeInfoMsg").style.color = "#ff8080";
    el("resumeInfoMsg").textContent = `Save failed: ${err.message}`;
  }
});

// ── Generic list-CRUD factory (used for Education, Achievements,
//    Resume Projects, Training, Certifications) ────────────────
function makeListCrud({ collectionName, fields, formIdPrefix, listElId, msgElId, saveBtnId, clearBtnId, renderRow, orderField = "order" }) {
  const idEl = () => el(`${formIdPrefix}Id`);

  function clearForm() {
    idEl().value = "";
    fields.forEach(f => { const e = el(f.id); if (e) e.value = ""; });
  }
  el(clearBtnId).addEventListener("click", clearForm);

  function readForm() {
    const data = {};
    fields.forEach(f => {
      const raw = el(f.id).value;
      data[f.key] = f.type === "number" ? (Number(raw) || 0)
        : f.type === "lines" ? raw.split("\n").map(l => l.trim()).filter(Boolean)
        : raw;
    });
    return data;
  }

  function fillForm(data) {
    fields.forEach(f => {
      const e = el(f.id);
      if (!e) return;
      const val = data[f.key];
      e.value = f.type === "lines" ? (val || []).join("\n") : (val ?? "");
    });
  }

  async function load() {
    const snap = await getDocs(query(collection(db, collectionName), orderBy(orderField, "asc")));
    const list = el(listElId);
    list.innerHTML = "";
    snap.forEach(d => {
      const data = d.data();
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = renderRow(data) + `
        <div>
          <button data-edit="${d.id}">Edit</button>
          <button data-delete="${d.id}">Delete</button>
        </div>`;
      list.appendChild(row);
    });
    list.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", async () => {
      const s = await getDoc(doc(db, collectionName, b.dataset.edit));
      idEl().value = b.dataset.edit;
      fillForm(s.data());
    }));
    list.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", async () => {
      if (!confirm("Delete this entry?")) return;
      await deleteDoc(doc(db, collectionName, b.dataset.delete));
      load();
    }));
  }

  el(saveBtnId).addEventListener("click", async () => {
    const data = readForm();
    const id = idEl().value;
    const msg = el(msgElId);
    msg.style.color = "";
    msg.textContent = "Saving…";
    try {
      if (id) {
        await updateDoc(doc(db, collectionName, id), data);
      } else {
        await addDoc(collection(db, collectionName), data);
      }
      msg.textContent = "Saved.";
      setTimeout(() => msg.textContent = "", 2500);
      clearForm();
      load();
    } catch (err) {
      console.error(`Failed to save ${collectionName}:`, err);
      msg.style.color = "#ff8080";
      msg.textContent = `Save failed: ${err.message}`;
    }
  });

  return load;
}

// Education
const loadEducation = makeListCrud({
  collectionName: "education",
  formIdPrefix: "edu",
  listElId: "eduList",
  msgElId: "eduMsg",
  saveBtnId: "saveEdu",
  clearBtnId: "clearEduForm",
  fields: [
    { id: "eduDegree", key: "degree" },
    { id: "eduSchool", key: "school" },
    { id: "eduYears", key: "years" },
    { id: "eduOrder", key: "order", type: "number" }
  ],
  renderRow: d => `<strong>${d.degree || ""}</strong><p>${d.school || ""} ${d.years ? `· ${d.years}` : ""}</p>`
});

// Achievements
const loadAchievements = makeListCrud({
  collectionName: "achievements",
  formIdPrefix: "achv",
  listElId: "achvList",
  msgElId: "achvMsg",
  saveBtnId: "saveAchv",
  clearBtnId: "clearAchvForm",
  fields: [
    { id: "achvTitle", key: "title" },
    { id: "achvDescription", key: "description" },
    { id: "achvOrder", key: "order", type: "number" }
  ],
  renderRow: d => `<strong>${d.title || ""}</strong><p>${d.description || ""}</p>`
});

// Resume Projects (separate from the Portfolio "projects" collection)
const loadResumeProjects = makeListCrud({
  collectionName: "resume_projects",
  formIdPrefix: "rp",
  listElId: "rpList",
  msgElId: "rpMsg",
  saveBtnId: "saveRP",
  clearBtnId: "clearRPForm",
  fields: [
    { id: "rpTitle", key: "title" },
    { id: "rpYears", key: "years" },
    { id: "rpBullets", key: "bullets", type: "lines" },
    { id: "rpOrder", key: "order", type: "number" }
  ],
  renderRow: d => `<strong>${d.title || ""}</strong><p>${d.years || ""}</p>`
});

// Training / Short Courses
const loadTraining = makeListCrud({
  collectionName: "training",
  formIdPrefix: "train",
  listElId: "trainList",
  msgElId: "trainMsg",
  saveBtnId: "saveTrain",
  clearBtnId: "clearTrainForm",
  fields: [
    { id: "trainTitle", key: "title" },
    { id: "trainProvider", key: "provider" },
    { id: "trainYears", key: "years" },
    { id: "trainLink", key: "link" },
    { id: "trainOrder", key: "order", type: "number" }
  ],
  renderRow: d => `<strong>${d.title || ""}</strong><p>${d.provider || ""} ${d.years ? `· ${d.years}` : ""}</p>`
});

// Certifications
const loadCertifications = makeListCrud({
  collectionName: "certifications",
  formIdPrefix: "cert",
  listElId: "certList",
  msgElId: "certMsg",
  saveBtnId: "saveCert",
  clearBtnId: "clearCertForm",
  fields: [
    { id: "certTitle", key: "title" },
    { id: "certOrg", key: "org" },
    { id: "certDate", key: "date" },
    { id: "certDescription", key: "description" },
    { id: "certOrder", key: "order", type: "number" }
  ],
  renderRow: d => `<strong>${d.title || ""}</strong><p>${d.org || ""} ${d.date ? `· ${d.date}` : ""}</p>`
});
