import prisma from "../configs/prisma.js";
import { userHasWorkspacePermission, WorkspacePermission } from "../utils/permissions.js";

const colorPattern = /^#[0-9a-fA-F]{6}$/;

const getProjectAccess = async (projectId, userId) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            members: true,
            workspace: { include: { members: true } },
        },
    });

    if (!project) return { error: { status: 404, message: "Project not found" } };

    const isProjectMember = project.members.some((member) => member.userId === userId);
    const workspaceMembership = project.workspace.members.find((member) => member.userId === userId);
    const isWorkspaceMember = Boolean(workspaceMembership);
    const canManage = project.team_lead === userId || userHasWorkspacePermission(project.workspace, userId, WorkspacePermission.MANAGE_LABELS);

    if (!isProjectMember && !isWorkspaceMember) {
        return { error: { status: 403, message: "You are not a member of this project" } };
    }

    return { project, canManage };
};

export const getProjectLabels = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;
        const { error } = await getProjectAccess(projectId, userId);

        if (error) return res.status(error.status).json({ message: error.message });

        const labels = await prisma.label.findMany({
            where: { projectId },
            orderBy: { name: "asc" },
        });

        res.json({ labels });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const createLabel = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId, name, color = "#3b82f6" } = req.body;

        if (!projectId || !name?.trim()) {
            return res.status(400).json({ message: "Project ID and label name are required" });
        }

        if (!colorPattern.test(color)) {
            return res.status(400).json({ message: "Label color must be a valid hex color" });
        }

        const { error, canManage } = await getProjectAccess(projectId, userId);
        if (error) return res.status(error.status).json({ message: error.message });
        if (!canManage) return res.status(403).json({ message: "Only project leads or workspace admins can create labels" });

        const label = await prisma.label.create({
            data: {
                projectId,
                name: name.trim().toLowerCase(),
                color,
            },
        });

        res.status(201).json({ label, message: "Label created" });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(400).json({ message: "A label with this name already exists" });
        }
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const deleteLabel = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { id } = req.params;

        const label = await prisma.label.findUnique({
            where: { id },
            include: { project: { include: { workspace: { include: { members: true } } } } },
        });

        if (!label) return res.status(404).json({ message: "Label not found" });

        const canManage = label.project.team_lead === userId || userHasWorkspacePermission(label.project.workspace, userId, WorkspacePermission.MANAGE_LABELS);

        if (!canManage) {
            return res.status(403).json({ message: "Only project leads or workspace admins can delete labels" });
        }

        await prisma.label.delete({ where: { id } });
        res.json({ message: "Label deleted" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};
