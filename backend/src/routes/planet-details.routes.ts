import { Router } from "express";

import {
    planetDetailsController
}
from "../controllers/planet-details.controller";

const router = Router();

router.get(
    "/:body",
    planetDetailsController
);

export default router;