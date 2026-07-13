import { app } from "./firebase.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  const nav = document.getElementById("authNav");
  if (!nav) return;
  if (user) {
    const displayName = user.displayName || user.email.split("@")[0];
    nav.innerHTML = `<span style="color:var(--muted);">Hi, ${displayName}</span> <a href="#" id="logoutLink">Logout</a>`;
    document.getElementById("logoutLink").addEventListener("click", (e) => {
      e.preventDefault();
      signOut(auth);
    });
  } else {
    nav.innerHTML = `<a href="login.html">Login</a>`;
  }
});
