import {
    Request,
    Response
} from "express";

import {
    getPlanetDetails
}
from "../services/aggregation/planet-details.service";

export async function planetDetailsController(
    req: Request,
    res: Response
) {

    try {

        const body = Array.isArray(
            req.params.body
        )
            ? req.params.body[0]
            : req.params.body;

        if (!body) {

            return res
                .status(400)
                .json({

                    error:
                        "Celestial body is required"

                });

        }

        const details =
            await getPlanetDetails(
                body
            );

        return res
            .status(200)
            .json(
                details
            );

    }

    catch (error) {

        console.error(
            "Planet details generation failed:",
            error
        );

        return res
            .status(500)
            .json({

                error:
                    "Failed to fetch planet details"

            });

    }

}