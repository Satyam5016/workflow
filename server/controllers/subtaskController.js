import prisma from "../configs/prisma.js";
import { createActivity } from "../utils/activityLogger.js";

const getTaskForMember = async (taskId, userId) => {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            project: {
                include: {
                    members: true,
                    workspace: { include: { members: true } },
                },
            },
        },
    });

    if (!task) return { error: { status: 404, message: "Task not found" } };

    const isProjectMember = task.project.members.some((member) => member.userId === userId);
    const isWorkspaceMember = task.project.workspace.members.some((member) => member.userId === userId);

    if (!isProjectMember && !isWorkspaceMember) {
        return { error: { status: 403, message: "You are not a member of this task's project" } };
    }

    return { task };
};

export const getTaskSubtasks = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { taskId } = req.params;
        const { error } = await getTaskForMember(taskId, userId);

        if (error) return res.status(error.status).json({ message: error.message });

        const subtasks = await prisma.subtask.findMany({
            where: { taskId },
            orderBy: { createdAt: "asc" },
        });

        res.json({ subtasks });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const createSubtask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { taskId, title } = req.body;

        if (!taskId || !title?.trim()) {
            return res.status(400).json({ message: "Task ID and title are required" });
        }

        const { task, error } = await getTaskForMember(taskId, userId);
        if (error) return res.status(error.status).json({ message: error.message });

        const subtask = await prisma.subtask.create({
            data: {
                taskId,
                title: title.trim(),
            },
        });

        await createActivity({
            action: "SUBTASK_ADDED",
            message: `added checklist item "${subtask.title}" to "${task.title}"`,
            userId,
            workspaceId: task.project.workspaceId,
            projectId: task.projectId,
            taskId,
            metadata: {
                subtaskId: subtask.id,
                title: subtask.title,
            },
        });

        res.status(201).json({ subtask, message: "Checklist item added" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const updateSubtask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { id } = req.params;
        const { title, completed } = req.body;

        const existingSubtask = await prisma.subtask.findUnique({
            where: { id },
            include: {
                task: {
                    include: {
                        project: {
                            include: {
                                members: true,
                                workspace: { include: { members: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!existingSubtask) {
            return res.status(404).json({ message: "Checklist item not found" });
        }

        const { task } = existingSubtask;
        const isProjectMember = task.project.members.some((member) => member.userId === userId);
        const isWorkspaceMember = task.project.workspace.members.some((member) => member.userId === userId);

        if (!isProjectMember && !isWorkspaceMember) {
            return res.status(403).json({ message: "You are not a member of this task's project" });
        }

        const updateData = {};
        if (title !== undefined) {
            if (!title.trim()) return res.status(400).json({ message: "Title cannot be empty" });
            updateData.title = title.trim();
        }
        if (completed !== undefined) updateData.completed = Boolean(completed);

        const subtask = await prisma.subtask.update({
            where: { id },
            data: updateData,
        });

        await createActivity({
            action: "SUBTASK_UPDATED",
            message: `${subtask.completed ? "completed" : "updated"} checklist item "${subtask.title}" on "${task.title}"`,
            userId,
            workspaceId: task.project.workspaceId,
            projectId: task.projectId,
            taskId: task.id,
            metadata: {
                subtaskId: subtask.id,
                completed: subtask.completed,
            },
        });

        res.json({ subtask, message: "Checklist item updated" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const deleteSubtask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { id } = req.params;

        const subtask = await prisma.subtask.findUnique({
            where: { id },
            include: {
                task: {
                    include: {
                        project: {
                            include: {
                                members: true,
                                workspace: { include: { members: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!subtask) {
            return res.status(404).json({ message: "Checklist item not found" });
        }

        const { task } = subtask;
        const isProjectMember = task.project.members.some((member) => member.userId === userId);
        const isWorkspaceMember = task.project.workspace.members.some((member) => member.userId === userId);

        if (!isProjectMember && !isWorkspaceMember) {
            return res.status(403).json({ message: "You are not a member of this task's project" });
        }

        await prisma.subtask.delete({ where: { id } });

        await createActivity({
            action: "SUBTASK_DELETED",
            message: `deleted checklist item "${subtask.title}" from "${task.title}"`,
            userId,
            workspaceId: task.project.workspaceId,
            projectId: task.projectId,
            taskId: task.id,
            metadata: {
                subtaskId: subtask.id,
                title: subtask.title,
            },
        });

        res.json({ message: "Checklist item deleted" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};
