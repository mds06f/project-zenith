import { Request, Response } from "express";

import {
    getVisibleTonight
} from "../services/aggregation/visible-tonight.service";

export async function visibleTonightController(
    req: Request,
    res: Response
) {

    try {

        const visibleTonight =
            await getVisibleTonight();

        res
            .status(200)
            .json(
                visibleTonight
            );

    } catch (error) {

        console.error(error);

        res
            .status(500)
            .json({

                error:
                    "Failed to fetch visible objects"

            });

    }

}