import { ObservationData } from "../../types/observation.types";

export function calculateObservationScore(
    cloudCover: number,
    humidity: number,
    windSpeed: number
): ObservationData {

    let score = 100;

    // Penalize clouds heavily
    score -= cloudCover * 0.5;

    // Humidity penalty
    score -= humidity * 0.2;

    // Wind penalty
    score -= windSpeed * 0.3;

    score = Math.max(0, Math.round(score));

    let condition = "";
    let recommendation = "";

    if (score >= 80) {
        condition = "Excellent";
        recommendation = "Perfect night for observation.";
    } else if (score >= 60) {
        condition = "Good";
        recommendation = "Good viewing conditions.";
    } else if (score >= 40) {
        condition = "Fair";
        recommendation = "Some objects may be difficult to observe.";
    } else {
        condition = "Poor";
        recommendation = "Observation not recommended.";
    }

    return {
        score,
        condition,
        recommendation
    };
}