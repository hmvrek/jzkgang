/* ==========================================================
   SCRIPT.JS — Firebase Firestore key verification + Category nav
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
// PASTE YOUR FIREBASE CONFIG HERE
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

// ---- DOM Elements (Access Gate) ----
const gate = document.getElementById("access-gate");
const mainContent = document.getElementById("main-content");
const form = document.getElementById("key-form");
const keyInput = document.getElementById("key-input");
const unlockBtn = document.getElementById("unlock-btn");
const btnText = document.getElementById("btn-text");
const btnSpinner = document.getElementById("btn-spinner");
const errorMsg = document.getElementById("error-msg");
const welcomeFlash = document.getElementById("welcome-flash");

// ---- DOM Elements (Category Navigation) ----
const navBtns = document.querySelectorAll(".nav-btn");
const categoriesView = document.getElementById("categories-view");
const projectsGrid = document.getElementById("projects-grid");
const heroSection = document.getElementById("hero-section");
const emptyState = document.getElementById("empty-state");
const categoryCards = document.querySelectorAll(".category-card");
const projectCards = document.querySelectorAll(".project-card");
const subcategoryHeader = document.getElementById("subcategory-header");
const subcategoryTitle = document.getElementById("subcategory-title");
const backBtn = document.getElementById("back-btn");

// Category display names
const categoryNames = {
  programy: "Programy",
  crosshair: "Crosshair X",
  fpsboost: "FPS Boost",
  pluginy: "Pluginy",
};

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

  setTimeout(() => {
    keyInput.classList.remove("error");
  }, 600);
}

function hideError() {
  errorMsg.classList.add("hidden");
  keyInput.classList.remove("error");
}

// ==========================================================
// CATEGORY NAVIGATION
// ==========================================================

let currentCategory = "all";

function showView(category) {
  currentCategory = category;

  // Update nav buttons
  navBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.category === category);
  });

  if (category === "all") {
    // Show home view: hero + category cards, hide projects grid
    heroSection.style.display = "";
    categoriesView.classList.remove("hidden");
    projectsGrid.classList.add("hidden");
    emptyState.classList.add("hidden");
    subcategoryHeader.classList.add("hidden");
  } else {
    // Show filtered projects
    heroSection.style.display = "none";
    categoriesView.classList.add("hidden");
    projectsGrid.classList.remove("hidden");
    
    // Show subcategory header with title
    subcategoryHeader.classList.remove("hidden");
    subcategoryTitle.textContent = categoryNames[category] || category;
    subcategoryHeader.style.animation = "none";
    subcategoryHeader.offsetHeight;
    subcategoryHeader.style.animation = "fadeInUp 0.5s ease-out both";

    let visibleCount = 0;
    projectCards.forEach((card) => {
      if (card.dataset.category === category) {
        card.classList.remove("hidden");
        visibleCount++;
      } else {
        card.classList.add("hidden");
      }
    });

    // Show/hide empty state
    if (visibleCount === 0) {
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
    }

    // Re-trigger staggered animation
    let delay = 0.1;
    projectCards.forEach((card) => {
      if (!card.classList.contains("hidden")) {
        card.style.animation = "none";
        card.offsetHeight; // force reflow
        card.style.animation = `cardReveal 0.6s ease-out ${delay}s both`;
        delay += 0.05;
      }
    });
  }
}

// Nav button clicks
navBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    showView(btn.dataset.category);
  });
});

// Category card clicks (home view)
categoryCards.forEach((card) => {
  card.addEventListener("click", () => {
    showView(card.dataset.target);
  });
});

// Back button click
backBtn.addEventListener("click", () => {
  showView("all");
});

// Initialize: show home view, hide projects grid
projectsGrid.classList.add("hidden");
