export function parseMagnitude(
    raw: string
): number {

    const match =
        raw.match(
            /(?:Visual mag\. V\(1,0\)|Vis\. mag\. \(opposition\))\s*=\s*([+-]?\d+\.\d+)/
        );

    if (!match)
        return 99;

    return Number(match[1]);

}