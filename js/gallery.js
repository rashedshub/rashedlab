import { app } from "./firebase.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);
let images = [];
let currentIndex = 0;

(async () => {
  const grid = document.getElementById("galleryGrid");
  try {
    const snap = await getDocs(query(collection(db, "gallery"), orderBy("order", "asc")));
    images = snap.docs.map(d => d.data()).filter(img => img.imageUrl);
  } catch (err) {
    console.error("Failed to load gallery:", err);
  }

  if (!images.length) {
    grid.innerHTML = `<p class="gal-empty">No photos added yet — check back soon.</p>`;
    return;
  }

  grid.innerHTML = images.map((img, i) => `
    <div class="gal-item" data-index="${i}">
      <img src="${img.imageUrl}" alt="${img.caption || 'Gallery photo'}" loading="lazy">
      ${img.caption ? `<div class="gal-caption">${img.caption}</div>` : ""}
    </div>
  `).join("");

  grid.querySelectorAll(".gal-item").forEach(item => {
    item.addEventListener("click", () => openLightbox(Number(item.dataset.index)));
  });
})();

const lightbox = document.getElementById("galLightbox");
const lightboxImg = document.getElementById("galLightboxImg");
const lightboxCaption = document.getElementById("galLightboxCaption");

function openLightbox(index) {
  currentIndex = index;
  updateLightbox();
  lightbox.classList.add("open");
}

function closeLightbox() {
  lightbox.classList.remove("open");
}

function updateLightbox() {
  const img = images[currentIndex];
  lightboxImg.src = img.imageUrl;
  lightboxImg.alt = img.caption || "";
  lightboxCaption.textContent = img.caption || "";
}

function showNext() {
  currentIndex = (currentIndex + 1) % images.length;
  updateLightbox();
}

function showPrev() {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  updateLightbox();
}

document.getElementById("galClose").addEventListener("click", closeLightbox);
document.getElementById("galNext").addEventListener("click", showNext);
document.getElementById("galPrev").addEventListener("click", showPrev);

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") showNext();
  if (e.key === "ArrowLeft") showPrev();
});
