import axios from "axios";

export async function getISSPasses(
    latitude: number,
    longitude: number
) {

    const apiKey = process.env.N2YO_API_KEY!;

    const url =
        `https://api.n2yo.com/rest/v1/satellite/radiopasses/25544/${latitude}/${longitude}/0/1/40/&apiKey=${apiKey}`;

    const response = await axios.get(url);

    console.log(response.data);

    return response.data;
}