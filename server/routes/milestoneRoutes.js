import express from "express";
import { createMilestone, deleteMilestone, getProjectMilestones, updateMilestone } from "../controllers/milestoneController.js";

const milestoneRouter = express.Router();

milestoneRouter.get("/project/:projectId", getProjectMilestones);
milestoneRouter.post("/", createMilestone);
milestoneRouter.put("/:id", updateMilestone);
milestoneRouter.delete("/:id", deleteMilestone);

export default milestoneRouter;
