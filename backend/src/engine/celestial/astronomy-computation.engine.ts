import { AstronomyData } from "../../types/astronomy.types";

export function computeAstronomyData(
    raw: any
): AstronomyData {

    const body =
        raw.data.table.rows[0].cells[0];

    return {

        rightAscension:
            body.position.equatorial.rightAscension.hours,

        declination:
            body.position.equatorial.declination.degrees,

        altitude:
            body.position.horizontal.altitude.degrees,

        azimuth:
            body.position.horizontal.azimuth.degrees,

        constellation:
            body.position.constellation.name

    };

}