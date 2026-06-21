import axios from "axios";

export async function getAstronomyRawData(
    latitude: number,
    longitude: number
) {

    const appId = process.env.ASTRONOMY_APP_ID!;
    const appSecret = process.env.ASTRONOMY_APP_SECRET!;

    const authString = Buffer
        .from(`${appId}:${appSecret}`)
        .toString("base64");

    const today = new Date()
        .toISOString()
        .split("T")[0];

    const currentTime = new Date()
        .toTimeString()
        .split(" ")[0];

    const response = await axios.get(
        "https://api.astronomyapi.com/api/v2/bodies/positions",
        {
            headers: {
                Authorization: `Basic ${authString}`
            },

            params: {

                latitude,

                longitude,

                elevation: 0,

                from_date: today,

                to_date: today,

                time: currentTime,

                bodies: "moon"

            }
        }
    );

    return response.data;
}