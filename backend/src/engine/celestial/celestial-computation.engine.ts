import { CelestialData } from "../../types/celestial.types";

export function computeCelestialData(
    raw: string,
    body: string
): CelestialData {

    const lines = raw.split("\n");

    const startIndex = lines.findIndex(
        line => line.includes("$$SOE")
    );

    if (
        startIndex === -1 ||
        startIndex + 1 >= lines.length
    ) {
        throw new Error(
            "Unable to locate ephemeris data."
        );
    }

    const dataLine = lines[startIndex + 1];

    if (!dataLine) {
        throw new Error(
            "Missing data line."
        );
    }

    console.log(dataLine);

    const parts = dataLine
        .trim()
        .replace(/\s+/g, " ")
        .split(" ");

    if (parts.length < 8) {
        throw new Error(
            "Unexpected Horizons output."
        );
    }

    return {

        body,

        rightAscension:
            `${parts[2]} ${parts[3]} ${parts[4]}`,

        declination:
            `${parts[5]} ${parts[6]} ${parts[7]}`,

        distance: 0,

        radialVelocity: 0

    };

}