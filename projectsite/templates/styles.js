// Paste your OpenWeather API key between the quotation marks.
const API_KEY = "8381c670247383b0fde5c36976af8a4a
let isCelsius = true;
let latestWeather = null;
let latestForecast = null;

const $ = (id) => document.getElementById(id);

function iconForCondition(condition) {
  const text = (condition || "").toLowerCase();
  if (text.includes("thunder")) return "cloud-lightning";
  if (text.includes("drizzle") || text.includes("rain")) return "cloud-rain";
  if (text.includes("snow")) return "cloud-snow";
  if (text.includes("mist") || text.includes("fog") || text.includes("haze") || text.includes("smoke")) return "cloud";
  if (text.includes("cloud")) return "cloud";
  if (text.includes("clear")) return "sun";
  return "cloud";
}

function temp(value) {
  const result = isCelsius ? value : value * 9 / 5 + 32;
  return `${Math.round(result)}°${isCelsius ? "C" : "F"}`;
}

function renderIcons() {
  if (window.feather) feather.replace();
}

function showError(message) {
  $("error-message").textContent = message;
}

async function loadWeather(city) {
  if (API_KEY === "Y8381c670247383b0fde5c36976af8a4a" || !API_KEY.trim()) {
    showError("Add your OpenWeather API key in script.js to load live weather.");
    return;
  }

  showError("");
  $("status").textContent = "Loading weather...";
  $("weather-desc").textContent = "Loading...";
  $("week-list").innerHTML = '<li class="forecast-loading">Loading forecast...</li>';

  try {
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const responses = await Promise.all([fetch(currentUrl), fetch(forecastUrl)]);
    const current = await responses[0].json();
    const forecast = await responses[1].json();

    if (!responses[0].ok) throw new Error(current.message || "City not found.");
    if (!responses[1].ok) throw new Error(forecast.message || "Forecast unavailable.");

    latestWeather = current;
    latestForecast = forecast;
    renderWeather();
    renderForecast();
    $("status").textContent = `Updated ${new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}`;
  } catch (error) {
    showError(error.message === "Failed to fetch"
      ? "Could not connect. Check your internet connection and API key."
      : `Weather error: ${error.message}`);
    $("status").textContent = "Weather unavailable";
    $("week-list").innerHTML = '<li class="forecast-loading">Forecast unavailable</li>';
  }
}

function renderWeather() {
  const data = latestWeather;
  const weather = data.weather[0];
  const now = new Date();
  $("day-name").textContent = now.toLocaleDateString("en-US", {weekday: "long"});
  $("date-day").textContent = now.toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "numeric"});
  $("location").textContent = `${data.name}, ${data.sys.country}`;
  $("weather-temp").textContent = temp(data.main.temp);
  $("weather-desc").textContent = weather.description;
  $("precipitation").textContent = `${data.rain?.["1h"] ? Math.round(data.rain["1h"]) : 0} mm`;
  $("humidity").textContent = `${data.main.humidity} %`;
  $("wind").textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
  $("weather-icon").setAttribute("data-feather", iconForCondition(weather.main));
  renderIcons();
}

function renderForecast() {
  const grouped = new Map();
  latestForecast.list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0];
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date).push(item);
  });

  const days = Array.from(grouped.values()).slice(0, 4);
  $("week-list").innerHTML = "";

  days.forEach((items, index) => {
    const noonItem = items.find(item => item.dt_txt.includes("12:00:00")) || items[Math.floor(items.length / 2)];
    const dayName = index === 0 ? "Today" : new Date(`${noonItem.dt_txt.replace(" ", "T")}Z`).toLocaleDateString("en-US", {weekday: "short", timeZone: "UTC"});
    const li = document.createElement("li");
    if (index === 0) li.classList.add("active");
    li.innerHTML = `
      <i class="day-icon" data-feather="${iconForCondition(noonItem.weather[0].main)}"></i>
      <span class="day-name">${dayName}</span>
      <span class="day-temp">${temp(noonItem.main.temp_max)}</span>
    `;
    $("week-list").appendChild(li);
  });
  renderIcons();
}

$("search-button").addEventListener("click", () => {
  const city = $("city-input").value.trim();
  if (city) loadWeather(city);
});

$("city-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") $("search-button").click();
});

$("change-location").addEventListener("click", () => {
  const city = window.prompt("Enter a city name:", $("location").textContent.split(",")[0]);
  if (city && city.trim()) {
    $("city-input").value = city.trim();
    loadWeather(city.trim());
  }
});

$("unit-toggle").addEventListener("click", () => {
  isCelsius = !isCelsius;
  $("unit-toggle").textContent = isCelsius ? "Switch to °F" : "Switch to °C";
  if (latestWeather) renderWeather();
  if (latestForecast) renderForecast();
});

renderIcons();
loadWeather("Manila");
