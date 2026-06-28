import prisma from "../configs/prisma.js";

const activityInclude = {
    user: true,
    project: { select: { id: true, name: true } },
    task: { select: { id: true, title: true, status: true } },
};

export const getWorkspaceActivities = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { workspaceId } = req.params;
        const limit = Math.min(Number(req.query.limit) || 30, 100);

        const membership = await prisma.workspaceMember.findUnique({
            where: { userId_workspaceId: { userId, workspaceId } },
        });

        if (!membership) {
            return res.status(403).json({ message: "You are not a member of this workspace" });
        }

        const activities = await prisma.activity.findMany({
            where: { workspaceId },
            include: activityInclude,
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        res.json({ activities });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const getProjectActivities = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;
        const limit = Math.min(Number(req.query.limit) || 50, 100);

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: true, workspace: { include: { members: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isProjectMember = project.members.some((member) => member.userId === userId);
        const isWorkspaceMember = project.workspace.members.some((member) => member.userId === userId);

        if (!isProjectMember && !isWorkspaceMember) {
            return res.status(403).json({ message: "You are not a member of this project" });
        }

        const activities = await prisma.activity.findMany({
            where: { projectId },
            include: activityInclude,
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        res.json({ activities });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};
