import { Router } from "express";

import {
    astronomyController
}
from "../controllers/astronomy.controller";

const router = Router();

router.get(
    "/",
    astronomyController
);

export default router;