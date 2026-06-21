import axios from "axios";
import { SatelliteData } from "../../types/satellite.types";

export async function getISSPosition(): Promise<SatelliteData> {

    const response = await axios.get(
        "http://api.open-notify.org/iss-now.json"
    );

    const data = response.data;

    return {
        name: "ISS",
        latitude: Number(data.iss_position.latitude),
        longitude: Number(data.iss_position.longitude),
        timestamp: data.timestamp
    };
}