import { Router } from "express";

import {
    satelliteController,
    satellitePositionController
} from "../controllers/satellite.controller";

const router = Router();

router.get("/iss", satelliteController);

router.get(
    "/position",
    satellitePositionController
);

export default router;