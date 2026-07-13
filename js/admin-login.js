import { app } from "./firebase.js";
import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const form = document.getElementById("loginForm");
const msg = document.getElementById("loginMsg");

function friendlyError(code) {
  const map = {
    "auth/invalid-email": "That email address isn't valid.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password. Try again.",
    "auth/invalid-credential": "Incorrect email or password. Try again.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment."
  };
  return map[code] || "Something went wrong. Please try again.";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  msg.textContent = "";

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    const role = snap.exists() ? snap.data().role : null;

    if (role !== "admin") {
      msg.textContent = "This account doesn't have admin access.";
      await auth.signOut();
      return;
    }

    msg.textContent = "Signed in — redirecting…";
    setTimeout(() => window.location.href = "admin-editor.html", 500);
  } catch (err) {
    msg.textContent = friendlyError(err.code);
  }
});
