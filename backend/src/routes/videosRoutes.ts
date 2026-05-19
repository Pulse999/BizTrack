import express from "express";
import { getVideo } from "../controllers/videosController";
import { authRequired } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/:id", authRequired, getVideo);

export default router;
