import express from "express";
import { createTimeEntry, deleteTimeEntry, getTaskTimeEntries, updateTaskEstimate } from "../controllers/timeEntryController.js";

const timeEntryRouter = express.Router();

timeEntryRouter.get("/task/:taskId", getTaskTimeEntries);
timeEntryRouter.put("/task/:taskId/estimate", updateTaskEstimate);
timeEntryRouter.post("/", createTimeEntry);
timeEntryRouter.delete("/:id", deleteTimeEntry);

export default timeEntryRouter;
