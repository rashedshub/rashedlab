import { app } from "./firebase.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);
const params = new URLSearchParams(window.location.search);
const projectId = params.get("id");

let galleryImages = [];
let currentIndex = 0;

function escapeHtml(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Supports **bold**, __bold__, *italic*, _italic_ — everything else is
// HTML-escaped first, so this can never introduce real markup/scripts,
// only the two safe inline styles below.
function renderFormattedText(raw) {
  let out = escapeHtml(raw);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__(.+?)__/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*(?!\*)([^*]+?)\*(?!\*)/g, "$1<em>$2</em>");
  out = out.replace(/(^|[^_])_(?!_)([^_]+?)_(?!_)/g, "$1<em>$2</em>");
  return out;
}

if (!projectId) {
  document.getElementById("pdTitle").textContent = "Project not found";
} else {
  loadProject();
}

async function loadProject() {
  const snap = await getDoc(doc(db, "projects", projectId));
  if (!snap.exists()) {
    document.getElementById("pdTitle").textContent = "Project not found";
    return;
  }
  const p = snap.data();

  document.title = `${p.title || "Project"} — Md. Rashedul Haque`;
  document.getElementById("pdTitle").textContent = p.title || "Untitled";
  document.getElementById("pdDescription").innerHTML = renderFormattedText(p.description || "");

  if (p.image) {
    const hero = document.getElementById("pdHeroImg");
    hero.src = p.image;
    hero.alt = p.title || "";
    hero.style.display = "block";
  }

  if (p.link) {
    const linkEl = document.getElementById("pdLink");
    linkEl.href = p.link;
    linkEl.style.display = "inline-block";
  }

  // Gallery = cover image + any additional images, deduplicated
  galleryImages = [p.image, ...(p.gallery || [])].filter(Boolean)
    .filter((url, i, arr) => arr.indexOf(url) === i);

  if (galleryImages.length) {
    document.getElementById("pdGallerySection").style.display = "block";
    const grid = document.getElementById("pdGalleryGrid");
    grid.innerHTML = galleryImages.map((url, i) => `
      <img src="${url}" alt="${p.title || ''} photo ${i + 1}" data-index="${i}" loading="lazy">
    `).join("");
    grid.querySelectorAll("img").forEach(img => {
      img.addEventListener("click", () => openLightbox(Number(img.dataset.index)));
    });
  }
}

const lightbox = document.getElementById("galLightbox");
const lightboxImg = document.getElementById("galLightboxImg");

function openLightbox(index) {
  currentIndex = index;
  lightboxImg.src = galleryImages[currentIndex];
  lightbox.classList.add("open");
}
function closeLightbox() { lightbox.classList.remove("open"); }
function showNext() { currentIndex = (currentIndex + 1) % galleryImages.length; lightboxImg.src = galleryImages[currentIndex]; }
function showPrev() { currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length; lightboxImg.src = galleryImages[currentIndex]; }

document.getElementById("galClose").addEventListener("click", closeLightbox);
document.getElementById("galNext").addEventListener("click", showNext);
document.getElementById("galPrev").addEventListener("click", showPrev);
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") showNext();
  if (e.key === "ArrowLeft") showPrev();
});
