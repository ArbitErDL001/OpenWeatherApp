
from django.shortcuts import render
from django.http import JsonResponse
import os
import requests


def city_suggestions(request):
    query = request.GET.get("q", "").strip()
    api_key = os.getenv("OPENWEATHER_API_KEY")

    if len(query) < 2 or not api_key:
        return JsonResponse([], safe=False)

    try:
        response = requests.get(
            "https://api.openweathermap.org/geo/1.0/direct",
            params={"q": query, "limit": 5, "appid": api_key},
            timeout=5,
        )
        response.raise_for_status()
        places = response.json()
        suggestions = []
        for place in places[:5]:
            name = place.get("name")
            country = place.get("country")
            if not name or not country:
                continue

            label = ", ".join(
                part for part in (name, place.get("state"), country) if part
            )
            suggestions.append({"label": label, "query": f"{name},{country}"})
        return JsonResponse(suggestions, safe=False)
    except (requests.exceptions.RequestException, ValueError):
        return JsonResponse([], safe=False)


def weather_view(request):
    api_key = os.getenv("OPENWEATHER_API_KEY")
    city = request.GET.get("city", "Puerto Princesa").strip()

    weather_data = {}

    if not api_key:
        weather_data = {
            "error": "OpenWeather API key is missing. Check your .env file."
        }
    elif not city:
        weather_data = {
            "error": "Please enter a city name."
        }
    else:
        url = "https://api.openweathermap.org/data/2.5/weather"

        try:
            response = requests.get(
                url,
                params={
                    "q": city,
                    "appid": api_key,
                    "units": "metric"
                },
                timeout=10
            )

            response.raise_for_status()
            data = response.json()

            weather_data = {
                "city": data["name"],
                "country": data["sys"]["country"],
                "temp": data["main"]["temp"],
                "description": data["weather"][0]["description"].title(),
                "icon": data["weather"][0]["icon"],
                "precipitation": data.get("rain", {}).get("1h", 0),
                "humidity": data["main"]["humidity"],
                "wind": round(data["wind"]["speed"] * 3.6),
            }

        except requests.exceptions.HTTPError as e:
            if response.status_code == 404:
                message = f"Could not find weather information for '{city}'."
            elif response.status_code == 401:
                message = "Invalid API key or the key is not active yet."
            else:
                message = "The weather service returned an error."

            weather_data = {"error": message}

        except requests.exceptions.RequestException:
            weather_data = {
                "error": "Unable to connect to the weather service. Please try again."
            }

        except (KeyError, IndexError, ValueError):
            weather_data = {
                "error": "The weather service returned unexpected data."
            }

    return render(
        request,
        "index.html",
        {"weather": weather_data, "city": city}
    )
