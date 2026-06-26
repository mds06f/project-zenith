/**
 * Sun & Moon position / rise-set / illumination — a compact, dependency-free
 * port of SunCalc (MIT, © Vladimir Agafonkin), the standard implementation of
 * the algorithms in Astronomy Answers' "position of the sun and moon".
 *
 * Everything here is pure computation from (date, lat, lng): no network, no API
 * key, deterministic and accurate to within a minute or so. It is the real data
 * source behind Upcoming Events (sunset, twilight, moonrise/set, moon phase) and
 * the moon-illumination input to the Observation Score.
 */

const rad = Math.PI / 180;
const dayMs = 1000 * 60 * 60 * 24;
const J1970 = 2440588;
const J2000 = 2451545;
const e = rad * 23.4397; // obliquity of the Earth

function toJulian(date: Date): number { return date.valueOf() / dayMs - 0.5 + J1970; }
function fromJulian(j: number): Date { return new Date((j + 0.5 - J1970) * dayMs); }
function toDays(date: Date): number { return toJulian(date) - J2000; }

function rightAscension(l: number, b: number): number {
    return Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
}
function declination(l: number, b: number): number {
    return Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
}
function altitude(H: number, phi: number, dec: number): number {
    return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
}
function siderealTime(d: number, lw: number): number { return rad * (280.16 + 360.9856235 * d) - lw; }
function astroRefraction(h: number): number {
    if (h < 0) h = 0;
    return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
}

function solarMeanAnomaly(d: number): number { return rad * (357.5291 + 0.98560028 * d); }
function eclipticLongitude(M: number): number {
    const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    const P = rad * 102.9372;
    return M + C + P + Math.PI;
}
function sunCoords(d: number): { dec: number; ra: number } {
    const M = solarMeanAnomaly(d);
    const L = eclipticLongitude(M);
    return { dec: declination(L, 0), ra: rightAscension(L, 0) };
}

// ── Sun rise/set/twilight times ──────────────────────────────────────────────
const J0 = 0.0009;
function julianCycle(d: number, lw: number): number { return Math.round(d - J0 - lw / (2 * Math.PI)); }
function approxTransit(Ht: number, lw: number, n: number): number { return J0 + (Ht + lw) / (2 * Math.PI) + n; }
function solarTransitJ(ds: number, M: number, L: number): number {
    return J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
}
function hourAngle(h: number, phi: number, d: number): number {
    return Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));
}
function getSetJ(h: number, lw: number, phi: number, dec: number, n: number, M: number, L: number): number {
    const w = hourAngle(h, phi, dec);
    const a = approxTransit(w, lw, n);
    return solarTransitJ(a, M, L);
}

// [altitude°, morning-name, evening-name]
const SUN_TIMES: [number, string, string][] = [
    [-0.833, "sunrise", "sunset"],
    [-6, "dawn", "dusk"],                 // civil twilight
    [-12, "nauticalDawn", "nauticalDusk"],// nautical twilight
    [-18, "nightEnd", "night"]            // astronomical twilight
];

export type SunTimes = Record<string, Date> & { solarNoon: Date; nadir: Date };

export function getSunTimes(date: Date, lat: number, lng: number): SunTimes {
    const lw = rad * -lng;
    const phi = rad * lat;
    const d = toDays(date);
    const n = julianCycle(d, lw);
    const ds = approxTransit(0, lw, n);
    const M = solarMeanAnomaly(ds);
    const L = eclipticLongitude(M);
    const dec = declination(L, 0);
    const Jnoon = solarTransitJ(ds, M, L);

    const result = { solarNoon: fromJulian(Jnoon), nadir: fromJulian(Jnoon - 0.5) } as SunTimes;
    for (const [angle, morning, evening] of SUN_TIMES) {
        const h0 = angle * rad;
        const Jset = getSetJ(h0, lw, phi, dec, n, M, L);
        const Jrise = Jnoon - (Jset - Jnoon);
        result[morning] = fromJulian(Jrise);
        result[evening] = fromJulian(Jset);
    }
    return result;
}

export function getSunAltitudeDeg(date: Date, lat: number, lng: number): number {
    const lw = rad * -lng;
    const phi = rad * lat;
    const d = toDays(date);
    const c = sunCoords(d);
    const H = siderealTime(d, lw) - c.ra;
    return altitude(H, phi, c.dec) / rad;
}

// ── Moon ─────────────────────────────────────────────────────────────────────
function moonCoords(d: number): { ra: number; dec: number; dist: number } {
    const L = rad * (218.316 + 13.176396 * d);
    const M = rad * (134.963 + 13.064993 * d);
    const F = rad * (93.272 + 13.229350 * d);
    const l = L + rad * 6.289 * Math.sin(M);
    const b = rad * 5.128 * Math.sin(F);
    const dt = 385001 - 20905 * Math.cos(M);
    return { ra: rightAscension(l, b), dec: declination(l, b), dist: dt };
}

export function getMoonAltitudeDeg(date: Date, lat: number, lng: number): number {
    const lw = rad * -lng;
    const phi = rad * lat;
    const d = toDays(date);
    const c = moonCoords(d);
    const H = siderealTime(d, lw) - c.ra;
    let h = altitude(H, phi, c.dec);
    h = h + astroRefraction(h);
    return h / rad;
}

export interface MoonIllumination {
    /** 0–1 illuminated fraction. */
    fraction: number;
    /** 0 new → 0.25 first quarter → 0.5 full → 0.75 last quarter → 1 new. */
    phase: number;
    angle: number;
}

export function getMoonIllumination(date: Date): MoonIllumination {
    const d = toDays(date);
    const s = sunCoords(d);
    const m = moonCoords(d);
    const sdist = 149598000;
    const phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
    const inc = Math.atan2(sdist * Math.sin(phi), m.dist - sdist * Math.cos(phi));
    const angle = Math.atan2(
        Math.cos(s.dec) * Math.sin(s.ra - m.ra),
        Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra)
    );
    return {
        fraction: (1 + Math.cos(inc)) / 2,
        phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
        angle
    };
}

/** Human-readable phase name from the 0–1 phase value. */
export function moonPhaseName(phase: number): string {
    if (phase < 0.03 || phase > 0.97) return "New Moon";
    if (phase < 0.22) return "Waxing Crescent";
    if (phase < 0.28) return "First Quarter";
    if (phase < 0.47) return "Waxing Gibbous";
    if (phase < 0.53) return "Full Moon";
    if (phase < 0.72) return "Waning Gibbous";
    if (phase < 0.78) return "Last Quarter";
    return "Waning Crescent";
}

function hoursLater(date: Date, h: number): Date { return new Date(date.valueOf() + (h * dayMs) / 24); }

export interface MoonTimes { rise?: Date; set?: Date; alwaysUp?: boolean; alwaysDown?: boolean; }

export function getMoonTimes(date: Date, lat: number, lng: number): MoonTimes {
    const t = new Date(date);
    t.setUTCHours(0, 0, 0, 0);

    const hc = 0.133 * rad;
    let h0 = getMoonAltitudeDeg(t, lat, lng) * rad - hc;
    let rise: number | undefined;
    let set: number | undefined;
    let ye = 0;

    for (let i = 1; i <= 24; i += 2) {
        const h1 = getMoonAltitudeDeg(hoursLater(t, i), lat, lng) * rad - hc;
        const h2 = getMoonAltitudeDeg(hoursLater(t, i + 1), lat, lng) * rad - hc;
        const a = (h0 + h2) / 2 - h1;
        const b = (h2 - h0) / 2;
        const xe = -b / (2 * a);
        ye = (a * xe + b) * xe + h1;
        const d = b * b - 4 * a * h1;
        let roots = 0;
        let x1 = 0;
        let x2 = 0;
        if (d >= 0) {
            const dx = Math.sqrt(d) / (Math.abs(a) * 2);
            x1 = xe - dx;
            x2 = xe + dx;
            if (Math.abs(x1) <= 1) roots++;
            if (Math.abs(x2) <= 1) roots++;
            if (x1 < -1) x1 = x2;
        }
        if (roots === 1) {
            if (h0 < 0) rise = i + x1;
            else set = i + x1;
        } else if (roots === 2) {
            rise = i + (ye < 0 ? x2 : x1);
            set = i + (ye < 0 ? x1 : x2);
        }
        if (rise !== undefined && set !== undefined) break;
        h0 = h2;
    }

    const result: MoonTimes = {};
    if (rise !== undefined) result.rise = hoursLater(t, rise);
    if (set !== undefined) result.set = hoursLater(t, set);
    if (rise === undefined && set === undefined) {
        if (ye > 0) result.alwaysUp = true; else result.alwaysDown = true;
    }
    return result;
}
