import { Router } from "express";

import {
    celestialController
} from "../controllers/celestial.controller";

const router = Router();

router.get(
    "/",
    celestialController
);

export default router;