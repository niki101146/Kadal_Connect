import json
import logging
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from django.core.cache import cache
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from accounts.models import Harbor
from .models import SeaAlert

MARINE = ("https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}"
          "&current=wave_height,wave_period,wave_direction"
          "&hourly=wave_height,wave_period,wave_direction,swell_wave_height,sea_level_height_msl"
          "&daily=wave_height_max,wave_period_max"
          "&forecast_days=7&timezone=Asia%2FKolkata")
WIND = ("https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
        "&current=temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,"
        "relative_humidity_2m,pressure_msl,cloud_cover,precipitation,weather_code"
        "&hourly=temperature_2m,precipitation_probability,wind_speed_10m,wind_gusts_10m,"
        "wind_direction_10m,weather_code,visibility"
        "&daily=wind_gusts_10m_max,precipitation_probability_max,sunrise,sunset,"
        "temperature_2m_max,temperature_2m_min,uv_index_max,weather_code"
        "&forecast_days=7&timezone=Asia%2FKolkata")


log = logging.getLogger(__name__)


def fetch(url):
    # identify ourselves (Open-Meteo may refuse the default "Python-urllib" agent) and retry once on a hiccup / rate limit
    req = urllib.request.Request(url, headers={"User-Agent": "KadalConnect/1.0 (fishermen sea advisory)", "Accept": "application/json"})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=8) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001
            log.warning("Open-Meteo request failed (attempt %s): %s", attempt + 1, e)
            if attempt == 1 or "429" in str(e):
                raise
            time.sleep(0.5)


def fetch_both(lat, lon):
    """Marine + weather requests run at the same time, so the page waits for the slower one, not the sum."""
    with ThreadPoolExecutor(max_workers=2) as pool:
        sea = pool.submit(fetch, MARINE.format(lat=lat, lon=lon))
        air = pool.submit(fetch, WIND.format(lat=lat, lon=lon))
        return sea.result(), air.result()


def at(d, key, i):
    arr = d.get(key) or []
    return arr[i] if i < len(arr) else None


def advisory(wave, gust):
    if wave >= 2.5 or gust >= 50:
        return "DANGER", "Do not go to sea."
    if wave >= 1.5 or gust >= 35:
        return "CAUTION", "Rough sea. Small boats should stay in."
    return "SAFE", "Sea conditions are fine for fishing."


def fishing_score(wave, gust, rain):
    """0-100 comfort/safety score for a day. Higher is better."""
    score = 100 - (wave or 0) * 22 - (gust or 0) * 0.9 - (rain or 0) * 0.15
    return max(0, min(100, round(score)))


def build_hours(sea, air, now_iso, count=48):
    hs, ha = sea.get("hourly", {}), air.get("hourly", {})
    times = ha.get("time", [])
    start = next((i for i, t in enumerate(times) if t >= (now_iso or "")[:13] + ":00"), 0)
    out = []
    for i in range(start, min(start + count, len(times))):
        w, g = at(hs, "wave_height", i), at(ha, "wind_gusts_10m", i)
        out.append({
            "time": times[i], "wave": w, "period": at(hs, "wave_period", i),
            "wave_dir": at(hs, "wave_direction", i), "swell": at(hs, "swell_wave_height", i),
            "tide": at(hs, "sea_level_height_msl", i),
            "wind": at(ha, "wind_speed_10m", i), "wind_dir": at(ha, "wind_direction_10m", i),
            "gust": g, "rain": at(ha, "precipitation_probability", i),
            "temp": at(ha, "temperature_2m", i), "code": at(ha, "weather_code", i),
            "vis_km": round(at(ha, "visibility", i) / 1000, 1) if at(ha, "visibility", i) is not None else None,
            "level": advisory(w or 0, g or 0)[0],
        })
    return out


def best_windows(hours):
    """Longest run of SAFE, low-rain daylight hours (05:00-18:00) per day."""
    by_day = {}
    for h in hours:
        d, hr = h["time"][:10], int(h["time"][11:13])
        ok = h["level"] == "SAFE" and (h["rain"] or 0) < 60 and 5 <= hr <= 18
        by_day.setdefault(d, []).append((hr, ok))
    wins = []
    for d, rows in by_day.items():
        best, cur = None, None
        for hr, ok in rows:
            if ok and cur and hr == cur[1] + 1:
                cur[1] = hr
            elif ok:
                cur = [hr, hr]
            else:
                cur = None
            if cur and (best is None or cur[1] - cur[0] > best[1] - best[0]):
                best = list(cur)
        if best and best[1] - best[0] >= 1:
            wins.append({"date": d, "start": f"{best[0]:02d}:00", "end": f"{best[1] + 1:02d}:00",
                         "hours": best[1] - best[0] + 1})
    return wins


def trend(hours):
    near = [h["wave"] for h in hours[:12] if h["wave"] is not None]
    later = [h["wave"] for h in hours[12:36] if h["wave"] is not None]
    if not near or not later:
        return {"direction": "STEADY", "text": "Not enough data to predict the trend."}
    a, b = sum(near) / len(near), sum(later) / len(later)
    if b > a + 0.3:
        return {"direction": "WORSENING", "text": f"Seas are expected to build from about {a:.1f} m to {b:.1f} m over the next day or two."}
    if b < a - 0.3:
        return {"direction": "IMPROVING", "text": f"Seas are expected to ease from about {a:.1f} m to {b:.1f} m over the next day or two."}
    return {"direction": "STEADY", "text": f"Seas should stay close to {a:.1f} m over the next day or two."}


def build_weather(sea, air):
    """Turn the raw Open-Meteo marine + weather JSON into the advisory/forecast shape the app uses."""
    cs, ca, ds, da = sea.get("current", {}), air.get("current", {}), sea.get("daily", {}), air.get("daily", {})
    level, text = advisory(cs.get("wave_height") or 0, ca.get("wind_gusts_10m") or 0)
    days = []
    for i, date in enumerate(da.get("time", [])):
        w, g = at(ds, "wave_height_max", i), at(da, "wind_gusts_10m_max", i)
        rain = at(da, "precipitation_probability_max", i)
        days.append({"date": date, "wave_max": w, "gust_max": g, "rain": rain,
                     "temp_max": at(da, "temperature_2m_max", i), "temp_min": at(da, "temperature_2m_min", i),
                     "uv": at(da, "uv_index_max", i), "code": at(da, "weather_code", i),
                     "sunrise": at(da, "sunrise", i), "sunset": at(da, "sunset", i),
                     "score": fishing_score(w, g, rain), "level": advisory(w or 0, g or 0)[0]})
    hours = build_hours(sea, air, ca.get("time"))
    data = {"wave_height_m": cs.get("wave_height"), "wave_period_s": cs.get("wave_period"),
            "wave_dir": cs.get("wave_direction"), "wind_kmh": ca.get("wind_speed_10m"),
            "wind_dir": ca.get("wind_direction_10m"), "gust_kmh": ca.get("wind_gusts_10m"),
            "temp_c": ca.get("temperature_2m"), "humidity": ca.get("relative_humidity_2m"),
            "pressure_hpa": ca.get("pressure_msl"), "cloud_pct": ca.get("cloud_cover"),
            "code": ca.get("weather_code"),
            "sunrise": at(da, "sunrise", 0), "sunset": at(da, "sunset", 0),
            "rain_pct": at(da, "precipitation_probability_max", 0), "updated": ca.get("time"),
            "level": level, "advice": text, "forecast": days, "hourly": hours,
            "best_windows": best_windows(hours), "trend": trend(hours)}
    return data


def _harbor_payload(harbor):
    return {"id": harbor.pk, "name": harbor.name, "latitude": harbor.latitude, "longitude": harbor.longitude}


def _pick_harbor(request):
    return Harbor.objects.filter(pk=request.query_params.get("harbor") or None).first() or Harbor.objects.first()


@api_view(["GET"])
@permission_classes([AllowAny])
def weather(request):
    harbor = _pick_harbor(request)
    if not harbor:
        return Response({"detail": "No harbors yet. Run: python manage.py seed"}, status=404)
    key = f"wx3:{harbor.pk}"
    data = cache.get(key)
    if not data:
        try:
            sea, air = fetch_both(harbor.latitude, harbor.longitude)
            data = build_weather(sea, air)
        except Exception:
            data = cache.get(key + ":stale")  # show the last good forecast rather than an error
            if not data:
                # Open-Meteo often rate-limits shared hosting IPs (HTTP 429). Hand the browser the source URLs so it can
                # fetch them from the visitor's own connection and send them to /weather/compute/ (see frontend api.js).
                return Response({"detail": "Weather service is not reachable. Try again shortly.",
                                 "sources": {"marine": MARINE.format(lat=harbor.latitude, lon=harbor.longitude),
                                             "air": WIND.format(lat=harbor.latitude, lon=harbor.longitude)}}, status=502)
        else:
            cache.set(key, data, 600)
            cache.set(key + ":stale", data, 6 * 3600)
    return Response({"harbor": _harbor_payload(harbor), **data})


@api_view(["POST"])
@permission_classes([AllowAny])
def weather_compute(request):
    """Fallback: the browser fetched Open-Meteo itself. We compute the advisory but never cache it, so a made-up
    payload can only ever affect the person who sent it - never the forecast other fishermen see."""
    harbor = _pick_harbor(request)
    if not harbor:
        return Response({"detail": "No harbors yet."}, status=404)
    sea, air = request.data.get("sea"), request.data.get("air")
    if not isinstance(sea, dict) or not isinstance(air, dict):
        return Response({"detail": "Invalid weather data."}, status=400)
    try:
        data = build_weather(sea, air)
    except Exception:
        return Response({"detail": "Invalid weather data."}, status=400)
    return Response({"harbor": _harbor_payload(harbor), **data})


@api_view(["GET"])
@permission_classes([AllowAny])
def alert_list(request):
    qs = SeaAlert.objects.filter(active=True)
    if h := request.query_params.get("harbor"):
        qs = qs.filter(Q(harbor_id=h) | Q(harbor__isnull=True))
    return Response([{"id": a.id, "severity": a.severity, "title": a.title, "message": a.message,
                      "created_at": a.created_at} for a in qs[:20]])