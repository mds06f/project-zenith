import { Router } from "express";
import { objectController } from "../controllers/object.controller";

const router = Router();

router.get("/:id", objectController);

export default router;
