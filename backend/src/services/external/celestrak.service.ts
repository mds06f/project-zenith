import axios from "axios";
import { TLEData } from "../../types/tle.types";

export async function getISSTLE(): Promise<TLEData> {

    const response = await axios.get(
        "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle"
    );

    const lines = response.data.trim().split("\n");

    return {
        name: lines[0].trim(),
        line1: lines[1].trim(),
        line2: lines[2].trim()
    };
}