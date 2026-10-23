const apiKey = '18ca2d6753b3d722b0be4aa1c965cdca'; 

// --- SISTEMI I PËRKTHIMIT ---
let currentLang = localStorage.getItem('weatherLang') || 'sq';

const translations = {
  sq: {
    pageTitle: "Parashikimi i Motit",
    headerTitle: "Parashikimi i Motit",
    splashText: "Duke zbuluar lokacionin tuaj...",
    loadingText: "Duke u lidhur me satelitin...",
    placeholder: "Shkruani emrin e qytetit",
    searchBtn: "Kërko",
    forecastTitle: "Parashikimi 5-Ditor",
    footerCopy: "© <span id='year'></span> Parashikimi i Motit. Të gjitha të drejtat e rezervuara.",
    homeLink: "Kthehu në Faqen Kryesore",
    humidity: "Lagështia",
    desc: "Përshkrimi",
    wind: "Era",
    feelsLike: "Ndjehet si",
    sunrise: "Lindja",
    sunset: "Perëndimi",
    errorCity: "Nuk u gjet qyteti. Ju lutem provoni përsëri!",
    errorAPI: "Gabim gjatë marrjes së të dhënave."
  },
  en: {
    pageTitle: "Weather Forecast",
    headerTitle: "Weather Forecast",
    splashText: "Detecting your location...",
    loadingText: "Connecting to satellite...",
    placeholder: "Enter city name",
    searchBtn: "Search",
    forecastTitle: "5-Day Forecast",
    footerCopy: "© <span id='year'></span> Weather Forecast. All rights reserved.",
    homeLink: "Back to Home Page",
    humidity: "Humidity",
    desc: "Description",
    wind: "Wind",
    feelsLike: "Feels like",
    sunrise: "Sunrise",
    sunset: "Sunset",
    errorCity: "City not found. Please try again!",
    errorAPI: "Error fetching data."
  }
};

// Funksioni që aplikon përkthimin në HTML
function applyTranslations() {
  const t = translations[currentLang];
  
  document.getElementById('page-title').innerText = t.pageTitle;
  document.getElementById('header-title').innerText = t.headerTitle;
  document.getElementById('splash-text').innerText = t.splashText;
  document.getElementById('loading-text').innerText = t.loadingText;
  document.getElementById('cityInput').placeholder = t.placeholder;
  document.getElementById('search-btn').innerHTML = `${t.searchBtn} <i class="fas fa-search"></i>`;
  document.getElementById('forecast-title').innerText = t.forecastTitle;
  document.getElementById('footer-copy').innerHTML = t.footerCopy;
  document.getElementById('home-link').innerHTML = `<i class="fas fa-home"></i> ${t.homeLink}`;
  
  // Përditësojmë vitin pasi u zëvendësua HTML-ja e footer-it
  document.getElementById('year').textContent = new Date().getFullYear();
}

// Aplikojmë përkthimin sapo të hapet faqja
applyTranslations();

// --- KODI I MOTIT ---
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

const forecastContainer = document.getElementById('forecastContainer');
const forecastList = document.getElementById('forecastList');
const myLocationBtn = document.getElementById('myLocationBtn');
const loadingIndicator = document.getElementById('loadingIndicator'); 
const suggestionsList = document.getElementById('suggestionsList');

let currentLocations = []; 
let debounceTimer;

window.addEventListener('load', () => {
  setTimeout(() => {
    if(document.getElementById('splash-screen').classList.contains('hidden')) {
        getUserLocation();
    }
  }, 3200); 
});

function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        getWeatherByCoords(lat, lon);
      },
      (error) => {
        getLocationByIP();
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  } else {
    getLocationByIP();
  }
}

myLocationBtn.addEventListener('click', () => {
  cityInput.value = '';
  suggestionsList.style.display = 'none';
  weatherResult.style.display = 'none';
  forecastContainer.style.display = 'none';
  if(loadingIndicator) loadingIndicator.style.display = 'flex';
  getUserLocation();
});

function getLocationByIP() {
  fetch('https://ipapi.co/json/')
    .then(response => response.json())
    .then(data => {
      if (data.city) {
        searchCity(data.city);
      } else {
        throw new Error(translations[currentLang].errorCity);
      }
    })
    .catch(error => {
      if(loadingIndicator) loadingIndicator.style.display = 'none';
      weatherResult.style.display = 'block';
      cityName.textContent = currentLang === 'sq' ? "Kërkoni një qytet..." : "Search a city...";
      form.style.display = 'flex'; 
    });
}

cityInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  const query = e.target.value.trim();
  
  if (query.length < 2) {
    suggestionsList.style.display = 'none';
    return;
  }

  debounceTimer = setTimeout(() => {
    fetchSuggestions(query);
  }, 500);
});

function fetchSuggestions(query) {
  const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;
  
  fetch(geoUrl)
    .then(res => res.json())
    .then(locations => {
      suggestionsList.innerHTML = '';
      if (locations.length > 0) {
        locations.forEach(loc => {
          const li = document.createElement('li');
          const stateInfo = loc.state ? `, ${loc.state}` : '';
          li.textContent = `${loc.name}${stateInfo}, ${loc.country}`;
          
          li.addEventListener('click', () => {
            cityInput.value = `${loc.name}${stateInfo}`;
            suggestionsList.style.display = 'none';
            getWeatherByCoords(loc.lat, loc.lon);
            form.style.display = 'none';
          });
          suggestionsList.appendChild(li);
        });
        suggestionsList.style.display = 'block';
      } else {
        suggestionsList.style.display = 'none';
      }
    })
    .catch(err => console.log(err));
}

document.addEventListener('click', (e) => {
  if (!form.contains(e.target)) {
    suggestionsList.style.display = 'none';
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  suggestionsList.style.display = 'none';
  const city = cityInput.value.trim();
  if (city) {
    searchCity(city);
  }
});

function searchCity(city) {
  weatherResult.style.display = 'none';
  forecastContainer.style.display = 'none';
  
  if(loadingIndicator) loadingIndicator.style.display = 'flex';
  if(form) form.style.display = 'none'; 

  const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`;

  fetch(geoUrl)
    .then((response) => response.json())
    .then((locations) => {
      if (locations.length === 0) {
        throw new Error(translations[currentLang].errorCity);
      }
      getWeatherByCoords(locations[0].lat, locations[0].lon);
    })
    .catch((error) => {
      if(loadingIndicator) loadingIndicator.style.display = 'none';
      if(form) form.style.display = 'flex'; 
      alert(error.message);
    });
}

function getWeatherByCoords(lat, lon) {
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=${currentLang}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=${currentLang}`;

  Promise.all([
    fetch(weatherUrl).then(res => { if(!res.ok) throw new Error(translations[currentLang].errorAPI); return res.json(); }),
    fetch(forecastUrl).then(res => { if(!res.ok) throw new Error(translations[currentLang].errorAPI); return res.json(); })
  ])
  .then(([currentWeather, forecastData]) => {
    showWeather(currentWeather);
    showForecast(forecastData);
    
    if(loadingIndicator) loadingIndicator.style.display = 'none';
    if(form) form.style.display = 'flex';
  })
  .catch((error) => {
    if(loadingIndicator) loadingIndicator.style.display = 'none';
    if(form) form.style.display = 'flex';
    alert(error.message);
  });
}

function showWeather(data) {
  let countryName = data.sys.country;
  if (countryName === 'XK') countryName = currentLang === 'sq' ? 'Kosovë' : 'Kosovo';
  if (countryName === 'RS' && (data.name === 'Pristina' || data.name === 'Prishtina')) countryName = currentLang === 'sq' ? 'Kosovë' : 'Kosovo';

  let displayCity = data.name;
  if (displayCity === 'Pristina' || displayCity === 'Priština') displayCity = 'Prishtina';
  
  const now = new Date();
  const locale = currentLang === 'sq' ? 'sq-AL' : 'en-US';
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  currentDateTime.textContent = now.toLocaleDateString(locale, options);

  cityName.textContent = `${displayCity}, ${countryName}`;
  temperature.textContent = `${Math.round(data.main.temp)}°C`;
  
  const t = translations[currentLang];
  humidity.textContent = `${t.humidity}: ${data.main.humidity}%`;
  description.textContent = `${t.desc}: ${data.weather[0].description}`;
  windSpeed.textContent = `${t.wind}: ${data.wind.speed} m/s`;
  feelsLike.textContent = `${t.feelsLike}: ${Math.round(data.main.feels_like)}°C`;

  const sunriseTime = new Date(data.sys.sunrise * 1000).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const sunsetTime = new Date(data.sys.sunset * 1000).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  sunriseEl.innerHTML = `<i class="fas fa-sun" style="color:#f39c12"></i> ${t.sunrise}: ${sunriseTime}`;
  sunsetEl.innerHTML = `<i class="fas fa-moon" style="color:#e67e22"></i> ${t.sunset}: ${sunsetTime}`;

  changeBackground(data.weather[0].main.toLowerCase(), now);

  const weatherCondition = data.weather[0].main.toLowerCase();
  switch (weatherCondition) {
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

function changeBackground(condition, date) {
  const body = document.getElementById('app-body');
  body.className = ''; 
  const hour = date.getHours();
  const isNight = hour < 6 || hour > 19;

  if (isNight) body.classList.add('bg-night');
  else if (condition.includes('clear')) body.classList.add('bg-sunny');
  else if (condition.includes('cloud')) body.classList.add('bg-cloudy');
  else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) body.classList.add('bg-rainy');
  else if (condition.includes('snow')) body.classList.add('bg-snowy');
  else body.classList.add('bg-sunny');
}

function showForecast(data) {
  forecastList.innerHTML = '';
  const locale = currentLang === 'sq' ? 'sq-AL' : 'en-US';
  const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00'));

  dailyData.forEach(day => {
    const date = new Date(day.dt * 1000);
    const dayName = date.toLocaleDateString(locale, { weekday: 'short' });
    const temp = Math.round(day.main.temp);
    const iconCode = day.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    const forecastItem = document.createElement('div');
    forecastItem.className = 'forecast-item';
    forecastItem.innerHTML = `
      <div class="day-name">${dayName}</div>
      <img src="${iconUrl}" alt="icon" class="forecast-icon">
      <div class="forecast-temp">${temp}°C</div>
    `;
    forecastList.appendChild(forecastItem);
  });

  forecastContainer.style.display = 'block';
}