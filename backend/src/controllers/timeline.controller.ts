import { Request, Response } from "express";

import {
    predictTimeline
}
from "../engine/timeline/timeline-prediction.engine";

export function timelineController(
    req: Request,
    res: Response
) {

    const prediction = predictTimeline({

        observationScore: 85,

        cloudCover: 20,

        moonAltitude: 10,

        moonPhase: "Waxing Crescent",

        lightPollution: 4,

        satelliteVisible: true

    });

    res.status(200).json(
        prediction
    );

}