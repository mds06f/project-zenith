import axios from "axios";
import { cached, TTL } from "../../utils/cache.util";

interface HourlyWeather {
    time: string[];
    cloud_cover: number[];
    visibility: number[];
}

/**
 * Fetch the full hourly cloud-cover + visibility forecast for a location once and
 * cache it (10 min). Different timeline points then read different hours out of
 * the same cached payload — so "Now" vs "Tonight" vs "Tomorrow" genuinely differ
 * without extra network calls.
 */
async function fetchHourly(latitude: number, longitude: number): Promise<HourlyWeather> {
    const key = `weather:${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    return cached<HourlyWeather>(key, TTL.WEATHER, async () => {
        const response = await axios.get(
            "https://api.open-meteo.com/v1/forecast",
            {
                params: {
                    latitude,
                    longitude,
                    hourly: "cloud_cover,visibility",
                    forecast_days: 8,   // covers Now … Next Week (+7d)
                    timezone: "UTC"
                },
                timeout: 8000
            }
        );
        return response.data.hourly as HourlyWeather;
    });
}

/** Index of the forecast hour nearest to `target` (UTC). */
function nearestHourIndex(times: string[], target: Date): number {
    const targetMs = target.getTime();
    let best = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < times.length; i++) {
        const t = times[i]!;
        const ms = Date.parse(t.endsWith("Z") ? t : `${t}:00Z`);
        const diff = Math.abs(ms - targetMs);
        if (diff < bestDiff) {
            bestDiff = diff;
            best = i;
        }
    }
    return best;
}

/**
 * Cloud cover (%) + visibility (m) for a location at a target time.
 * @param when target instant; defaults to now. Drives timeline simulation.
 */
export async function getWeather(latitude: number, longitude: number, when?: Date) {
    try {
        const hourly = await fetchHourly(latitude, longitude);
        if (!hourly?.time?.length) throw new Error("empty hourly forecast");
        const idx = nearestHourIndex(hourly.time, when ?? new Date());
        return {
            cloudCover: hourly.cloud_cover[idx],
            visibility: hourly.visibility[idx]
        };
    } catch (error) {
        throw new Error("Failed to fetch weather data");
    }
}
