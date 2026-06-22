import axios from "axios";

export async function getAstronomyRawData(
    latitude: number,
    longitude: number
) {

    const today = new Date()
        .toISOString()
        .split("T")[0];

    const response = await axios.get(
        "https://aa.usno.navy.mil/api/rstt/oneday",
        {
            params: {
                date: today,
                coords: `${latitude},${longitude}`
            }
        }
    );

    return {
        moonIllumination: Number(
            response.data.properties.data.fracillum.replace("%", "")
        )
    };
}