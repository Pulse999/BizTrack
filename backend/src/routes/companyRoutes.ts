import { Router } from "express";
import { getCompanyName, getAllCompanies } from "../controllers/companyController";
import { authRequired } from "../middleware/authMiddleware";

const router = Router();

router.get("/:id/name", authRequired, getCompanyName);
router.get("/", authRequired, getAllCompanies);

export default router;
