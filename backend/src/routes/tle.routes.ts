import { Router } from "express";
import { tleController } from "../controllers/tle.controller";

const router = Router();

router.get("/", tleController);

export default router;