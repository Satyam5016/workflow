import express from "express";
import { createSubtask, deleteSubtask, getTaskSubtasks, updateSubtask } from "../controllers/subtaskController.js";

const subtaskRouter = express.Router();

subtaskRouter.get("/task/:taskId", getTaskSubtasks);
subtaskRouter.post("/", createSubtask);
subtaskRouter.put("/:id", updateSubtask);
subtaskRouter.delete("/:id", deleteSubtask);

export default subtaskRouter;
