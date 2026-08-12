const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const eventsGrid = document.querySelector("[data-events-grid]");
const BUUKKAA_URL = "https://buukkaa-bandi.fi/fi/band/wallan-tuntemattomat";
const CORS_PROXY_URLS = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url) => url
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
  const headings = [...doc.querySelectorAll("h1, h2, h3, h4, h5, h6")];
  const upcomingHeading = headings.find((heading) => /Tulevat/i.test(heading.textContent.trim()));
  const upcomingList = findUpcomingList(upcomingHeading);

  if (!upcomingList) {
    const fallbackList = [...doc.querySelectorAll("ul, ol")].find((list) =>
      [...list.querySelectorAll("li")].some((item) => /\d{1,2}\.\d{1,2}\.\d{4}/.test(item.textContent))
    );

    if (!fallbackList) {
      throw new Error("Could not find upcoming gigs section.");
    }

    return parseEventList(fallbackList);
  }

  return parseEventList(upcomingList);
}

function findUpcomingList(heading) {
  if (!heading) {
    return null;
  }

  let sibling = heading.nextElementSibling;
  while (sibling) {
    if (sibling.matches("ul, ol")) {
      return sibling;
    }
    sibling = sibling.nextElementSibling;
  }

  return heading.parentElement?.querySelector("ul, ol") || null;
}

function parseEventList(list) {
  return [...list.querySelectorAll("li")].map((item) => {
    const text = item.textContent
      .replace(/\s+/g, " ")
      .replace(/\s+,/g, ",")
      .replace(/,\s*/g, ", ")
      .replace(/, $/, "")
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

function isLocalFileContext() {
  try {
    return location.protocol === 'file:' || location.origin === 'null' || !location.origin;
  } catch (e) {
    return false;
  }
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = 12000; // 12s timeout per request
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { cache: "no-store", mode: "cors", signal: controller.signal });
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.text();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}
function verifyFetchedHtml(html) {
  if (!html || typeof html !== "string") return false;
  if (/Tulevat/i.test(html)) return true;
  if (/\d{1,2}\.\d{1,2}\.\d{4}/.test(html)) return true;
  return false;
}

async function fetchBuukkaaHtml() {
  let lastError = null;

  for (const buildProxyUrl of CORS_PROXY_URLS) {
    const proxyUrl = buildProxyUrl(BUUKKAA_URL);
    try {
      console.info(`Fetching gigs via: ${proxyUrl}`);
      const html = await fetchText(proxyUrl);

      if (verifyFetchedHtml(html)) {
        console.info(`Successfully fetched gig HTML from: ${proxyUrl}`);
        return html;
      }

      console.warn(`Fetched HTML from ${proxyUrl} did not contain expected gig data.`);
    } catch (error) {
      lastError = error;
      console.warn(`Failed to fetch upcoming gigs from proxy: ${proxyUrl}`, error);
    }
  }

  throw lastError || new Error("Unable to fetch gigs from any proxy.");
}

async function loadEvents() {
  if (isLocalFileContext()) {
    console.warn('Page loaded from file:// (Origin null). Browsers block cross-origin requests from this context. Serve the site via a local HTTP server (e.g. `python3 -m http.server`) to enable live fetching. Using static event fallback.');
    return;
  }

  try {
    const html = await fetchBuukkaaHtml();
    renderEvents(parseEventsFromHtml(html));
  } catch (error) {
    console.info("Using static event fallback.", error);
  }
}

async function loadCachedEventsFirst() {
  try {
    const res = await fetch('data/events.json', { cache: 'no-store' });
    if (res.ok) {
      const events = await res.json();
      if (Array.isArray(events) && events.length > 0) {
        eventsGrid && (eventsGrid.dataset.eventsSource = 'cached');
        return renderEvents(events);
      }
    }
  } catch (e) {
    // ignore and fallback to live fetch
  }

  await loadEvents();
}

loadCachedEventsFirst();
