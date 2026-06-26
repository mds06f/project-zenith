import axios from "axios";
import { cached, TTL } from "../../utils/cache.util";

export interface LightPollutionData {
    bortleClass: number;
}

export async function getLightPollution(
    latitude: number,
    longitude: number
): Promise<LightPollutionData> {
    // Light pollution at a coordinate is effectively static — cache 24h. This is
    // also the flakiest upstream, so a cached good value greatly steadies scores.
    const key = `lightpollution:${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    return cached<LightPollutionData>(key, TTL.LIGHT_POLLUTION, async () => {
        const response = await axios.get(
            "https://www.lightpollutionmap.info/QueryRaster/",
            {
                params: {
                    q: `${latitude},${longitude}`
                },
                timeout: 8000
            }
        );

        const brightness = response.data.brightness;

        let bortleClass = 9;

        if (brightness < 0.25) {
            bortleClass = 1;
        } else if (brightness < 0.5) {
            bortleClass = 2;
        } else if (brightness < 1) {
            bortleClass = 3;
        } else if (brightness < 2) {
            bortleClass = 4;
        } else if (brightness < 4) {
            bortleClass = 5;
        } else if (brightness < 8) {
            bortleClass = 6;
        } else if (brightness < 16) {
            bortleClass = 7;
        } else if (brightness < 32) {
            bortleClass = 8;
        }

        return {
            bortleClass,
        };
    });
}