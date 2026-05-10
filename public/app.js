const state = {
  token: localStorage.getItem("flightTrackerToken") || "",
  user: JSON.parse(localStorage.getItem("flightTrackerUser") || "null"),
  authMode: "login",
  lastHitIds: new Set(JSON.parse(localStorage.getItem("flightTrackerHits") || "[]")),
  pollTimer: null
};

const AIRPORTS = [
  { code: "DEL", city: "Delhi", name: "Indira Gandhi International Airport", country: "India" },
  { code: "DXB", city: "Dubai", name: "Dubai International Airport", country: "United Arab Emirates" },
  { code: "DOH", city: "Doha", name: "Hamad International Airport", country: "Qatar" },
  { code: "DAC", city: "Dhaka", name: "Hazrat Shahjalal International Airport", country: "Bangladesh" },
  { code: "DPS", city: "Denpasar", name: "Ngurah Rai International Airport", country: "Indonesia" },
  { code: "DFW", city: "Dallas", name: "Dallas Fort Worth International Airport", country: "United States" },
  { code: "DEN", city: "Denver", name: "Denver International Airport", country: "United States" },
  { code: "DTW", city: "Detroit", name: "Detroit Metropolitan Airport", country: "United States" },
  { code: "DUB", city: "Dublin", name: "Dublin Airport", country: "Ireland" },
  { code: "DUS", city: "Dusseldorf", name: "Dusseldorf Airport", country: "Germany" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj International Airport", country: "India" },
  { code: "BLR", city: "Bengaluru", name: "Kempegowda International Airport", country: "India" },
  { code: "MAA", city: "Chennai", name: "Chennai International Airport", country: "India" },
  { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi International Airport", country: "India" },
  { code: "CCU", city: "Kolkata", name: "Netaji Subhas Chandra Bose International Airport", country: "India" },
  { code: "COK", city: "Kochi", name: "Cochin International Airport", country: "India" },
  { code: "GOI", city: "Goa", name: "Dabolim Airport", country: "India" },
  { code: "AMD", city: "Ahmedabad", name: "Sardar Vallabhbhai Patel International Airport", country: "India" },
  { code: "PNQ", city: "Pune", name: "Pune Airport", country: "India" },
  { code: "JAI", city: "Jaipur", name: "Jaipur International Airport", country: "India" },
  { code: "LHR", city: "London", name: "Heathrow Airport", country: "United Kingdom" },
  { code: "LGW", city: "London", name: "Gatwick Airport", country: "United Kingdom" },
  { code: "JFK", city: "New York", name: "John F. Kennedy International Airport", country: "United States" },
  { code: "EWR", city: "Newark", name: "Newark Liberty International Airport", country: "United States" },
  { code: "LAX", city: "Los Angeles", name: "Los Angeles International Airport", country: "United States" },
  { code: "SFO", city: "San Francisco", name: "San Francisco International Airport", country: "United States" },
  { code: "ORD", city: "Chicago", name: "O'Hare International Airport", country: "United States" },
  { code: "ATL", city: "Atlanta", name: "Hartsfield-Jackson Atlanta International Airport", country: "United States" },
  { code: "SIN", city: "Singapore", name: "Singapore Changi Airport", country: "Singapore" },
  { code: "KUL", city: "Kuala Lumpur", name: "Kuala Lumpur International Airport", country: "Malaysia" },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi Airport", country: "Thailand" },
  { code: "HKG", city: "Hong Kong", name: "Hong Kong International Airport", country: "Hong Kong" },
  { code: "NRT", city: "Tokyo", name: "Narita International Airport", country: "Japan" },
  { code: "HND", city: "Tokyo", name: "Haneda Airport", country: "Japan" },
  { code: "SYD", city: "Sydney", name: "Sydney Kingsford Smith Airport", country: "Australia" },
  { code: "MEL", city: "Melbourne", name: "Melbourne Airport", country: "Australia" },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle Airport", country: "France" },
  { code: "FRA", city: "Frankfurt", name: "Frankfurt Airport", country: "Germany" },
  { code: "AMS", city: "Amsterdam", name: "Amsterdam Airport Schiphol", country: "Netherlands" },
  { code: "IST", city: "Istanbul", name: "Istanbul Airport", country: "Turkey" },
  { code: "RUH", city: "Riyadh", name: "King Khalid International Airport", country: "Saudi Arabia" },
  { code: "JED", city: "Jeddah", name: "King Abdulaziz International Airport", country: "Saudi Arabia" },
  { code: "AUH", city: "Abu Dhabi", name: "Zayed International Airport", country: "United Arab Emirates" },
  { code: "YYZ", city: "Toronto", name: "Toronto Pearson International Airport", country: "Canada" },
  { code: "YVR", city: "Vancouver", name: "Vancouver International Airport", country: "Canada" }
];

const authPanel = document.querySelector("#authPanel");
const dashboard = document.querySelector("#dashboard");
const authForm = document.querySelector("#authForm");
const authMessage = document.querySelector("#authMessage");
const showLogin = document.querySelector("#showLogin");
const showRegister = document.querySelector("#showRegister");
const nameWrap = document.querySelector("#nameWrap");
const authSubmit = document.querySelector("#authSubmit");
const welcomeTitle = document.querySelector("#welcomeTitle");
const logoutButton = document.querySelector("#logoutButton");
const notificationButton = document.querySelector("#notificationButton");
const flightForm = document.querySelector("#flightForm");
const flightMessage = document.querySelector("#flightMessage");
const searchButton = document.querySelector("#searchButton");
const checkNowButton = document.querySelector("#checkNowButton");
const resultsList = document.querySelector("#resultsList");
const alertsList = document.querySelector("#alertsList");
const alertCount = document.querySelector("#alertCount");
const lastCheck = document.querySelector("#lastCheck");
const toast = document.querySelector("#toast");
const hitModal = document.querySelector("#hitModal");
const hitModalText = document.querySelector("#hitModalText");
const closeModal = document.querySelector("#closeModal");

function setAuthMode(mode) {
  state.authMode = mode;
  showLogin.classList.toggle("active", mode === "login");
  showRegister.classList.toggle("active", mode === "register");
  nameWrap.classList.toggle("hidden", mode === "login");
  authSubmit.textContent = mode === "login" ? "Login" : "Create account";
  authMessage.textContent = "";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.setTimeout(() => toast.classList.add("hidden"), 3600);
}

function airportText(airport) {
  return `${airport.code} ${airport.city} ${airport.name} ${airport.country}`.toLowerCase();
}

function airportStartsWith(airport, query) {
  return [airport.code, airport.city, airport.name, airport.country].some((item) => item.toLowerCase().startsWith(query));
}

function airportMatches(airport, query) {
  return airportStartsWith(airport, query) || airportText(airport).includes(query);
}

function airportButton(airport) {
  return `
    <button class="airport-option" type="button" data-code="${airport.code}">
      <strong>${airport.code} - ${airport.city}</strong>
      <span>${airport.name}, ${airport.country}</span>
    </button>
  `;
}

function setupAirportSuggesters() {
  document.querySelectorAll("[data-airport-input]").forEach((input) => {
    const list = input.parentElement.querySelector("[data-airport-suggestions]");

    function renderSuggestions() {
      const query = input.value.trim().toLowerCase();
      if (!query) {
        list.classList.add("hidden");
        list.innerHTML = "";
        return;
      }

      const matches = AIRPORTS.filter((airport) => airportMatches(airport, query)).sort((a, b) => {
        const aStarts = airportStartsWith(a, query) ? 0 : 1;
        const bStarts = airportStartsWith(b, query) ? 0 : 1;
        return aStarts - bStarts || a.city.localeCompare(b.city);
      });

      if (!matches.length) {
        list.innerHTML = `<div class="empty">No airport found. Use a 3-letter airport code.</div>`;
        list.classList.remove("hidden");
        return;
      }

      list.innerHTML = matches.slice(0, 8).map(airportButton).join("");
      list.classList.remove("hidden");
    }

    input.addEventListener("input", renderSuggestions);
    input.addEventListener("focus", renderSuggestions);
    input.addEventListener("blur", () => {
      window.setTimeout(() => list.classList.add("hidden"), 160);
    });

    list.addEventListener("click", (event) => {
      const option = event.target.closest("[data-code]");
      if (!option) {
        return;
      }

      input.value = option.dataset.code;
      list.classList.add("hidden");
      input.focus();
    });
  });
}

function api(path, options = {}) {
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    }
  }).then(async (response) => {
    if (response.status === 204) {
      return null;
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "Something went wrong.");
    }
    return payload;
  });
}

function saveSession(payload) {
  state.token = payload.token;
  state.user = payload.user;
  localStorage.setItem("flightTrackerToken", state.token);
  localStorage.setItem("flightTrackerUser", JSON.stringify(state.user));
}

function clearSession() {
  state.token = "";
  state.user = null;
  localStorage.removeItem("flightTrackerToken");
  localStorage.removeItem("flightTrackerUser");
  if (state.pollTimer) {
    window.clearInterval(state.pollTimer);
  }
}

function renderShell() {
  const isLoggedIn = Boolean(state.token && state.user);
  authPanel.classList.toggle("hidden", isLoggedIn);
  dashboard.classList.toggle("hidden", !isLoggedIn);

  if (isLoggedIn) {
    welcomeTitle.textContent = `Welcome, ${state.user.name}`;
    loadAlerts();
    startPolling();
  }
}

function formInput() {
  const data = new FormData(flightForm);
  return {
    origin: String(data.get("origin") || "").toUpperCase(),
    destination: String(data.get("destination") || "").toUpperCase(),
    departureDate: data.get("departureDate"),
    returnDate: data.get("returnDate"),
    adults: Number(data.get("adults") || 1),
    currency: String(data.get("currency") || "USD").toUpperCase(),
    targetPrice: Number(data.get("targetPrice") || 0)
  };
}

function money(price, currency) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) {
    return "No price yet";
  }
  return `${currency} ${Number(price).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function segmentText(offer) {
  const first = offer.itineraries?.[0]?.segments?.[0];
  const final = offer.itineraries?.[0]?.segments?.at(-1);
  if (!first || !final) {
    return "Route details unavailable";
  }
  const stops = Math.max(0, offer.itineraries[0].segments.length - 1);
  return `${first.from} to ${final.to} • ${stops ? `${stops} stop${stops > 1 ? "s" : ""}` : "Nonstop"} • ${first.carrier}${first.flightNumber}`;
}

function renderOffers(offers) {
  if (!offers.length) {
    resultsList.innerHTML = `<div class="empty">No offers found for that route.</div>`;
    return;
  }

  resultsList.innerHTML = offers
    .map(
      (offer) => `
        <article class="result-card">
          <div class="card-top">
            <div>
              <div class="route">${segmentText(offer)}</div>
              <div class="meta">${offer.itineraries?.[0]?.duration || "Duration unavailable"} • ${offer.seats || "Some"} seats</div>
            </div>
            <div class="price">${money(offer.price, offer.currency)}</div>
          </div>
        </article>
      `
    )
    .join("");
}

function alertMarkup(alert) {
  const status = alert.active ? "Active" : "Paused";
  const hit = alert.lastPrice !== null && alert.lastPrice <= alert.targetPrice;
  return `
    <article class="alert-card">
      <div class="card-top">
        <div>
          <div class="route">${alert.origin} to ${alert.destination}</div>
          <div class="meta">
            Depart ${alert.departureDate}${alert.returnDate ? ` • Return ${alert.returnDate}` : ""}<br />
            Target ${money(alert.targetPrice, alert.currency)} • Last ${money(alert.lastPrice, alert.currency)}
          </div>
        </div>
        <div class="badge">${hit ? "Target hit" : status}</div>
      </div>
      <div class="card-actions">
        <button class="small-button" data-check="${alert._id || alert.id}">Check</button>
        <button class="small-button" data-toggle="${alert._id || alert.id}" data-active="${alert.active}">${alert.active ? "Pause" : "Resume"}</button>
        <button class="small-button danger" data-delete="${alert._id || alert.id}">Delete</button>
      </div>
    </article>
  `;
}

function renderAlerts(alerts) {
  alertCount.textContent = alerts.length;
  if (!alerts.length) {
    alertsList.innerHTML = `<div class="empty">No saved alerts yet. Create one from the search panel.</div>`;
    return;
  }
  alertsList.innerHTML = alerts.map(alertMarkup).join("");
}

async function loadAlerts() {
  try {
    const payload = await api("/api/alerts");
    renderAlerts(payload.alerts);
  } catch (error) {
    showToast(error.message);
  }
}

function rememberHit(id) {
  state.lastHitIds.add(id);
  localStorage.setItem("flightTrackerHits", JSON.stringify([...state.lastHitIds]));
}

function showPriceHit(result) {
  const text = `${result.origin} to ${result.destination} is now ${money(result.lastPrice, result.currency)}, at or below your ${money(result.targetPrice, result.currency)} target.`;
  hitModalText.textContent = text;
  hitModal.classList.remove("hidden");
  showToast(text);

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Target price hit", { body: text });
  }
}

async function checkAlerts() {
  try {
    const payload = await api("/api/alerts/check", { method: "POST" });
    const checkedAt = new Date();
    lastCheck.textContent = checkedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    renderAlerts(payload.results);

    payload.results
      .filter((result) => result.hitTarget && !state.lastHitIds.has(result.id))
      .forEach((result) => {
        rememberHit(result.id);
        showPriceHit(result);
      });
  } catch (error) {
    showToast(error.message);
  }
}

function startPolling() {
  if (state.pollTimer) {
    window.clearInterval(state.pollTimer);
  }
  state.pollTimer = window.setInterval(checkAlerts, 60000);
}

showLogin.addEventListener("click", () => setAuthMode("login"));
showRegister.addEventListener("click", () => setAuthMode("register"));

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authMessage.textContent = "";
  const data = new FormData(authForm);
  const body = {
    name: data.get("name"),
    email: data.get("email"),
    password: data.get("password")
  };

  try {
    const payload = await api(`/api/auth/${state.authMode}`, {
      method: "POST",
      body: JSON.stringify(body)
    });
    saveSession(payload);
    authForm.reset();
    renderShell();
  } catch (error) {
    authMessage.textContent = error.message;
  }
});

logoutButton.addEventListener("click", () => {
  clearSession();
  renderShell();
});

notificationButton.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    showToast("This browser does not support desktop notifications.");
    return;
  }
  const permission = await Notification.requestPermission();
  showToast(permission === "granted" ? "Pop-up notifications are enabled." : "Notifications were not enabled.");
});

searchButton.addEventListener("click", async () => {
  flightMessage.textContent = "Searching live fares...";
  resultsList.innerHTML = "";
  try {
    const payload = await api("/api/flights/search", {
      method: "POST",
      body: JSON.stringify(formInput())
    });
    renderOffers(payload.offers);
    flightMessage.textContent = "";
  } catch (error) {
    flightMessage.textContent = error.message;
  }
});

flightForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  flightMessage.textContent = "";
  try {
    await api("/api/alerts", {
      method: "POST",
      body: JSON.stringify(formInput())
    });
    showToast("Price alert saved.");
    await loadAlerts();
  } catch (error) {
    flightMessage.textContent = error.message;
  }
});

checkNowButton.addEventListener("click", checkAlerts);

alertsList.addEventListener("click", async (event) => {
  const checkId = event.target.dataset.check;
  const toggleId = event.target.dataset.toggle;
  const deleteId = event.target.dataset.delete;

  try {
    if (checkId) {
      await checkAlerts();
    }

    if (toggleId) {
      const active = event.target.dataset.active !== "true";
      await api(`/api/alerts/${toggleId}`, {
        method: "PATCH",
        body: JSON.stringify({ active })
      });
      await loadAlerts();
    }

    if (deleteId) {
      await api(`/api/alerts/${deleteId}`, { method: "DELETE" });
      await loadAlerts();
      showToast("Alert deleted.");
    }
  } catch (error) {
    showToast(error.message);
  }
});

closeModal.addEventListener("click", () => hitModal.classList.add("hidden"));
hitModal.addEventListener("click", (event) => {
  if (event.target === hitModal) {
    hitModal.classList.add("hidden");
  }
});

setAuthMode("login");
setupAirportSuggesters();
renderShell();
