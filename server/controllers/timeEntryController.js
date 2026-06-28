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

const getActualHours = async (taskId) => {
    const result = await prisma.timeEntry.aggregate({
        where: { taskId },
        _sum: { hours: true },
    });

    return result._sum.hours || 0;
};

export const getTaskTimeEntries = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { taskId } = req.params;
        const { task, error } = await getTaskForMember(taskId, userId);

        if (error) return res.status(error.status).json({ message: error.message });

        const [entries, actualHours] = await Promise.all([
            prisma.timeEntry.findMany({
                where: { taskId },
                include: { user: { select: { id: true, name: true, email: true, image: true } } },
                orderBy: { loggedAt: "desc" },
            }),
            getActualHours(taskId),
        ]);

        res.json({ entries, actualHours, estimatedHours: task.estimated_hours });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const updateTaskEstimate = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { taskId } = req.params;
        const estimatedHours = Number(req.body.estimatedHours);

        if (Number.isNaN(estimatedHours) || estimatedHours < 0) {
            return res.status(400).json({ message: "Estimated hours must be zero or more" });
        }

        const { task, error } = await getTaskForMember(taskId, userId);
        if (error) return res.status(error.status).json({ message: error.message });

        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: { estimated_hours: estimatedHours },
            include: {
                assignee: true,
                attachments: { include: { user: true } },
                subtasks: { orderBy: { createdAt: "asc" } },
                labels: true,
                timeEntries: { include: { user: true }, orderBy: { loggedAt: "desc" } },
                dependsOn: { select: { id: true, title: true, status: true, due_date: true, priority: true } },
                blockedBy: { select: { id: true, title: true, status: true, due_date: true, priority: true } },
            },
        });

        await createActivity({
            action: "TIME_ESTIMATE_UPDATED",
            message: `updated time estimate for "${task.title}" to ${estimatedHours}h`,
            userId,
            workspaceId: task.project.workspaceId,
            projectId: task.projectId,
            taskId,
            metadata: {
                from: task.estimated_hours,
                to: estimatedHours,
            },
        });

        res.json({ task: updatedTask, estimatedHours, message: "Estimate updated" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const createTimeEntry = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { taskId, hours, note, loggedAt } = req.body;
        const numericHours = Number(hours);

        if (!taskId || Number.isNaN(numericHours) || numericHours <= 0) {
            return res.status(400).json({ message: "Task ID and positive hours are required" });
        }

        if (numericHours > 24) {
            return res.status(400).json({ message: "A single time entry cannot exceed 24 hours" });
        }

        const { task, error } = await getTaskForMember(taskId, userId);
        if (error) return res.status(error.status).json({ message: error.message });

        const entry = await prisma.timeEntry.create({
            data: {
                taskId,
                userId,
                hours: numericHours,
                note: note?.trim() || null,
                loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
            },
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
        });

        const actualHours = await getActualHours(taskId);

        await createActivity({
            action: "TIME_LOGGED",
            message: `logged ${numericHours}h on "${task.title}"`,
            userId,
            workspaceId: task.project.workspaceId,
            projectId: task.projectId,
            taskId,
            metadata: {
                timeEntryId: entry.id,
                hours: numericHours,
                actualHours,
            },
        });

        res.status(201).json({ entry, actualHours, message: "Time logged" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const deleteTimeEntry = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { id } = req.params;

        const entry = await prisma.timeEntry.findUnique({
            where: { id },
            include: {
                task: {
                    include: {
                        project: {
                            include: { workspace: { include: { members: true } } },
                        },
                    },
                },
            },
        });

        if (!entry) return res.status(404).json({ message: "Time entry not found" });

        const workspaceMembership = entry.task.project.workspace.members.find((member) => member.userId === userId);
        const canDelete = entry.userId === userId || entry.task.project.team_lead === userId || workspaceMembership?.role === "ADMIN";

        if (!canDelete) {
            return res.status(403).json({ message: "Only the logger, project lead, or workspace admin can delete this time entry" });
        }

        await prisma.timeEntry.delete({ where: { id } });
        const actualHours = await getActualHours(entry.taskId);

        await createActivity({
            action: "TIME_ENTRY_DELETED",
            message: `deleted ${entry.hours}h time entry from "${entry.task.title}"`,
            userId,
            workspaceId: entry.task.project.workspaceId,
            projectId: entry.task.projectId,
            taskId: entry.taskId,
            metadata: {
                timeEntryId: entry.id,
                hours: entry.hours,
                actualHours,
            },
        });

        res.json({ actualHours, message: "Time entry deleted" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};
