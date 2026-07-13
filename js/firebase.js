import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyDgtmi661JgRmwF7BZu_8d5MKfR6EAvjlU",
  authDomain: "rashedlab.firebaseapp.com",
  projectId: "rashedlab",
  storageBucket: "rashedlab.firebasestorage.app",
  messagingSenderId: "535845908209",
  appId: "1:535845908209:web:52b14354881649904e0350"
};

const app =
initializeApp(firebaseConfig);

export { app };
