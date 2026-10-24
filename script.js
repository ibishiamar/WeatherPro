const apiKey = '18ca2d6753b3d722b0be4aa1c965cdca';

// --- RUAJTJA E SIGURT (localStorage mund të jetë i bllokuar) ---
const store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* injoro */ } }
};

// --- SISTEMI I PËRKTHIMIT ---
let currentLang = store.get('weatherLang', 'sq');
let unit = store.get('weatherUnit', 'C');

const translations = {
  sq: {
    pageTitle: "Parashikimi i Motit",
    headerTitle: "Parashikimi i Motit",
    splashText: "Duke zbuluar lokacionin tuaj...",
    loadingText: "Duke u lidhur me satelitin...",
    placeholder: "Shkruani emrin e qytetit",
    searchBtn: "Kërko",
    forecastTitle: "Parashikimi 5-Ditor",
    hourlyTitle: "Parashikimi sipas orëve",
    footerCopy: "© <span id='year'></span> Parashikimi i Motit. Të gjitha të drejtat e rezervuara.",
    homeLink: "Kthehu në Faqen Kryesore",
    humidity: "Lagështia",
    desc: "Përshkrimi",
    wind: "Era",
    feelsLike: "Ndjehet si",
    sunrise: "Lindja",
    sunset: "Perëndimi",
    pressure: "Presioni",
    visibility: "Dukshmëria",
    clouds: "Retë",
    uv: "Indeksi UV",
    precip: "Gjasat për reshje",
    updated: "Përditësuar",
    refresh: "Rifresko",
    retry: "Provo përsëri",
    recent: "Kërkimet e fundit",
    errorCity: "Nuk u gjet qyteti. Kontrolloni emrin dhe provoni përsëri.",
    errorAPI: "Gabim gjatë marrjes së të dhënave. Provoni përsëri pas pak.",
    errorNetwork: "Nuk ka lidhje me internetin. Kontrolloni lidhjen dhe provoni përsëri.",
    errorLocation: "Lokacioni nuk u zbulua. Kërkoni një qytet më sipër ose provoni përsëri."
  },
  en: {
    pageTitle: "Weather Forecast",
    headerTitle: "Weather Forecast",
    splashText: "Detecting your location...",
    loadingText: "Connecting to satellite...",
    placeholder: "Enter city name",
    searchBtn: "Search",
    forecastTitle: "5-Day Forecast",
    hourlyTitle: "Hourly Forecast",
    footerCopy: "© <span id='year'></span> Weather Forecast. All rights reserved.",
    homeLink: "Back to Home Page",
    humidity: "Humidity",
    desc: "Description",
    wind: "Wind",
    feelsLike: "Feels like",
    sunrise: "Sunrise",
    sunset: "Sunset",
    pressure: "Pressure",
    visibility: "Visibility",
    clouds: "Cloud cover",
    uv: "UV index",
    precip: "Chance of rain",
    updated: "Updated",
    refresh: "Refresh",
    retry: "Try again",
    recent: "Recent searches",
    errorCity: "City not found. Check the name and try again.",
    errorAPI: "Error fetching data. Please try again shortly.",
    errorNetwork: "No internet connection. Check your connection and try again.",
    errorLocation: "Couldn't detect your location. Search for a city above or try again."
  }
};

function applyTranslations() {
  const t = translations[currentLang];

  document.documentElement.lang = currentLang;
  document.getElementById('page-title').innerText = t.pageTitle;
  document.getElementById('header-title').innerText = t.headerTitle;
  document.getElementById('splash-text').innerText = t.splashText;
  document.getElementById('loading-text').innerText = t.loadingText;
  document.getElementById('cityInput').placeholder = t.placeholder;
  document.getElementById('cityInput').setAttribute('aria-label', t.placeholder);
  document.getElementById('search-btn').innerHTML = `${t.searchBtn} <i class="fas fa-search"></i>`;
  document.getElementById('forecast-title').innerText = t.forecastTitle;
  document.getElementById('hourly-title').innerText = t.hourlyTitle;
  document.getElementById('footer-copy').innerHTML = t.footerCopy;
  document.getElementById('home-link').innerHTML = `<i class="fas fa-home"></i> ${t.homeLink}`;
  document.getElementById('refreshBtn').setAttribute('aria-label', t.refresh);
  document.getElementById('refreshBtn').title = t.refresh;
  document.getElementById('retryBtn').textContent = t.retry;

  document.getElementById('year').textContent = new Date().getFullYear();
}
applyTranslations();

// --- ELEMENTET ---
const form = document.getElementById('weatherForm');
const cityInput = document.getElementById('cityInput');
const weatherResult = document.getElementById('weatherResult');
const cityName = document.getElementById('cityName');
const currentDateTime = document.getElementById('currentDateTime');
const temperature = document.getElementById('temperature');
const humidity = document.getElementById('humidity');
const description = document.getElementById('description');
const weatherIcon = document.getElementById('weatherIcon');
const windSpeed = document.getElementById('wind-speed');
const feelsLike = document.getElementById('feels-like');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const pressureEl = document.getElementById('pressure');
const visibilityEl = document.getElementById('visibility');
const cloudsEl = document.getElementById('clouds');
const uvEl = document.getElementById('uv-index');
const precipEl = document.getElementById('precip');

const forecastContainer = document.getElementById('forecastContainer');
const forecastList = document.getElementById('forecastList');
const hourlyContainer = document.getElementById('hourlyContainer');
const hourlyList = document.getElementById('hourlyList');
const myLocationBtn = document.getElementById('myLocationBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const suggestionsList = document.getElementById('suggestionsList');
const errorBanner = document.getElementById('errorBanner');
const errorText = document.getElementById('errorText');
const retryBtn = document.getElementById('retryBtn');
const refreshBtn = document.getElementById('refreshBtn');
const updatedAtEl = document.getElementById('updatedAt');
const unitC = document.getElementById('unitC');
const unitF = document.getElementById('unitF');
const recentEl = document.getElementById('recentSearches');

let debounceTimer;
let state = null;      // të dhënat e fundit të ngarkuara
let retryFn = null;    // veprimi i butonit "Provo përsëri"

// --- EKRANI I MIRËSEARDHJES: mbyllet kur të dhënat janë gati ---
const splash = document.getElementById('splash-screen');
const splashStart = Date.now();
let splashDone = false;

function finishSplash() {
  if (splashDone) return;
  splashDone = true;
  const wait = Math.max(0, 1500 - (Date.now() - splashStart));
  setTimeout(() => {
    splash.classList.add('hidden');
    setTimeout(() => { splash.style.display = 'none'; }, 800);
  }, wait);
}
setTimeout(finishSplash, 7000); // rrjeti i sigurisë

// --- NJËSITË ---
const toF = c => c * 9 / 5 + 32;
const fmtTemp = c => unit === 'C' ? `${Math.round(c)}°C` : `${Math.round(toF(c))}°F`;
const fmtShort = c => `${Math.round(unit === 'C' ? c : toF(c))}°`;
const fmtWind = ms => unit === 'C' ? `${ms} m/s` : `${(ms * 2.237).toFixed(1)} mph`;
const fmtVis = m => unit === 'C' ? `${(m / 1000).toFixed(1)} km` : `${(m / 1609.34).toFixed(1)} mi`;

// --- GJENDJET: loading / gabim ---
function showLoading() {
  hideError();
  weatherResult.style.display = 'none';
  forecastContainer.style.display = 'none';
  hourlyContainer.style.display = 'none';
  suggestionsList.style.display = 'none';
  form.style.display = 'none';
  loadingIndicator.style.display = 'flex';
}

function hideLoading() {
  loadingIndicator.style.display = 'none';
  form.style.display = 'flex';
}

function hideError() {
  errorBanner.style.display = 'none';
  retryFn = null;
}

function showError(message, retry) {
  loadingIndicator.style.display = 'none';
  form.style.display = 'flex';
  errorText.textContent = message;
  retryFn = retry || null;
  retryBtn.style.display = retry ? 'inline-flex' : 'none';
  errorBanner.style.display = 'flex';
  renderRecent();
  finishSplash();
}

function errorMessage(err) {
  const t = translations[currentLang];
  if (!navigator.onLine || err instanceof TypeError) return t.errorNetwork;
  return t.errorAPI;
}

retryBtn.addEventListener('click', () => { if (retryFn) retryFn(); });

// --- LOKACIONI ---
window.addEventListener('load', () => {
  loadingIndicator.style.display = 'flex';
  getUserLocation();
});

function getUserLocation() {
  showLoading();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => loadWeather(position.coords.latitude, position.coords.longitude),
      () => getLocationByIP(),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  } else {
    getLocationByIP();
  }
}

function getLocationByIP() {
  fetch('https://ipapi.co/json/')
    .then(response => response.json())
    .then(data => {
      if (data.latitude && data.longitude) {
        loadWeather(data.latitude, data.longitude);
      } else {
        throw new Error('no-location');
      }
    })
    .catch(() => showError(translations[currentLang].errorLocation, getUserLocation));
}

myLocationBtn.addEventListener('click', () => {
  cityInput.value = '';
  getUserLocation();
});

// --- KËRKIMI ---
cityInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  const query = e.target.value.trim();

  if (query.length < 2) {
    suggestionsList.style.display = 'none';
    return;
  }
  debounceTimer = setTimeout(() => fetchSuggestions(query), 500);
});

function fetchSuggestions(query) {
  const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;

  fetch(geoUrl)
    .then(res => res.json())
    .then(locations => {
      suggestionsList.innerHTML = '';
      if (Array.isArray(locations) && locations.length > 0) {
        locations.forEach(loc => {
          const li = document.createElement('li');
          const stateInfo = loc.state ? `, ${loc.state}` : '';
          li.textContent = `${loc.name}${stateInfo}, ${loc.country}`;

          li.addEventListener('click', () => {
            cityInput.value = `${loc.name}${stateInfo}`;
            suggestionsList.style.display = 'none';
            loadWeather(loc.lat, loc.lon);
          });
          suggestionsList.appendChild(li);
        });
        suggestionsList.style.display = 'block';
      } else {
        suggestionsList.style.display = 'none';
      }
    })
    .catch(() => { suggestionsList.style.display = 'none'; });
}

document.addEventListener('click', (e) => {
  if (!form.contains(e.target)) suggestionsList.style.display = 'none';
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  suggestionsList.style.display = 'none';
  const city = cityInput.value.trim();
  if (city) searchCity(city);
});

function searchCity(city) {
  showLoading();
  const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`;

  fetchJson(geoUrl)
    .then((locations) => {
      if (!Array.isArray(locations) || locations.length === 0) {
        showError(translations[currentLang].errorCity);
        return;
      }
      loadWeather(locations[0].lat, locations[0].lon);
    })
    .catch((err) => showError(errorMessage(err), () => searchCity(city)));
}

// --- NGARKIMI I TË DHËNAVE ---
function fetchJson(url) {
  return fetch(url).then(res => {
    if (!res.ok) throw new Error('api');
    return res.json();
  });
}

function loadWeather(lat, lon) {
  showLoading();
  const q = `lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=${currentLang}`;

  Promise.all([
    fetchJson(`https://api.openweathermap.org/data/2.5/weather?${q}`),
    fetchJson(`https://api.openweathermap.org/data/2.5/forecast?${q}`),
    // Indeksi UV (nuk kërkon çelës); nëse dështon, thjesht shfaqet "—"
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=uv_index`)
      .then(r => r.ok ? r.json() : null)
      .then(j => (j && j.current && typeof j.current.uv_index === 'number') ? j.current.uv_index : null)
      .catch(() => null)
  ])
  .then(([current, forecast, uv]) => {
    state = { lat, lon, current, forecast, uv, updated: new Date() };
    rememberCity(current, lat, lon);
    renderAll();
    hideLoading();
    finishSplash();
  })
  .catch((err) => showError(errorMessage(err), () => loadWeather(lat, lon)));
}

// --- RENDER ---
function renderAll() {
  if (!state) return;
  showWeather(state.current, state.forecast, state.uv);
  showForecast(state.forecast);
  showHourly(state.forecast);
  setUpdated();
  updateUnitButtons();
  renderRecent();
}

function placeName(data) {
  let country = data.sys.country;
  if (country === 'XK') country = currentLang === 'sq' ? 'Kosovë' : 'Kosovo';
  if (country === 'RS' && (data.name === 'Pristina' || data.name === 'Prishtina')) country = currentLang === 'sq' ? 'Kosovë' : 'Kosovo';

  let city = data.name;
  if (city === 'Pristina' || city === 'Priština') city = 'Prishtina';
  return { city, country };
}

// Koha në vendndodhjen e qytetit (jo në zonën e përdoruesit)
const shifted = (ts, tz) => new Date((ts + tz) * 1000);
const fmtClock = (ts, tz, locale) => shifted(ts, tz).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

function setInfo(el, icon, label, value) {
  el.innerHTML = `<i class="fas ${icon}"></i> ${label}: ${value}`;
}

function showWeather(data, forecast, uv) {
  const t = translations[currentLang];
  const locale = currentLang === 'sq' ? 'sq-AL' : 'en-US';
  const tz = data.timezone || 0;
  const { city, country } = placeName(data);

  const nowShifted = shifted(Math.floor(Date.now() / 1000), tz);
  currentDateTime.textContent = nowShifted.toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
  });

  cityName.textContent = `${city}, ${country}`;
  temperature.textContent = fmtTemp(data.main.temp);

  setInfo(humidity, 'fa-droplet', t.humidity, `${data.main.humidity}%`);
  description.textContent = `${t.desc}: ${data.weather[0].description}`;
  setInfo(windSpeed, 'fa-wind', t.wind, fmtWind(data.wind.speed));
  setInfo(feelsLike, 'fa-temperature-half', t.feelsLike, fmtTemp(data.main.feels_like));

  sunriseEl.innerHTML = `<i class="fas fa-sun" style="color:#f39c12"></i> ${t.sunrise}: ${fmtClock(data.sys.sunrise, tz, locale)}`;
  sunsetEl.innerHTML = `<i class="fas fa-moon" style="color:#e67e22"></i> ${t.sunset}: ${fmtClock(data.sys.sunset, tz, locale)}`;

  setInfo(pressureEl, 'fa-gauge-high', t.pressure, `${data.main.pressure} hPa`);
  setInfo(visibilityEl, 'fa-eye', t.visibility, data.visibility != null ? fmtVis(data.visibility) : '—');
  setInfo(cloudsEl, 'fa-cloud', t.clouds, `${data.clouds ? data.clouds.all : 0}%`);
  setInfo(uvEl, 'fa-sun', t.uv, uv != null ? uv.toFixed(1) : '—');
  const pop = forecast.list && forecast.list[0] ? Math.round((forecast.list[0].pop || 0) * 100) : 0;
  setInfo(precipEl, 'fa-umbrella', t.precip, `${pop}%`);

  changeBackground(data.weather[0].main.toLowerCase(), nowShifted.getUTCHours());

  switch (data.weather[0].main.toLowerCase()) {
    case 'clear': weatherIcon.src = 'img/icon/clear.png'; break;
    case 'clouds': weatherIcon.src = 'img/icon/cloud.png'; break;
    case 'mist': case 'smoke': case 'haze': case 'dust': case 'fog': case 'sand': case 'ash': case 'squall': case 'tornado':
      weatherIcon.src = 'img/icon/mist.png'; break;
    case 'rain': case 'drizzle': weatherIcon.src = 'img/icon/rain.png'; break;
    case 'snow': weatherIcon.src = 'img/icon/snow.png'; break;
    case 'thunderstorm': weatherIcon.src = 'img/icon/thunderstorm.png'; break;
    default: weatherIcon.src = 'img/icon/unknown.png';
  }

  weatherResult.style.display = 'block';
}

function changeBackground(condition, hour) {
  const body = document.getElementById('app-body');
  body.className = '';
  const isNight = hour < 6 || hour > 19;

  if (isNight) body.classList.add('bg-night');
  else if (condition.includes('clear')) body.classList.add('bg-sunny');
  else if (condition.includes('cloud')) body.classList.add('bg-cloudy');
  else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) body.classList.add('bg-rainy');
  else if (condition.includes('snow')) body.classList.add('bg-snowy');
  else body.classList.add('bg-sunny');
}

// Parashikimi 5-ditor me min/max për çdo ditë
function showForecast(data) {
  forecastList.innerHTML = '';
  const locale = currentLang === 'sq' ? 'sq-AL' : 'en-US';
  const tz = data.city.timezone || 0;
  const days = {};

  data.list.forEach(item => {
    const key = shifted(item.dt, tz).toISOString().slice(0, 10);
    (days[key] = days[key] || []).push(item);
  });

  Object.keys(days).slice(0, 5).forEach(key => {
    const items = days[key];
    const min = Math.min(...items.map(i => i.main.temp_min));
    const max = Math.max(...items.map(i => i.main.temp_max));
    const mid = items.reduce((best, i) =>
      Math.abs(shifted(i.dt, tz).getUTCHours() - 12) < Math.abs(shifted(best.dt, tz).getUTCHours() - 12) ? i : best);

    const dayName = shifted(mid.dt, tz).toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' });
    const iconUrl = `https://openweathermap.org/img/wn/${mid.weather[0].icon}@2x.png`;

    const el = document.createElement('div');
    el.className = 'forecast-item';
    el.innerHTML = `
      <div class="day-name">${dayName}</div>
      <img src="${iconUrl}" alt="${mid.weather[0].description}" class="forecast-icon">
      <div class="forecast-temp"><span class="t-max">${fmtShort(max)}</span><span class="t-min">${fmtShort(min)}</span></div>
    `;
    forecastList.appendChild(el);
  });

  forecastContainer.style.display = 'block';
}

// Parashikimi sipas orëve (24 orët e ardhshme, hap 3-orësh)
function showHourly(data) {
  hourlyList.innerHTML = '';
  const locale = currentLang === 'sq' ? 'sq-AL' : 'en-US';
  const tz = data.city.timezone || 0;

  data.list.slice(0, 8).forEach(item => {
    const pop = Math.round((item.pop || 0) * 100);
    const el = document.createElement('div');
    el.className = 'hourly-item';
    el.innerHTML = `
      <span class="hourly-time">${fmtClock(item.dt, tz, locale)}</span>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${item.weather[0].description}" class="hourly-icon">
      <span class="hourly-temp">${fmtShort(item.main.temp)}</span>
      <span class="hourly-pop">${pop > 0 ? `<i class="fas fa-droplet"></i> ${pop}%` : '&nbsp;'}</span>
    `;
    hourlyList.appendChild(el);
  });

  hourlyContainer.style.display = 'block';
}

// --- "PËRDITËSUAR" DHE REFRESH ---
function setUpdated() {
  const locale = currentLang === 'sq' ? 'sq-AL' : 'en-US';
  const time = state.updated.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  updatedAtEl.textContent = `${translations[currentLang].updated}: ${time}`;
}

refreshBtn.addEventListener('click', () => {
  if (state) loadWeather(state.lat, state.lon);
});

// --- °C / °F ---
function updateUnitButtons() {
  unitC.classList.toggle('active', unit === 'C');
  unitF.classList.toggle('active', unit === 'F');
  unitC.setAttribute('aria-pressed', unit === 'C');
  unitF.setAttribute('aria-pressed', unit === 'F');
}

function setUnit(next) {
  unit = next;
  store.set('weatherUnit', next);
  if (state) renderAll(); else updateUnitButtons();
}
unitC.addEventListener('click', () => setUnit('C'));
unitF.addEventListener('click', () => setUnit('F'));

// --- KËRKIMET E FUNDIT ---
function getRecent() {
  try { return JSON.parse(store.get('weatherRecent', '[]')) || []; } catch (e) { return []; }
}

function rememberCity(data, lat, lon) {
  const { city, country } = placeName(data);
  const name = `${city}, ${country}`;
  const list = getRecent().filter(c => c.name !== name);
  list.unshift({ name, lat, lon });
  store.set('weatherRecent', JSON.stringify(list.slice(0, 5)));
}

function renderRecent() {
  const list = getRecent();
  recentEl.innerHTML = '';
  if (list.length === 0) { recentEl.style.display = 'none'; return; }

  list.forEach(c => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'recent-chip';
    chip.textContent = c.name;
    chip.addEventListener('click', () => {
      cityInput.value = '';
      loadWeather(c.lat, c.lon);
    });
    recentEl.appendChild(chip);
  });
  recentEl.setAttribute('aria-label', translations[currentLang].recent);
  recentEl.style.display = 'flex';
}