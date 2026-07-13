import { app } from "./firebase.js";
import {
  getAuth, signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const auth = getAuth(app);
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
    await signInWithEmailAndPassword(auth, email, password);
    msg.textContent = "Signed in — redirecting…";
    setTimeout(() => window.location.href = "blog.html", 500);
  } catch (err) {
    msg.textContent = friendlyError(err.code);
  }
});
