export interface CelestialData {

    body: string;

    rightAscension: string;

    declination: string;

    magnitude?: number;

    distance?: number;

    radialVelocity?: number;

}

export const bodyMap: Record<string, string> = {

    Mercury: "199",

    Venus: "299",

    Moon: "301",

    Mars: "499",

    Jupiter: "599",

    Saturn: "699",

    Uranus: "799",

    Neptune: "899"

};