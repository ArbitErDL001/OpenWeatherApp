
from django.shortcuts import render
import os
import requests


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
        "weather.html",
        {"weather": weather_data, "city": city}
    )
