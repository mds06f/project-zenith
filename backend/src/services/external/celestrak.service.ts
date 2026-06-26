import axios from "axios";
import { TLEData } from "../../types/tle.types";
import { cached, TTL } from "../../utils/cache.util";

export async function getISSTLE(): Promise<TLEData> {

    // A TLE set is published a few times a day; 6h cache keeps ISS propagation
    // accurate while removing CelesTrak from the hot path of every report/poll.
    return cached<TLEData>("tle:iss", TTL.ISS_TLE, async () => {
        const response = await axios.get(
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle",
            { timeout: 8000 }
        );

        const lines = response.data.trim().split("\n");

        return {
            name: lines[0].trim(),
            line1: lines[1].trim(),
            line2: lines[2].trim()
        };
    });
}