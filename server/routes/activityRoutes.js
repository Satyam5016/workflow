import express from "express";
import { getProjectActivities, getWorkspaceActivities } from "../controllers/activityController.js";

const activityRouter = express.Router();

activityRouter.get("/workspace/:workspaceId", getWorkspaceActivities);
activityRouter.get("/project/:projectId", getProjectActivities);

export default activityRouter;
