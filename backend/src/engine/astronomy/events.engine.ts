/**
 * Upcoming Events generator.
 *
 * Produces the real astronomical events the blueprint asks for, computed from
 * the location + target time with the SunCalc engine (no external API, no key):
 *   - Sunset
 *   - Astronomical twilight / "dark sky begins"
 *   - Moonrise / Moonset
 *   - Moon phase (name + illuminated %)
 *   - Next major meteor shower (real annual peak calendar)
 *   - ISS visible pass (when N2YO supplied one upstream)
 *
 * Everything is timeline-aware: pass a different `when` and the sun/moon times,
 * moon phase and "next shower" all shift accordingly.
 */
import { CelestialEvent, CelestialObject, Location } from "../../types/report.types";
import {
    getSunTimes,
    getMoonTimes,
    getMoonIllumination,
    moonPhaseName
} from "./suncalc.engine";

// Real annual meteor-shower peaks (month is 1-based). Dates are the widely-cited
// peak nights; good enough to surface "the next shower" accurately.
const METEOR_SHOWERS: { name: string; month: number; day: number }[] = [
    { name: "Quadrantids", month: 1, day: 3 },
    { name: "Lyrids", month: 4, day: 22 },
    { name: "Eta Aquariids", month: 5, day: 6 },
    { name: "Delta Aquariids", month: 7, day: 30 },
    { name: "Perseids", month: 8, day: 12 },
    { name: "Draconids", month: 10, day: 8 },
    { name: "Orionids", month: 10, day: 21 },
    { name: "Leonids", month: 11, day: 17 },
    { name: "Geminids", month: 12, day: 14 },
    { name: "Ursids", month: 12, day: 22 }
];

interface Candidate {
    at: Date;
    kind: CelestialEvent["kind"];
    title: string;
    /** Optional override for the right-hand label (e.g. "78% lit"). */
    label?: string;
}

/** Earliest of a named sun/moon time across today and tomorrow that is > when. */
function nextSunTime(
    key: string,
    when: Date,
    lat: number,
    lng: number
): Date | null {
    for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
        const day = new Date(when.getTime() + dayOffset * 86400000);
        const t = getSunTimes(day, lat, lng)[key];
        if (t && !isNaN(t.getTime()) && t.getTime() > when.getTime()) return t;
    }
    return null;
}

function nextMoonTime(
    key: "rise" | "set",
    when: Date,
    lat: number,
    lng: number
): Date | null {
    for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
        const day = new Date(when.getTime() + dayOffset * 86400000);
        const t = getMoonTimes(day, lat, lng)[key];
        if (t && !isNaN(t.getTime()) && t.getTime() > when.getTime()) return t;
    }
    return null;
}

function nextMeteorShower(when: Date): Candidate {
    const year = when.getUTCFullYear();
    for (const yr of [year, year + 1]) {
        for (const s of METEOR_SHOWERS) {
            const at = new Date(Date.UTC(yr, s.month - 1, s.day, 4, 0, 0));
            if (at.getTime() >= when.getTime()) {
                return { at, kind: "meteor_shower", title: `${s.name} Meteor Shower` };
            }
        }
    }
    // Unreachable, but keep the type total.
    const fallback = METEOR_SHOWERS[0]!;
    return {
        at: new Date(Date.UTC(year + 1, fallback.month - 1, fallback.day, 4, 0, 0)),
        kind: "meteor_shower",
        title: `${fallback.name} Meteor Shower`
    };
}

/** Local clock time ("8:24 PM") for near events, calendar date ("Aug 12") for far ones. */
function relativeLabel(at: Date, when: Date, timezone: string): string {
    const diffMin = (at.getTime() - when.getTime()) / 60000;
    const tz = timezone || "UTC";
    try {
        if (diffMin < 18 * 60) {
            return new Intl.DateTimeFormat("en-US", {
                timeZone: tz, hour: "numeric", minute: "2-digit"
            }).format(at);
        }
        return new Intl.DateTimeFormat("en-US", {
            timeZone: tz, month: "short", day: "numeric"
        }).format(at);
    } catch {
        // Bad/unknown IANA zone → fall back to a coarse relative label.
        if (diffMin < 60) return `${Math.round(diffMin)} min`;
        if (diffMin < 24 * 60) return `${Math.round(diffMin / 60)}h`;
        return `${Math.round(diffMin / 1440)}d`;
    }
}

/**
 * Build the ordered Upcoming Events feed for a location at a target time.
 * @param iss optional ISS object; if it has a visibility window we surface the pass.
 */
export function buildAstronomicalEvents(
    location: Location,
    when: Date,
    iss?: CelestialObject | null
): CelestialEvent[] {
    const { lat, lng, timezone } = location;
    const candidates: Candidate[] = [];

    // ISS visible pass (only when N2YO gave us a real window upstream).
    if (iss?.visibility) {
        candidates.push({
            at: new Date(iss.visibility.start),
            kind: "iss_pass",
            title: "ISS Visible Pass"
        });
    }

    const sunset = nextSunTime("sunset", when, lat, lng);
    if (sunset) candidates.push({ at: sunset, kind: "sunset", title: "Sunset" });

    const night = nextSunTime("night", when, lat, lng);
    if (night) candidates.push({ at: night, kind: "twilight", title: "Astronomical Twilight" });

    const moonrise = nextMoonTime("rise", when, lat, lng);
    if (moonrise) candidates.push({ at: moonrise, kind: "moonrise", title: "Moonrise" });

    const moonset = nextMoonTime("set", when, lat, lng);
    if (moonset) candidates.push({ at: moonset, kind: "moonset", title: "Moonset" });

    candidates.push(nextMeteorShower(when));

    // Moon phase — informational "now" entry with the illuminated fraction.
    const illum = getMoonIllumination(when);
    candidates.push({
        at: when,
        kind: "moon_phase",
        title: moonPhaseName(illum.phase),
        label: `${Math.round(illum.fraction * 100)}% lit`
    });

    return candidates
        .filter((c) => c.at.getTime() >= when.getTime() - 60_000) // drop already-past
        .sort((a, b) => a.at.getTime() - b.at.getTime())
        .slice(0, 6)
        .map((c, i): CelestialEvent => ({
            id: `e-${c.kind}-${i}`,
            kind: c.kind,
            title: c.title,
            at: c.at.toISOString(),
            relativeLabel: c.label ?? relativeLabel(c.at, when, timezone)
        }));
}
