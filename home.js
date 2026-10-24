(function () {
  const API_KEY = '18ca2d6753b3d722b0be4aa1c965cdca';
  const weatherUrl = (lat, lon) =>
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=sq`;

  const iconMap = { Clear: 'fa-sun', Clouds: 'fa-cloud-sun', Rain: 'fa-cloud-rain', Drizzle: 'fa-cloud-rain', Snow: 'fa-snowflake', Thunderstorm: 'fa-bolt' };
  const iconFor = main => iconMap[main] || 'fa-smog';
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const getJson = url => fetch(url).then(r => { if (!r.ok) throw new Error('api'); return r.json(); });

  document.getElementById('footerYear').textContent = new Date().getFullYear();

  // --- TABELA E QYTETEVE (të dhëna reale) ---
  const rows = document.querySelectorAll('#cityTable tbody tr');
  const note = document.getElementById('tableNote');

  function fillRow(row, d) {
    const c = d.main.temp;
    row.querySelector('.c-temp').textContent = `${Math.round(c)}°C / ${Math.round(c * 9 / 5 + 32)}°F`;
    const cond = row.querySelector('.c-cond');
    cond.innerHTML = '';
    const i = document.createElement('i');
    i.className = `fas ${iconFor(d.weather[0].main)}`;
    cond.appendChild(i);
    cond.appendChild(document.createTextNode(' ' + cap(d.weather[0].description)));
    row.querySelector('.c-hum').textContent = `${d.main.humidity}%`;
    row.querySelector('.c-wind').textContent = `${Math.round(d.wind.speed * 3.6)} km/h`;
    row.querySelectorAll('.skeleton-cell').forEach(td => td.classList.remove('skeleton-cell'));
  }

  Promise.allSettled(Array.from(rows).map(row =>
    getJson(weatherUrl(row.dataset.lat, row.dataset.lon)).then(d => fillRow(row, d))
  )).then(results => {
    const ok = results.filter(r => r.status === 'fulfilled').length;
    rows.forEach(r => r.querySelectorAll('.skeleton-cell').forEach(td => td.classList.remove('skeleton-cell')));
    if (ok === 0) {
      note.textContent = 'Të dhënat nuk u ngarkuan. Kontrolloni lidhjen dhe rifreskoni faqen.';
    } else {
      const t = new Date().toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' });
      note.textContent = `Përditësuar: ${t}`;
    }
  });

  // --- KARTA "MOTI TANI" NË HERO (lokacioni sipas IP, pa kërkuar leje) ---
  const liveCard = document.getElementById('liveCard');
  fetch('https://ipapi.co/json/')
    .then(r => r.json())
    .then(loc => {
      if (!loc.latitude || !loc.longitude) throw new Error('no-loc');
      return getJson(weatherUrl(loc.latitude, loc.longitude));
    })
    .then(d => {
      document.getElementById('liveCity').textContent = d.name;
      document.getElementById('liveDesc').textContent = cap(d.weather[0].description);
      document.getElementById('liveTemp').textContent = `${Math.round(d.main.temp)}°C`;
      liveCard.hidden = false;
    })
    .catch(() => { liveCard.hidden = true; });

  // --- LINKU AKTIV GJATË SKROLLIMIT ---
  const spyLinks = {};
  document.querySelectorAll('[data-spy]').forEach(a => { spyLinks[a.dataset.spy] = a; });
  const featuresEl = document.getElementById('features');
  const aboutEl = document.getElementById('about');

  function updateSpy() {
    const y = window.scrollY + 140;
    let current = 'top';
    if (aboutEl && y >= aboutEl.offsetTop) current = 'about';
    else if (featuresEl && y >= featuresEl.offsetTop) current = 'features';
    Object.keys(spyLinks).forEach(key => {
      const on = key === current;
      spyLinks[key].classList.toggle('active', on);
      if (on) spyLinks[key].setAttribute('aria-current', 'page');
      else spyLinks[key].removeAttribute('aria-current');
    });
  }

  // --- BUTONI "KTHEHU LART" ---
  const toTop = document.getElementById('toTop');
  function onScroll() {
    updateSpy();
    toTop.classList.toggle('show', window.scrollY > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  onScroll();

  // --- VIDEOJA: pa lëvizje për ata që e kanë zgjedhur ---
  const video = document.querySelector('.video-box video');
  if (video && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.removeAttribute('autoplay');
    video.pause();
    video.setAttribute('controls', '');
  }
})();