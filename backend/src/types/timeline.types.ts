export interface TimelineInput {

    observationScore: number;

    cloudCover: number;

    moonAltitude: number;

    moonPhase: string;

    lightPollution: number;

    satelliteVisible: boolean;

}

export interface TimelinePrediction {

    score: number;

    condition: string;

    recommendation: string;

}