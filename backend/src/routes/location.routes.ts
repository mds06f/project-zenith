import { Router } from "express";
import {
    locationSearchController,
    reverseGeocodeController
} from "../controllers/location.controller";

const router = Router();

router.get("/search", locationSearchController);
router.get("/:lat/:lng", reverseGeocodeController);

export default router;
