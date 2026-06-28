import prisma from "../configs/prisma.js";
import { clerkClient } from "@clerk/express";
import { createNotification } from "../utils/notificationService.js";
import { userHasWorkspacePermission, WorkspacePermission } from "../utils/permissions.js";

// Ensure the authenticated user and all of their Clerk org memberships
// exist in our DB. Lets the app work even when the Clerk → Inngest webhook
// hasn't fired yet (local dev, missing webhook secret, Inngest down, etc.).
const syncUserAndWorkspacesFromClerk = async (userId) => {
    let dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser) {
        const clerkUser = await clerkClient.users.getUser(userId);
        const email = clerkUser.emailAddresses?.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
            || clerkUser.emailAddresses?.[0]?.emailAddress;
        if (!email) return;
        dbUser = await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                email,
                name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email,
                image: clerkUser.imageUrl || "",
            },
        });
    }

    const { data: memberships } = await clerkClient.users.getOrganizationMembershipList({ userId });
    if (!memberships?.length) return;

    for (const membership of memberships) {
        const org = membership.organization;
        if (!org?.id) continue;

        await prisma.workspace.upsert({
            where: { id: org.id },
            update: {
                name: org.name,
                slug: org.slug,
                image_url: org.imageUrl || "",
            },
            create: {
                id: org.id,
                name: org.name,
                slug: org.slug,
                ownerId: org.createdBy || userId,
                image_url: org.imageUrl || "",
            },
        });

        const clerkRole = String(membership.role || "").toLowerCase();
        const role = clerkRole.includes("admin") ? "ADMIN" : clerkRole.includes("manager") ? "MANAGER" : "MEMBER";
        await prisma.workspaceMember.upsert({
            where: { userId_workspaceId: { userId, workspaceId: org.id } },
            update: { role },
            create: { userId, workspaceId: org.id, role },
        });
    }
};

// Get all workspaces for user
export const getUserWorkspaces = async (req, res) => {
    try {
        const { userId } = await req.auth();

        try {
            await syncUserAndWorkspacesFromClerk(userId);
        } catch (syncError) {
            console.error("Clerk → DB sync failed:", syncError?.message || syncError);
        }

        const workspaces = await prisma.workspace.findMany({
            where: {
                members: { some: { userId: userId } }
            },
            include: {
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: {
                            include: {
                                assignee: true,
                                comments: { include: { user: true } },
                                attachments: { include: { user: true }, orderBy: { createdAt: "desc" } },
                                subtasks: { orderBy: { createdAt: "asc" } },
                                milestone: true,
                                labels: true,
                                timeEntries: { include: { user: true }, orderBy: { loggedAt: "desc" } },
                                dependsOn: { select: { id: true, title: true, status: true, due_date: true, priority: true } },
                                blockedBy: { select: { id: true, title: true, status: true, due_date: true, priority: true } }
                            }
                        },
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
                        },
                        labels: { orderBy: { name: "asc" } },
                        members: { include: { user: true } },
                        activities: {
                            include: {
                                user: true,
                                task: { select: { id: true, title: true, status: true } },
                                project: { select: { id: true, name: true } }
                            },
                            orderBy: { createdAt: "desc" },
                            take: 20
                        }
                    }
                },
                activities: {
                    include: {
                        user: true,
                        task: { select: { id: true, title: true, status: true } },
                        project: { select: { id: true, name: true } }
                    },
                    orderBy: { createdAt: "desc" },
                    take: 30
                },
                owner: true
            }
        });
        res.json({ workspaces });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.code || error.message });
    }
}

// Add member to workspace
export const addMember = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { email, role, workspaceId, message } = req.body;

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        if (!workspaceId || !role) {
            return res.status(400).json({ message: "Missing required parameters" })
        }

        if (!["ADMIN", "MANAGER", "MEMBER"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" })
        }

        // fetch workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId }, include: { members: true }
        })

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" })
        }

        // Check creator has admin role
        if (!userHasWorkspacePermission(workspace, userId, WorkspacePermission.INVITE_MEMBERS)) {
            return res.status(401).json({
                message: "You do not have permission to invite workspace members"
            })
        }
        // Check if user is already a member
        const existingMember = workspace.members.find((member) => member.userId === user.id);

        if (existingMember) {
            return res.status(400).json({ message: "User is already a member" })
        }

        const member = await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId,
                role,
                message
            }
        })

        await createNotification({
            userId: user.id,
            type: "WORKSPACE_INVITE",
            title: "Added to workspace",
            message: `You were added to "${workspace.name}" as ${role.toLowerCase()}`,
            link: "/dashboard",
            metadata: {
                workspaceId,
                role,
            },
        });

        res.json({ member, message: "Member added successfully" })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message })
    }
}
