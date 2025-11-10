const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const navToggle = document.querySelector(".nav__toggle");
const navMenu = document.getElementById("nav-menu");
const scrollTopBtn = document.getElementById("scroll-top");
const entryForm = document.getElementById("entry-form");
const entryList = document.getElementById("entry-list");
const moodText = document.getElementById("mood-text");
const moodThumb = document.getElementById("mood-thumb");
const yearEl = document.getElementById("year");
const timelineSlider = document.getElementById("timeline-slider");
const timelineButtons = document.querySelectorAll(".timeline__btn");

const STORAGE_KEY = "daily-moments-entries";

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Failed to parse entries", error);
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function renderEntries(entries) {
  entryList.innerHTML = "";
  if (!entries.length) {
    entryList.innerHTML = `<p class="empty">まだ記録がありません。最初の一歩を書き留めてみましょう。</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  entries
    .slice()
    .reverse()
    .forEach((entry) => {
      const card = document.createElement("article");
      card.className = "entry-card";
      card.innerHTML = `
        <h3>${entry.title}</h3>
        <div class="entry-card__meta">
          <span>${entry.moodLabel}</span>
          <span>${formatDate(new Date(entry.createdAt))}</span>
        </div>
        <p>${entry.content}</p>
      `;
      fragment.appendChild(card);
    });

  entryList.appendChild(fragment);
}

function getMoodLabel(value) {
  switch (value) {
    case "happy":
      return "😊 ハッピー";
    case "calm":
      return "😌 落ち着いている";
    case "tired":
      return "😴 ちょっと疲れた";
    case "excited":
      return "🤩 ワクワク";
    case "grateful":
      return "🙏 感謝でいっぱい";
    default:
      return value;
  }
}

function updateTheme(isDark) {
  root.classList.toggle("dark", isDark);
  themeToggle.setAttribute("aria-pressed", isDark);
  themeToggle.textContent = isDark ? "☀" : "🌙";
  localStorage.setItem("daily-moments-theme", isDark ? "dark" : "light");
}

function animateMood() {
  const now = Date.now();
  const cycle = 120000; // 2 minutes cycle
  const progress = (now % cycle) / cycle;
  const percentage = progress * 100;
  moodThumb.style.left = `${percentage}%`;

  const moods = ["晴れやか", "穏やか", "ワクワク", "ゆったり", "感謝" ];
  const moodIndex = Math.floor(progress * moods.length) % moods.length;
  moodText.textContent = moods[moodIndex];
  requestAnimationFrame(animateMood);
}

function setupTimeline() {
  let currentIndex = 0;
  const items = Array.from(timelineSlider.children);

  function updateSlider(direction) {
    if (direction === "next") {
      currentIndex = (currentIndex + 1) % items.length;
    } else {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
    }
    const offset = currentIndex * (items[0].offsetWidth + 24);
    timelineSlider.scrollTo({ left: offset, behavior: "smooth" });
  }

  timelineButtons.forEach((button) => {
    button.addEventListener("click", () => {
      updateSlider(button.dataset.direction);
    });
  });
}

function setupScrollTop() {
  const toggleVisibility = () => {
    if (window.scrollY > 240) {
      scrollTopBtn.classList.add("scroll-top--visible");
    } else {
      scrollTopBtn.classList.remove("scroll-top--visible");
    }
  };

  window.addEventListener("scroll", toggleVisibility);
  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function setupNavigation() {
  navToggle?.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", !expanded);
    navMenu.classList.toggle("nav__menu--open");
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("nav__menu--open");
      navToggle?.setAttribute("aria-expanded", "false");
    });
  });
}

function setupTheme() {
  const savedTheme = localStorage.getItem("daily-moments-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = savedTheme ? savedTheme === "dark" : prefersDark;
  updateTheme(isDark);

  themeToggle.addEventListener("click", () => {
    const currentlyDark = root.classList.contains("dark");
    updateTheme(!currentlyDark);
  });
}

function setupEntries() {
  let entries = loadEntries();
  renderEntries(entries);

  entryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(entryForm);
    const title = formData.get("title").toString().trim();
    const content = formData.get("content").toString().trim();
    const mood = formData.get("mood").toString();

    if (!title || !content) {
      return;
    }

    const newEntry = {
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      content,
      mood,
      moodLabel: getMoodLabel(mood),
      createdAt: new Date().toISOString(),
    };

    entries = [...entries, newEntry];
    saveEntries(entries);
    renderEntries(entries);
    entryForm.reset();
  });
}

function init() {
  yearEl.textContent = new Date().getFullYear();
  setupTheme();
  setupNavigation();
  setupScrollTop();
  setupTimeline();
  setupEntries();
  animateMood();
}

document.addEventListener("DOMContentLoaded", init);
