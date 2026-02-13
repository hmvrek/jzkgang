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
const programyLayout = document.getElementById("programy-layout");
const accordionTriggers = document.querySelectorAll(".accordion-trigger");

// ---- DOM Elements (Search) ----
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
const searchResultsInner = document.getElementById("search-results-inner");

// Category display names
const categoryNames = {
  programy: "Programy",
  crosshair: "Crosshair X",
  fpsboost: "FPS Boost",
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
    // Hide programy layout
    programyLayout.classList.add("hidden");
  } else if (category === "programy") {
    // Show accordion-based programy view with plugins sidebar
    heroSection.style.display = "none";
    categoriesView.classList.add("hidden");
    projectsGrid.classList.add("hidden");
    emptyState.classList.add("hidden");

    // Show subcategory header
    subcategoryHeader.classList.remove("hidden");
    subcategoryTitle.textContent = categoryNames[category] || category;
    subcategoryHeader.style.animation = "none";
    subcategoryHeader.offsetHeight;
    subcategoryHeader.style.animation = "fadeInUp 0.5s ease-out both";

    // Show programy layout (accordions + plugins sidebar)
    programyLayout.classList.remove("hidden");
    programyLayout.style.animation = "none";
    programyLayout.offsetHeight;
    programyLayout.style.animation = "fadeInUp 0.6s ease-out both";
  } else {
    // Show filtered projects (non-programy categories)
    heroSection.style.display = "none";
    categoriesView.classList.add("hidden");
    projectsGrid.classList.remove("hidden");
    programyLayout.classList.add("hidden");
    
    // Show subcategory header with title
    subcategoryHeader.classList.remove("hidden");
    subcategoryTitle.textContent = categoryNames[category] || category;
    subcategoryHeader.style.animation = "none";
    subcategoryHeader.offsetHeight;
    subcategoryHeader.style.animation = "fadeInUp 0.5s ease-out both";

    // Only count/show non-accordion project cards
    const standaloneCards = projectsGrid.querySelectorAll(".project-card");
    let visibleCount = 0;
    standaloneCards.forEach((card) => {
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
    standaloneCards.forEach((card) => {
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

// Accordion toggle handlers
accordionTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const accordion = trigger.closest(".app-accordion");
    const isOpen = accordion.classList.contains("open");
    
    // Toggle this accordion
    if (isOpen) {
      accordion.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    } else {
      accordion.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
    }
  });
});

// Initialize: show home view, hide projects grid and programy layout
projectsGrid.classList.add("hidden");
programyLayout.classList.add("hidden");

// ==========================================================
// SEARCH FUNCTIONALITY
// ==========================================================

// Build searchable items index
const searchableItems = [];

// Index accordion items (programs)
document.querySelectorAll(".app-accordion").forEach((accordion) => {
  const appName = accordion.querySelector(".accordion-info h3")?.textContent || "";
  accordion.querySelectorAll(".accordion-cards-grid .project-card").forEach((card) => {
    const title = card.querySelector(".card-header h2")?.textContent || "";
    const badge = card.querySelector(".card-badge")?.textContent || "";
    const desc = card.querySelector("p")?.textContent || "";
    searchableItems.push({
      title,
      badge,
      category: "Programy",
      searchText: `${appName} ${title} ${badge} ${desc}`.toLowerCase(),
      action: () => {
        showView("programy");
        accordion.classList.add("open");
        accordion.querySelector(".accordion-trigger")?.setAttribute("aria-expanded", "true");
        setTimeout(() => {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          card.style.animation = "none";
          card.offsetHeight;
          card.style.animation = "borderGlow 1.5s ease-in-out";
        }, 400);
      },
    });
  });
});

// Index standalone project cards (crosshair, fpsboost)
document.querySelectorAll("#projects-grid .project-card").forEach((card) => {
  const title = card.querySelector(".card-header h2")?.textContent || "";
  const badge = card.querySelector(".card-badge")?.textContent || "";
  const desc = card.querySelector("p")?.textContent || "";
  const cat = card.dataset.category;
  searchableItems.push({
    title,
    badge,
    category: categoryNames[cat] || cat,
    searchText: `${title} ${badge} ${desc} ${categoryNames[cat] || cat}`.toLowerCase(),
    action: () => {
      showView(cat);
      setTimeout(() => {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    },
  });
});

// Index plugin cards
document.querySelectorAll(".plugin-card").forEach((card) => {
  const title = card.querySelector("h4")?.textContent || "";
  const desc = card.querySelector(".plugin-info p")?.textContent || "";
  const searchable = card.dataset.searchable || "";
  searchableItems.push({
    title,
    badge: "PLUGIN",
    category: "Pluginy",
    searchText: `${title} ${desc} ${searchable} pluginy`.toLowerCase(),
    action: () => {
      showView("programy");
      setTimeout(() => {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.style.animation = "none";
        card.offsetHeight;
        card.style.animation = "borderGlow 1.5s ease-in-out";
      }, 400);
    },
  });
});

// Helper: highlight matched text
function highlightMatch(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text.slice(0, idx) + '<mark class="search-highlight">' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length);
}

// Search input handler
searchInput.addEventListener("input", () => {
  const queryText = searchInput.value.trim().toLowerCase();
  if (!queryText) {
    searchResults.classList.add("hidden");
    return;
  }

  const matches = searchableItems.filter((item) => item.searchText.includes(queryText));

  if (matches.length === 0) {
    searchResultsInner.innerHTML = `
      <div class="search-no-results">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.4;margin-bottom:8px;">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>Brak wynikow dla "${searchInput.value.trim()}"</span>
      </div>`;
  } else {
    searchResultsInner.innerHTML = `
      <div class="search-results-header">
        <span class="search-results-label">Wyniki</span>
        <span class="search-results-count">${matches.length} ${matches.length === 1 ? 'wynik' : 'wynikow'}</span>
      </div>` + matches
      .slice(0, 10)
      .map(
        (item, i) =>
          `<div class="search-result-item" data-index="${i}">
            <div class="search-result-icon">${item.badge.slice(0, 2)}</div>
            <div class="search-result-info">
              <h4>${highlightMatch(item.title, queryText)}</h4>
              <span>${item.category}</span>
            </div>
            <span class="search-result-badge">${item.badge}</span>
          </div>`
      )
      .join("");

    // Add click handlers
    const filteredMatches = matches.slice(0, 10);
    searchResultsInner.querySelectorAll(".search-result-item").forEach((el, i) => {
      el.addEventListener("click", () => {
        filteredMatches[i].action();
        searchInput.value = "";
        searchResults.classList.add("hidden");
      });
    });
  }

  searchResults.classList.remove("hidden");
});

// Close search on click outside
document.addEventListener("click", (e) => {
  if (!searchResults.contains(e.target) && e.target !== searchInput) {
    searchResults.classList.add("hidden");
  }
});

// Keyboard navigation for search results
let activeSearchIndex = -1;

function updateActiveSearchItem() {
  const items = searchResultsInner.querySelectorAll(".search-result-item");
  items.forEach((item, i) => {
    if (i === activeSearchIndex) {
      item.classList.add("search-result-active");
      item.scrollIntoView({ block: "nearest" });
    } else {
      item.classList.remove("search-result-active");
    }
  });
}

searchInput.addEventListener("keydown", (e) => {
  const items = searchResultsInner.querySelectorAll(".search-result-item");
  if (!items.length || searchResults.classList.contains("hidden")) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeSearchIndex = Math.min(activeSearchIndex + 1, items.length - 1);
    updateActiveSearchItem();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeSearchIndex = Math.max(activeSearchIndex - 1, 0);
    updateActiveSearchItem();
  } else if (e.key === "Enter" && activeSearchIndex >= 0) {
    e.preventDefault();
    items[activeSearchIndex].click();
    activeSearchIndex = -1;
  }
});

// Reset active index on new search
searchInput.addEventListener("input", () => { activeSearchIndex = -1; });

// Close search on Escape, open on Ctrl+K
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    searchResults.classList.add("hidden");
    searchInput.blur();
    activeSearchIndex = -1;
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    searchInput.focus();
  }
});
