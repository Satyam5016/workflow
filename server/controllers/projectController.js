import prisma from "../configs/prisma.js";
import { buildChangeSet, createActivity } from "../utils/activityLogger.js";
import { createNotification, createNotifications, projectLink } from "../utils/notificationService.js";
import { canManageProject, userHasWorkspacePermission, WorkspacePermission } from "../utils/permissions.js";


// Create project
export const createProject = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { workspaceId, description, name, status, start_date, end_date,
            team_members, team_lead, progress, priority } = req.body;

        //check if user has admin role for workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true } } }
        })

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if (!userHasWorkspacePermission(workspace, userId, WorkspacePermission.CREATE_PROJECTS)) {
            return res.status(403).json({ message: "You don't have permission to create projects in this workspace" });
        }

        // Get Team Lead using email
        const teamLead = await prisma.user.findUnique({
            where: { email: team_lead },
            select: { id: true }
        })

        const project = await prisma.project.create({
            data: {
                workspaceId,
                name,
                description,
                status,
                priority,
                progress,
                team_lead: teamLead?.id,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
            }
        })

        // Add members to project if they are in the workspace
        if (team_members?.length > 0) {
            const membersToAdd = []
            workspace.members.forEach(member => {
                if (team_members.includes(member.user.email)) {
                    membersToAdd.push(member.user.id)
                }
            })
            await prisma.projectMember.createMany({
                data: membersToAdd.map((memberId) => ({
                    projectId: project.id,
                    userId: memberId
                }))
            })
        }

        const projectWithMembers = await prisma.project.findUnique({
            where: { id: project.id },
            include: {
                members: { include: { user: true } },
                tasks: {
                    include: {
                        assignee: true,
                        attachments: { include: { user: true }, orderBy: { createdAt: "desc" } },
                        subtasks: { orderBy: { createdAt: "asc" } },
                        milestone: true,
                        labels: true,
                        timeEntries: { include: { user: true }, orderBy: { loggedAt: "desc" } },
                        dependsOn: { select: { id: true, title: true, status: true, due_date: true, priority: true } },
                        blockedBy: { select: { id: true, title: true, status: true, due_date: true, priority: true } },
                        comments: {
                            include: {
                                user:
                                    true
                            }
                        }
                    }
                },
                owner: true,
                labels: { orderBy: { name: "asc" } },
                milestones: {
                    include: {
                        tasks: {
                            include: {
                                assignee: true,
                                labels: true,
                                dependsOn: { select: { id: true, title: true, status: true } },
                                blockedBy: { select: { id: true, title: true, status: true } },
                            }
                        }
                    },
                    orderBy: [{ due_date: "asc" }, { createdAt: "asc" }]
                }
            }
        })

        await createActivity({
            action: "PROJECT_CREATED",
            message: `created project "${project.name}"`,
            userId,
            workspaceId,
            projectId: project.id,
            metadata: {
                name,
                status,
                priority,
                teamLeadId: teamLead?.id || null,
            },
        });

        res.json({ project: projectWithMembers, message: "Project created successfully" })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message })
    }
}

// Update project
export const updateProject = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { id, workspaceId, description, name, status, start_date, end_date,
            progress, priority } = req.body;

        // check if user has admin role for workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true } } }
        })

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }
        const existingProject = await prisma.project.findUnique({
            where: { id }
        })

        if (!existingProject) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (!canManageProject(existingProject, workspace, userId)) {
            return res.status(403).json({
                message: "You don't have permission to update this project"
            });
        }
        const project = await prisma.project.update({
            where: { id },
            data: {
                workspaceId,
                description,
                name,
                status,
                priority,
                progress,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
            }
        })

        const changes = buildChangeSet(existingProject, project, [
            "name",
            "description",
            "status",
            "priority",
            "progress",
            "start_date",
            "end_date",
        ]);

        if (Object.keys(changes).length > 0) {
            await createActivity({
                action: "PROJECT_UPDATED",
                message: `updated project "${project.name}"`,
                userId,
                workspaceId,
                projectId: id,
                metadata: { changes },
            });

            const projectMembers = await prisma.projectMember.findMany({
                where: { projectId: id, userId: { not: userId } },
            });

            await createNotifications(projectMembers.map((member) => ({
                userId: member.userId,
                type: "PROJECT_UPDATED",
                title: "Project updated",
                message: `"${project.name}" was updated`,
                link: projectLink(id, "activity"),
                metadata: {
                    projectId: id,
                    changes,
                },
            })));
        }

        res.json({ project, message: "Project updated successfully" })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message })
    }
}

//add member to project
export const addMember = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;
        const { email } = req.body;

        // Check if user is project lead
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } }, workspace: { include: { members: true } } }
        })

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        if (!canManageProject(project, project.workspace, userId)) {
            return res.status(403).json({ message: "You don't have permission to add project members" });
        }

        // Check if user is already a member
        const existingMember = project.members.find((member) => member.user.email === email)

        if (existingMember) {
            return res.status(400).json({ message: "User is already a member" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const member = await prisma.projectMember.create({
            data: {
                userId: user.id,
                projectId
            }
        })

        await createActivity({
            action: "PROJECT_MEMBER_ADDED",
            message: `added ${user.name} to project "${project.name}"`,
            userId,
            workspaceId: project.workspaceId,
            projectId,
            metadata: {
                addedUserId: user.id,
                addedUserEmail: user.email,
            },
        });

        await createNotification({
            userId: user.id,
            type: "PROJECT_MEMBER_ADDED",
            title: "Added to project",
            message: `You were added to "${project.name}"`,
            link: projectLink(projectId),
            metadata: {
                projectId,
            },
        });

        res.json({ member, message: "Member added successfully" })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message })
    }
}

// Delete project
export const deleteProject = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { workspace: { include: { members: true } } }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const canDelete = project.team_lead === userId || userHasWorkspacePermission(project.workspace, userId, WorkspacePermission.DELETE_PROJECTS);

        if (!canDelete) {
            return res.status(403).json({ message: "You don't have permission to delete this project" });
        }

        await createActivity({
            action: "PROJECT_UPDATED",
            message: `deleted project "${project.name}"`,
            userId,
            workspaceId: project.workspaceId,
            projectId: null,
            metadata: {
                deleted: true,
                projectId: project.id,
                name: project.name,
            },
        });

        await prisma.project.delete({ where: { id: projectId } });

        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};
