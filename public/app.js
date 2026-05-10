const state = {
  token: localStorage.getItem("flightTrackerToken") || "",
  user: JSON.parse(localStorage.getItem("flightTrackerUser") || "null"),
  authMode: "login",
  lastHitIds: new Set(JSON.parse(localStorage.getItem("flightTrackerHits") || "[]")),
  pollTimer: null,
  lastSearchInput: null,
  lastOffers: [],
  selectedOfferIndex: 0
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
const alertModal = document.querySelector("#alertModal");
const alertModalForm = document.querySelector("#alertModalForm");
const alertModalText = document.querySelector("#alertModalText");
const cancelAlertModal = document.querySelector("#cancelAlertModal");
const detailsModal = document.querySelector("#detailsModal");
const detailsModalText = document.querySelector("#detailsModalText");
const closeDetailsModal = document.querySelector("#closeDetailsModal");
const paymentModal = document.querySelector("#paymentModal");
const paymentForm = document.querySelector("#paymentForm");
const paymentSummary = document.querySelector("#paymentSummary");
const cancelPayment = document.querySelector("#cancelPayment");
const bookingModal = document.querySelector("#bookingModal");
const bookingText = document.querySelector("#bookingText");
const closeBookingModal = document.querySelector("#closeBookingModal");
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

function resolveAirportCode(value) {
  const text = String(value || "").trim();
  const query = text.toLowerCase();
  if (/^[a-z]{3}$/i.test(text)) {
    return text.toUpperCase();
  }

  const exact = AIRPORTS.find((airport) => {
    return [airport.city, airport.name, `${airport.code} - ${airport.city}`].some((item) => item.toLowerCase() === query);
  });

  if (exact) {
    return exact.code;
  }

  const match = AIRPORTS.find((airport) => airportMatches(airport, query));
  return match ? match.code : text.toUpperCase();
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
    input.addEventListener("blur", () => window.setTimeout(() => list.classList.add("hidden"), 220));

    list.addEventListener("pointerdown", (event) => {
      const option = event.target.closest("[data-code]");
      if (!option) {
        return;
      }

      event.preventDefault();
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
    origin: resolveAirportCode(data.get("origin")),
    destination: resolveAirportCode(data.get("destination")),
    departureDate: data.get("departureDate"),
    returnDate: data.get("returnDate"),
    adults: Number(data.get("adults") || 1),
    currency: "INR"
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

function offerLabel(offer, index) {
  return `Flight ${index + 1}: ${segmentText(offer)} - ${money(offer.price, offer.currency)}`;
}

function selectedOffer() {
  return state.lastOffers[state.selectedOfferIndex] || null;
}

function offerDetailsHtml(offer) {
  if (!offer) {
    return `<div class="empty">Choose a flight first.</div>`;
  }

  const itineraries = offer.itineraries || [];
  const legs = itineraries
    .map((itinerary, legIndex) => {
      const title = legIndex === 0 ? "Outbound" : "Return";
      const segments = (itinerary.segments || [])
        .map((segment) => {
          return `<li>${segment.from} to ${segment.to} • ${segment.departAt || "Time unavailable"} • ${segment.carrier || ""}${segment.flightNumber || ""}</li>`;
        })
        .join("");

      return `
        <div class="leg-block">
          <strong>${title} • ${itinerary.duration || "Duration unavailable"}</strong>
          <ul>${segments || "<li>Segment details unavailable</li>"}</ul>
        </div>
      `;
    })
    .join("");

  return `
    <div class="card-top">
      <div>
        <div class="route">${segmentText(offer)}</div>
        <div class="meta">${offer.oneWay ? "One-way" : "Round-trip"} • INR pricing</div>
      </div>
      <div class="price">${money(offer.price, offer.currency)}</div>
    </div>
    ${legs}
  `;
}

function renderOffers(offers) {
  state.lastOffers = offers;
  state.selectedOfferIndex = 0;

  if (!offers.length) {
    resultsList.innerHTML = `<div class="empty">No offers found for that route.</div>`;
    return;
  }

  resultsList.innerHTML = `
    <label class="offer-picker">
      Select flight
      <select id="offerSelect">
        ${offers.map((offer, index) => `<option value="${index}">${offerLabel(offer, index)}</option>`).join("")}
      </select>
    </label>
    <article class="result-card" id="selectedOfferCard">
      ${offerDetailsHtml(offers[0])}
    </article>
    <div class="flight-actions">
      <button class="primary-button" type="button" data-result-action="buy">Buy</button>
      <button class="secondary-button" type="button" data-result-action="details">View details</button>
      <button class="ghost-button" type="button" data-result-action="alert">Target price alert</button>
    </div>
  `;
}

function updateSelectedOffer(index) {
  state.selectedOfferIndex = Number(index || 0);
  const card = document.querySelector("#selectedOfferCard");
  if (card) {
    card.innerHTML = offerDetailsHtml(selectedOffer());
  }
}

function openAlertModal() {
  const offer = selectedOffer();
  if (!offer || !state.lastSearchInput) {
    showToast("Choose a flight first.");
    return;
  }

  alertModalText.textContent = `${state.lastSearchInput.origin} to ${state.lastSearchInput.destination} is currently ${money(offer.price, offer.currency)}. Enter the INR price you want to wait for.`;
  alertModalForm.elements.targetPrice.value = offer.price ? Math.floor(offer.price * 0.9) : "";
  alertModal.classList.remove("hidden");
  alertModalForm.elements.targetPrice.focus();
}

function closeAlertModal() {
  alertModal.classList.add("hidden");
  alertModalForm.reset();
}

function openDetailsModal() {
  const offer = selectedOffer();
  if (!offer) {
    showToast("Choose a flight first.");
    return;
  }

  detailsModalText.innerHTML = offerDetailsHtml(offer);
  detailsModal.classList.remove("hidden");
}

function openPaymentModal() {
  const offer = selectedOffer();
  if (!offer || !state.lastSearchInput) {
    showToast("Choose a flight first.");
    return;
  }

  paymentSummary.textContent = `${state.lastSearchInput.origin} to ${state.lastSearchInput.destination} • ${money(offer.price, offer.currency)} • Demo payment`;
  paymentForm.elements.email.value = state.user?.email || "";
  paymentModal.classList.remove("hidden");
  paymentForm.elements.passengerName.focus();
}

function closePaymentModal() {
  paymentModal.classList.add("hidden");
  paymentForm.reset();
}

function cleanDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function bookingReference() {
  return `FTT-${Date.now().toString(36).toUpperCase().slice(-5)}-${Math.random().toString(36).toUpperCase().slice(2, 6)}`;
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

flightForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  flightMessage.textContent = "Searching live fares...";
  resultsList.innerHTML = "";
  try {
    state.lastSearchInput = formInput();
    const payload = await api("/api/flights/search", {
      method: "POST",
      body: JSON.stringify(state.lastSearchInput)
    });
    renderOffers(payload.offers);
    flightMessage.textContent = "";
  } catch (error) {
    flightMessage.textContent = error.message;
  }
});

resultsList.addEventListener("change", (event) => {
  if (event.target.id === "offerSelect") {
    updateSelectedOffer(event.target.value);
  }
});

resultsList.addEventListener("click", (event) => {
  const action = event.target.dataset.resultAction;
  if (!action) {
    return;
  }

  if (action === "buy") {
    openPaymentModal();
  }

  if (action === "details") {
    openDetailsModal();
  }

  if (action === "alert") {
    openAlertModal();
  }
});

alertModalForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const offer = selectedOffer();
  const targetPrice = Number(new FormData(alertModalForm).get("targetPrice"));

  if (!offer || !state.lastSearchInput) {
    showToast("Search and choose a flight first.");
    return;
  }

  try {
    await api("/api/alerts", {
      method: "POST",
      body: JSON.stringify({ ...state.lastSearchInput, targetPrice })
    });
    showToast("Price alert saved.");
    closeAlertModal();
    await loadAlerts();
  } catch (error) {
    showToast(error.message);
  }
});

cancelAlertModal.addEventListener("click", closeAlertModal);
alertModal.addEventListener("click", (event) => {
  if (event.target === alertModal) {
    closeAlertModal();
  }
});

closeDetailsModal.addEventListener("click", () => detailsModal.classList.add("hidden"));
detailsModal.addEventListener("click", (event) => {
  if (event.target === detailsModal) {
    detailsModal.classList.add("hidden");
  }
});

paymentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(paymentForm);
  const offer = selectedOffer();
  const cardNumber = cleanDigits(formData.get("cardNumber"));
  const cvv = cleanDigits(formData.get("cvv"));
  const expiry = String(formData.get("expiry") || "").trim();

  if (!offer || !state.lastSearchInput) {
    showToast("Choose a flight first.");
    return;
  }

  if (cardNumber.length < 12 || cardNumber.length > 19) {
    showToast("Enter a valid demo card number.");
    return;
  }

  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    showToast("Use expiry format MM/YY.");
    return;
  }

  if (cvv.length < 3) {
    showToast("Enter a valid demo CVV.");
    return;
  }

  const reference = bookingReference();
  closePaymentModal();
  bookingText.textContent = `Demo booking ${reference} confirmed for ${formData.get("passengerName")} on ${state.lastSearchInput.origin} to ${state.lastSearchInput.destination}. Amount: ${money(offer.price, offer.currency)}.`;
  bookingModal.classList.remove("hidden");
});

cancelPayment.addEventListener("click", closePaymentModal);
paymentModal.addEventListener("click", (event) => {
  if (event.target === paymentModal) {
    closePaymentModal();
  }
});

closeBookingModal.addEventListener("click", () => bookingModal.classList.add("hidden"));
bookingModal.addEventListener("click", (event) => {
  if (event.target === bookingModal) {
    bookingModal.classList.add("hidden");
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
