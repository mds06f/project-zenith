import { Router } from "express";
import { observationController } from "../controllers/observation.controller";

const router = Router();

router.get("/", observationController);

export default router;