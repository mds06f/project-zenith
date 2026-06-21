import * as satellite from "satellite.js";

export interface SatellitePosition {
    latitude: number;
    longitude: number;
    altitude: number;
    velocity: number;
}

export function propagateSatellite(
    line1: string,
    line2: string
): SatellitePosition {

    const satrec = satellite.twoline2satrec(
        line1,
        line2
    );

    const now = new Date();

    const positionAndVelocity = satellite.propagate(
        satrec,
        now
    );

    if (
        !positionAndVelocity ||
        !positionAndVelocity.position ||
        !positionAndVelocity.velocity
    ) {
        throw new Error(
            "Unable to propagate satellite."
        );
    }

    const positionEci = positionAndVelocity.position;
    const velocityEci = positionAndVelocity.velocity;

    const gmst = satellite.gstime(now);

    const geodetic = satellite.eciToGeodetic(
        positionEci,
        gmst
    );

    const velocity = Math.sqrt(
        velocityEci.x ** 2 +
        velocityEci.y ** 2 +
        velocityEci.z ** 2
    );

    return {

        latitude:
            satellite.radiansToDegrees(
                geodetic.latitude
            ),

        longitude:
            satellite.radiansToDegrees(
                geodetic.longitude
            ),

        altitude:
            geodetic.height,

        velocity

    };
}