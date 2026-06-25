import { Router } from "express";
import { reportController } from "../controllers/report.controller";

const router = Router();

router.get("/:lat/:lng", reportController);

export default router;
