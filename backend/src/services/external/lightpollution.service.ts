import axios from "axios";
import { LightPollutionData } from "../../types/lightpollution.types";

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
        let condition = "Inner City Sky";

        if (brightness < 0.25) {
            bortleClass = 1;
            condition = "Excellent Dark Sky";
        }
        else if (brightness < 0.5) {
            bortleClass = 2;
            condition = "Truly Dark";
        }
        else if (brightness < 1) {
            bortleClass = 3;
            condition = "Rural Sky";
        }
        else if (brightness < 2) {
            bortleClass = 4;
            condition = "Suburban-Rural Transition";
        }
        else if (brightness < 4) {
            bortleClass = 5;
            condition = "Suburban Sky";
        }
        else if (brightness < 8) {
            bortleClass = 6;
            condition = "Bright Suburban";
        }
        else if (brightness < 16) {
            bortleClass = 7;
            condition = "Urban Sky";
        }
        else if (brightness < 32) {
            bortleClass = 8;
            condition = "City Sky";
        }

        return {
            bortleClass,
            brightness,
            condition
        };

    } catch (error) {

        console.error(error);

        throw error;

    }
}