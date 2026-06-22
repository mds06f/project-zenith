import { Request, Response } from "express";

import { buildPrompt }
from "../engine/ai/ai-prompt.engine";

import { generateInsight }
from "../services/external/gemini.service";

export async function aiController(
    req: Request,
    res: Response
) {

    try {

        const prompt = buildPrompt({

            score: 91,

            condition: "Excellent",

            recommendation:
                "Ideal conditions for observation.",

            cloudCover: 8,

            humidity: 60,

            windSpeed: 9,

            moonPhase: "Waxing Crescent",

            constellation: "Taurus",

            rightAscension: "11 14 45.54",

            declination: "+03 15 39.5",

            satelliteVisible: true

        });

        const report =
            await generateInsight(
                prompt
            );

        res.status(200).json({

            report

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            error:
                "Failed to generate insight"

        });

    }

}