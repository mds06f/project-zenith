export function parseVelocity(
    raw: string
): number {

    const match = raw.match(
        /(Mean orbit velocity|Orbit speed|Orbital speed).*?=\s*([0-9.]+)/i
    );

    if (!match) {

        return 0;

    }

    return Number(
        match[2]
    );

}