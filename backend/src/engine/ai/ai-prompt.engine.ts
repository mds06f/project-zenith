import { AIContext } from "../../types/ai.types";

export function buildPrompt(
    context: AIContext
): string {

    return `
You are an astronomy assistant.

Observation Score: ${context.score}

Condition:
${context.condition}

Recommendation:
${context.recommendation}

Cloud Cover:
${context.cloudCover}%

Humidity:
${context.humidity}%

Wind Speed:
${context.windSpeed} km/h

Moon Phase:
${context.moonPhase}

Constellation:
${context.constellation}

Right Ascension:
${context.rightAscension}

Declination:
${context.declination}

Satellite Visible:
${context.satelliteVisible}

Generate a concise astronomy report.
`;

}