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
                        "cloud_cover",
                        "visibility"
                    ]
                }
            }
        );

        const current = response.data.current;

return {
    cloudCover: current.cloud_cover,
    visibility: current.visibility
};
    } catch (error) {
        throw new Error("Failed to fetch weather data");
    }
}