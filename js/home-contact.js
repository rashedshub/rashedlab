import { app } from "./firebase.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);
const form = document.getElementById("contactForm");
if (form) {
  const msg = document.getElementById("contactMsg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();

    msg.textContent = "Sending…";
    try {
      await addDoc(collection(db, "contact_messages"), {
        name, email, subject, message, createdAt: Date.now()
      });
      msg.textContent = "Thanks — your message has been sent!";
      form.reset();
    } catch (err) {
      console.error("Failed to send message:", err);
      msg.textContent = "Something went wrong. Please try again.";
    }
  });
}
