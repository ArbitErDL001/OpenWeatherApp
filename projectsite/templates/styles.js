const cityForm = document.querySelector(".search-row");
const cityInput = document.getElementById("city-input");
const cityQuery = document.getElementById("city-query");
const suggestionsList = document.getElementById("city-suggestions");
let suggestionTimer;
let suggestionController;
let suggestions = [];
let activeSuggestion = -1;

function closeSuggestions() {
  suggestionsList.hidden = true;
  cityInput.setAttribute("aria-expanded", "false");
  activeSuggestion = -1;
}

function chooseSuggestion(index) {
  const suggestion = suggestions[index];
  if (!suggestion) return;

  cityInput.value = suggestion.label;
  cityQuery.value = suggestion.query;
  closeSuggestions();
  cityInput.focus();
}

function setActiveSuggestion(index) {
  activeSuggestion = (index + suggestions.length) % suggestions.length;
  const options = suggestionsList.querySelectorAll(".city-suggestion");
  options.forEach((option, optionIndex) => {
    option.setAttribute("aria-selected", String(optionIndex === activeSuggestion));
  });
}

cityInput?.addEventListener("input", () => {
  cityQuery.value = cityInput.value.trim();

  clearTimeout(suggestionTimer);
  suggestionController?.abort();
  suggestions = [];
  suggestionsList.replaceChildren();
  closeSuggestions();

  const query = cityInput.value.trim();
  if (query.length < 2) {
    return;
  }

  suggestionTimer = setTimeout(async () => {
    suggestionController = new AbortController();
    try {
      const url = new URL(cityForm.dataset.suggestionsUrl, window.location.origin);
      url.searchParams.set("q", query);
      const response = await fetch(url, { signal: suggestionController.signal });
      if (!response.ok) return;

      suggestions = await response.json();
      activeSuggestion = -1;
      suggestionsList.replaceChildren(...suggestions.map((suggestion, index) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "city-suggestion";
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", "false");
        option.textContent = suggestion.label;
        option.addEventListener("mousedown", (event) => event.preventDefault());
        option.addEventListener("click", () => chooseSuggestion(index));
        return option;
      }));
      suggestionsList.hidden = suggestions.length === 0;
      cityInput.setAttribute("aria-expanded", String(suggestions.length > 0));
    } catch (error) {
      if (error.name !== "AbortError") {
        suggestions = [];
        suggestionsList.replaceChildren();
        closeSuggestions();
      }
    }
  }, 250);
});

cityInput?.addEventListener("keydown", (event) => {
  if (!suggestions.length) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    setActiveSuggestion(activeSuggestion + 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    setActiveSuggestion(activeSuggestion <= 0 ? suggestions.length - 1 : activeSuggestion - 1);
  } else if (event.key === "Enter" && activeSuggestion >= 0) {
    event.preventDefault();
    chooseSuggestion(activeSuggestion);
  } else if (event.key === "Escape") {
    closeSuggestions();
  }
});

document.addEventListener("click", (event) => {
  if (!cityForm.contains(event.target)) closeSuggestions();
});

cityForm?.addEventListener("submit", () => {
  cityQuery.value = cityQuery.value.trim() || cityInput.value.trim();
});

if (window.feather) {
  window.feather.replace();
}
