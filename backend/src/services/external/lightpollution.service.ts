import axios from "axios";

export interface LightPollutionData {
    bortleClass: number;
}

export async function getLightPollution(
    latitude: number,
    longitude: number
): Promise<LightPollutionData> {
    try {
        const response = await axios.get(
            "https://www.lightpollutionmap.info/QueryRaster/",
            {
                params: {
                    q: `${latitude},${longitude}`
                }
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
    } catch (error) {
        console.error(error);
        throw error;
    }
}