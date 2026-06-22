import {
    ObservationData,
    ObservationFactors
} from "../../types/observation.types";

export function computeObservationScore(
    factors: ObservationFactors
): ObservationData {

    let score = 100;

    // Clouds hurt the most
    score -= factors.cloudCover * 0.5;

    // Moonlight hurts faint objects
    score -= factors.moonIllumination * 0.2;

    // Light pollution
    score -= (factors.bortleClass - 1) * 5;

    // Visibility bonus/penalty
    score -= Math.max(0, 10 - factors.visibility) * 3;

    score = Math.max(0, Math.round(score));

    let condition = "Very Poor";

    if (score >= 85)
        condition = "Excellent";
    else if (score >= 70)
        condition = "Good";
    else if (score >= 50)
        condition = "Fair";
    else if (score >= 30)
        condition = "Poor";

    return {
        score,
        condition
    };

}