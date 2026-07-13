import { app } from "./firebase.js";
import {
  getAuth, createUserWithEmailAndPassword, updateProfile
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const form = document.getElementById("signupForm");
const msg = document.getElementById("signupMsg");

function friendlyError(code) {
  const map = {
    "auth/email-already-in-use": "That email is already registered — try logging in instead.",
    "auth/invalid-email": "That email address isn't valid.",
    "auth/weak-password": "Password should be at least 6 characters."
  };
  return map[code] || "Something went wrong. Please try again.";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  msg.textContent = "";

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, "users", cred.user.uid), {
      name, email, role: "user", createdAt: Date.now()
    });
    msg.textContent = "Account created — redirecting…";
    setTimeout(() => window.location.href = "blog.html", 600);
  } catch (err) {
    msg.textContent = friendlyError(err.code);
  }
});
