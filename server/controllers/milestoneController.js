import prisma from "../configs/prisma.js";
import { buildChangeSet, createActivity } from "../utils/activityLogger.js";
import { canManageProject } from "../utils/permissions.js";

const getProjectForMember = async (projectId, userId) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            members: true,
            workspace: { include: { members: true } },
        },
    });

    if (!project) return { error: { status: 404, message: "Project not found" } };

    const isProjectMember = project.members.some((member) => member.userId === userId);
    const isWorkspaceMember = project.workspace.members.some((member) => member.userId === userId);

    if (!isProjectMember && !isWorkspaceMember) {
        return { error: { status: 403, message: "You are not a member of this project" } };
    }

    return { project };
};

const milestoneInclude = {
    tasks: {
        include: {
            assignee: true,
            labels: true,
            timeEntries: { include: { user: true }, orderBy: { loggedAt: "desc" } },
            dependsOn: { select: { id: true, title: true, status: true, due_date: true, priority: true } },
            blockedBy: { select: { id: true, title: true, status: true, due_date: true, priority: true } },
        },
        orderBy: { due_date: "asc" },
    },
};

export const getProjectMilestones = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;
        const { error } = await getProjectForMember(projectId, userId);

        if (error) return res.status(error.status).json({ message: error.message });

        const milestones = await prisma.milestone.findMany({
            where: { projectId },
            include: milestoneInclude,
            orderBy: [{ due_date: "asc" }, { createdAt: "asc" }],
        });

        res.json({ milestones });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const createMilestone = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId, name, description, due_date } = req.body;

        if (!projectId || !name?.trim()) {
            return res.status(400).json({ message: "Project ID and milestone name are required" });
        }

        const { project, error } = await getProjectForMember(projectId, userId);
        if (error) return res.status(error.status).json({ message: error.message });
        if (!canManageProject(project, project.workspace, userId)) {
            return res.status(403).json({ message: "You don't have permission to create milestones" });
        }

        const milestone = await prisma.milestone.create({
            data: {
                projectId,
                name: name.trim(),
                description: description?.trim() || null,
                due_date: due_date ? new Date(due_date) : null,
            },
            include: milestoneInclude,
        });

        await createActivity({
            action: "MILESTONE_CREATED",
            message: `created milestone "${milestone.name}"`,
            userId,
            workspaceId: project.workspaceId,
            projectId,
            metadata: { milestoneId: milestone.id, name: milestone.name },
        });

        res.status(201).json({ milestone, message: "Milestone created" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const updateMilestone = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { id } = req.params;
        const { name, description, due_date } = req.body;

        const existingMilestone = await prisma.milestone.findUnique({
            where: { id },
            include: { project: { include: { workspace: { include: { members: true } }, members: true } } },
        });

        if (!existingMilestone) return res.status(404).json({ message: "Milestone not found" });
        if (!canManageProject(existingMilestone.project, existingMilestone.project.workspace, userId)) {
            return res.status(403).json({ message: "You don't have permission to update milestones" });
        }

        const updateData = {};
        if (name !== undefined) {
            if (!name.trim()) return res.status(400).json({ message: "Milestone name cannot be empty" });
            updateData.name = name.trim();
        }
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date) : null;

        const milestone = await prisma.milestone.update({
            where: { id },
            data: updateData,
            include: milestoneInclude,
        });

        const changes = buildChangeSet(existingMilestone, milestone, ["name", "description", "due_date"]);
        if (Object.keys(changes).length > 0) {
            await createActivity({
                action: "MILESTONE_UPDATED",
                message: `updated milestone "${milestone.name}"`,
                userId,
                workspaceId: existingMilestone.project.workspaceId,
                projectId: existingMilestone.projectId,
                metadata: { milestoneId: id, changes },
            });
        }

        res.json({ milestone, message: "Milestone updated" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const deleteMilestone = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { id } = req.params;

        const milestone = await prisma.milestone.findUnique({
            where: { id },
            include: { project: { include: { workspace: { include: { members: true } }, members: true } } },
        });

        if (!milestone) return res.status(404).json({ message: "Milestone not found" });
        if (!canManageProject(milestone.project, milestone.project.workspace, userId)) {
            return res.status(403).json({ message: "You don't have permission to delete milestones" });
        }

        await createActivity({
            action: "MILESTONE_DELETED",
            message: `deleted milestone "${milestone.name}"`,
            userId,
            workspaceId: milestone.project.workspaceId,
            projectId: milestone.projectId,
            metadata: { milestoneId: id, name: milestone.name },
        });

        await prisma.milestone.delete({ where: { id } });
        res.json({ message: "Milestone deleted" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};
