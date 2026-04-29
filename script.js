const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const eventsGrid = document.querySelector("[data-events-grid]");
const BUUKKAA_URL = "https://buukkaa-bandi.fi/fi/band/wallan-tuntemattomat";
const CORS_PROXY_URLS = [
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
];

function syncHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 18);
}

navToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEvents(events) {
  if (!eventsGrid || !Array.isArray(events) || events.length === 0) {
    return;
  }

  eventsGrid.dataset.eventsSource = "live";
  eventsGrid.innerHTML = events
    .map(
      (event) => `
        <article class="event">
          <time datetime="${escapeHtml(event.date)}">${escapeHtml(event.displayDate)}</time>
          <h3>${escapeHtml(event.city)}</h3>
          <p>${escapeHtml(event.venue)}</p>
        </article>
      `
    )
    .join("");
}

function parseFinnishDate(value) {
  const match = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) {
    throw new Error(`Unexpected date format: ${value}`);
  }

  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeVenue(value) {
  if (!value || value.toLowerCase() === "yksityistilaisuus") {
    return "Yksityistilaisuus";
  }

  return value;
}

function parseEventsFromHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const headings = [...doc.querySelectorAll(".gig-calendar h3")];
  const upcomingHeading = headings.find((heading) => heading.textContent.trim().startsWith("Tulevat"));
  const upcomingList = upcomingHeading?.nextElementSibling;

  if (!upcomingList) {
    throw new Error("Could not find upcoming gigs section.");
  }

  return [...upcomingList.querySelectorAll("li")].map((item) => {
    const text = item.textContent
      .replace(/\s+/g, " ")
      .replace(/\s+,/g, ",")
      .replace(/,\s*/g, ", ")
      .trim();
    const [dateText, ...restParts] = text.split(",");
    const rest = restParts.join(",").trim();
    const [city, ...venueParts] = rest.split(",").map((part) => part.trim()).filter(Boolean);

    return {
      date: parseFinnishDate(dateText.trim()),
      displayDate: dateText.trim(),
      city: city || "",
      venue: normalizeVenue(venueParts.join(", "))
    };
  });
}

async function fetchText(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.text();
}

async function fetchBuukkaaHtml() {
  let lastError;

  for (const buildProxyUrl of CORS_PROXY_URLS) {
    try {
      const separator = buildProxyUrl(BUUKKAA_URL).includes("?") ? "&" : "?";
      return await fetchText(`${buildProxyUrl(BUUKKAA_URL)}${separator}_=${Date.now()}`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function loadEvents() {
  try {
    const html = await fetchBuukkaaHtml();
    renderEvents(parseEventsFromHtml(html));
  } catch (error) {
    console.info("Using static event fallback.", error);
  }
}

loadEvents();
