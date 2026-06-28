import express from "express";
import { createLabel, deleteLabel, getProjectLabels } from "../controllers/labelController.js";

const labelRouter = express.Router();

labelRouter.get("/project/:projectId", getProjectLabels);
labelRouter.post("/", createLabel);
labelRouter.delete("/:id", deleteLabel);

export default labelRouter;
