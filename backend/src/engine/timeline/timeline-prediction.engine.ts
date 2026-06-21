import {
    TimelineInput,
    TimelinePrediction
}
from "../../types/timeline.types";

export function predictTimeline(
    input: TimelineInput
): TimelinePrediction {

    let score = input.observationScore;

    if (input.cloudCover > 70) {
        score -= 30;
    }
    else if (input.cloudCover > 40) {
        score -= 15;
    }

    if (
        input.moonPhase === "Full Moon" &&
        input.moonAltitude > 20
    ) {
        score -= 20;
    }

    if (input.lightPollution >= 7) {
        score -= 15;
    }

    if (input.satelliteVisible) {
        score += 5;
    }

    score = Math.max(
        0,
        Math.min(score, 100)
    );

    let condition = "";
    let recommendation = "";

    if (score >= 80) {

        condition = "Excellent";

        recommendation =
            "Ideal conditions for observation.";

    }
    else if (score >= 60) {

        condition = "Good";

        recommendation =
            "Good visibility with moderate interference.";

    }
    else if (score >= 40) {

        condition = "Moderate";

        recommendation =
            "Observation possible but conditions are not optimal.";

    }
    else {

        condition = "Poor";

        recommendation =
            "Not recommended for astronomical observation.";

    }

    return {

        score,

        condition,

        recommendation

    };

}