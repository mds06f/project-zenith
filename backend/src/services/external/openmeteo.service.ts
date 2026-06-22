import axios from "axios";


export async function getWeather(latitude: number, longitude: number) {
    try {
        const response = await axios.get(
            "https://api.open-meteo.com/v1/forecast",
            {
                params: {
                    latitude,
                    longitude,
                    current: [
                        "temperature_2m",
                        "cloud_cover",
                        "relative_humidity_2m",
                        "wind_speed_10m"
                    ]
                }
            }
        );

        const current = response.data.current;

return {
    temperature: current.temperature_2m,
    cloudCover: current.cloud_cover,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m
};
    } catch (error) {
        throw new Error("Failed to fetch weather data");
    }
}