/* ==========================================================
   SCRIPT.JS — Firebase Firestore key verification
   ==========================================================
   
   HOW TO SET UP:
   1. Create a Firebase project at https://console.firebase.google.com
   2. Enable Cloud Firestore
   3. Create a collection called "access_keys"
   4. Add documents with these fields:
      - key       (string)  — the actual access code
      - used      (boolean) — set to false
      - createdAt (timestamp)
      - expiresAt (timestamp) — e.g. 10-30 minutes after createdAt
   5. Paste your Firebase config below in the firebaseConfig object
   
   ========================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// =====================================================
// 🔧 PASTE YOUR FIREBASE CONFIG HERE
// =====================================================
const firebaseConfig = {
  apiKey: "AIzaSyCIPG8gfd4hK9duC0OMdz3Vne7Wt24zLbc",
  authDomain: "moje-klucze-590a0.firebaseapp.com",
  projectId: "moje-klucze-590a0",
  storageBucket: "moje-klucze-590a0.firebasestorage.app",
  messagingSenderId: "849084899566",
  appId: "1:849084899566:web:f9577bba4cc22b964dd3ff",
  measurementId: "G-SH8L4EN5PG"
};
// =====================================================

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---- DOM Elements ----
const gate = document.getElementById("access-gate");
const mainContent = document.getElementById("main-content");
const form = document.getElementById("key-form");
const keyInput = document.getElementById("key-input");
const unlockBtn = document.getElementById("unlock-btn");
const btnText = document.getElementById("btn-text");
const btnSpinner = document.getElementById("btn-spinner");
const errorMsg = document.getElementById("error-msg");
const welcomeFlash = document.getElementById("welcome-flash");

// ---- Form Submit Handler ----
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const enteredKey = keyInput.value.trim();

  if (!enteredKey) {
    showError("Please enter an access key.");
    return;
  }

  // Show loading state
  setLoading(true);
  hideError();

  try {
    // Query Firestore for the entered key
    const keysRef = collection(db, "access_keys");
    const q = query(keysRef, where("key", "==", enteredKey));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      showError("Invalid access key. Please try again.");
      setLoading(false);
      return;
    }

    // Get the first matching document
    const keyDoc = snapshot.docs[0];
    const keyData = keyDoc.data();

    // Check if already used
    if (keyData.used === true) {
      showError("This key has already been used.");
      setLoading(false);
      return;
    }

    // Check if expired
    const now = Timestamp.now();
    if (keyData.expiresAt && keyData.expiresAt.toMillis() < now.toMillis()) {
      showError("This key has expired. Please request a new one.");
      setLoading(false);
      return;
    }

    // ---- KEY IS VALID ----
    // Mark the key as used
    const keyDocRef = doc(db, "access_keys", keyDoc.id);
    await updateDoc(keyDocRef, {
      used: true,
      usedAt: serverTimestamp(),
    });

    // Optionally delete the document entirely (uncomment the line below):
    // await deleteDoc(keyDocRef);

    // Unlock the content
    unlockContent();
  } catch (error) {
    console.error("Firestore error:", error);
    showError("Connection error. Please try again later.");
    setLoading(false);
  }
});

// ---- Unlock Content ----
function unlockContent() {
  // Hide the gate
  gate.style.transition = "opacity 0.4s ease, transform 0.4s ease";
  gate.style.opacity = "0";
  gate.style.transform = "scale(0.97)";

  setTimeout(() => {
    gate.classList.add("hidden");
    mainContent.classList.remove("hidden");

    // Show welcome flash, then hide it
    setTimeout(() => {
      welcomeFlash.style.display = "none";
    }, 1400);
  }, 400);
}

// ---- UI Helpers ----
function setLoading(isLoading) {
  unlockBtn.disabled = isLoading;
  keyInput.disabled = isLoading;

  if (isLoading) {
    btnText.classList.add("hidden");
    btnSpinner.classList.remove("hidden");
  } else {
    btnText.classList.remove("hidden");
    btnSpinner.classList.add("hidden");
  }
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
  keyInput.classList.add("error");

  // Remove error styling after animation
  setTimeout(() => {
    keyInput.classList.remove("error");
  }, 600);
}

function hideError() {
  errorMsg.classList.add("hidden");
  keyInput.classList.remove("error");
}
