export interface AltitudeSample {

    time: string;

    altitude: number;

}

export function parseAltitudes(
    raw: string
): AltitudeSample[] {

    const lines = raw.split("\n");

    const samples: AltitudeSample[] = [];

    let insideTable = false;

    for (const line of lines) {

        if (line.includes("$$SOE")) {

            insideTable = true;

            continue;

        }

        if (line.includes("$$EOE")) {

            break;

        }

        if (!insideTable) {

            continue;

        }

        const tokens =
            line.trim().split(/\s+/);

        if (tokens.length < 7) {

            continue;

        }

        const date =
            `${tokens[0]} ${tokens[1]}`;

        const altitude =
            Number(
                tokens[tokens.length - 2]
            );

        samples.push({

            time: date,

            altitude

        });

    }

    return samples;

}