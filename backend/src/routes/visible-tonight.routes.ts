import { Router } from "express";

import {
    visibleTonightController
}
from "../controllers/visible-tonight.controller";

const router = Router();

router.get(
    "/",
    visibleTonightController
);

export default router;