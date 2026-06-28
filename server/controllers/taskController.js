import prisma from "../configs/prisma.js";
import { inngest } from "../inngest/index.js";
import { buildChangeSet, createActivity, formatValue } from "../utils/activityLogger.js";
import { createNotification, taskLink } from "../utils/notificationService.js";
import { canAssignProjectTasks, canManageProjectTasks } from "../utils/permissions.js";

const taskHydrationInclude = {
    assignee: true,
    attachments: { include: { user: true }, orderBy: { createdAt: "desc" } },
    subtasks: { orderBy: { createdAt: "asc" } },
    milestone: true,
    labels: true,
    timeEntries: { include: { user: true }, orderBy: { loggedAt: "desc" } },
    dependsOn: { select: { id: true, title: true, status: true, due_date: true, priority: true } },
    blockedBy: { select: { id: true, title: true, status: true, due_date: true, priority: true } },
};

const normalizeDependencyIds = (dependencyIds = []) => {
    if (!Array.isArray(dependencyIds)) return [];
    return [...new Set(dependencyIds.filter(Boolean))];
};

const validateDependencyIds = async ({ dependencyIds, projectId, taskId }) => {
    const normalizedIds = normalizeDependencyIds(dependencyIds);
    if (taskId && normalizedIds.includes(taskId)) {
        return { error: "A task cannot depend on itself" };
    }
    if (normalizedIds.length === 0) return { dependencyIds: [] };

    const dependencies = await prisma.task.findMany({
        where: { id: { in: normalizedIds }, projectId },
        select: { id: true },
    });

    if (dependencies.length !== normalizedIds.length) {
        return { error: "One or more dependencies do not belong to this project" };
    }

    if (taskId) {
        const projectTasks = await prisma.task.findMany({
            where: { projectId },
            select: {
                id: true,
                dependsOn: { select: { id: true } },
            },
        });
        const dependencyMap = new Map(projectTasks.map((task) => [task.id, task.dependsOn.map((item) => item.id)]));
        dependencyMap.set(taskId, normalizedIds);

        const visits = new Set();
        const hasCycle = (currentId) => {
            const nextIds = dependencyMap.get(currentId) || [];
            for (const nextId of nextIds) {
                if (nextId === taskId) return true;
                if (visits.has(nextId)) continue;
                visits.add(nextId);
                if (hasCycle(nextId)) return true;
            }
            return false;
        };

        if (hasCycle(taskId)) {
            return { error: "This dependency would create a cycle" };
        }
    }

    return { dependencyIds: normalizedIds };
};

// Create task
export const createTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId, title, description, type, status, priority, assigneeId, due_date, milestoneId, labelIds = [], estimated_hours = 0, dependencyIds = [] } = req.body;
        const origin = req.get('origin')

        // Check if user has admin role for project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } }, workspace: { include: { members: true } } }
        })
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        } else if (!canManageProjectTasks(project, project.workspace, userId)) {
            return res.status(403).json({ message: "You don't have permission to create tasks in this project" });
        } else if (assigneeId && !project.members.find((member) => member.user.id === assigneeId)) {
            return res.status(403).json({ message: "assignee is not a member of the project / workspace" });
        } else if (assigneeId && !canAssignProjectTasks(project, project.workspace, userId)) {
            return res.status(403).json({ message: "You don't have permission to assign tasks" });
        }

        if (labelIds.length > 0) {
            const labelsCount = await prisma.label.count({
                where: { id: { in: labelIds }, projectId },
            });
            if (labelsCount !== labelIds.length) {
                return res.status(400).json({ message: "One or more labels do not belong to this project" });
            }
        }

        if (milestoneId) {
            const milestone = await prisma.milestone.findFirst({
                where: { id: milestoneId, projectId },
            });
            if (!milestone) {
                return res.status(400).json({ message: "Milestone does not belong to this project" });
            }
        }

        const dependencyValidation = await validateDependencyIds({ dependencyIds, projectId });
        if (dependencyValidation.error) {
            return res.status(400).json({ message: dependencyValidation.error });
        }

        // Database insertion
        console.log("Attempting to create task in DB:", { projectId, title, assigneeId });
        const task = await prisma.task.create({
            data: {
                project: { connect: { id: projectId } },
                title,
                description,
                priority,
                assignee: assigneeId ? { connect: { id: assigneeId } } : undefined,
                status,
                type,
                due_date: due_date ? new Date(due_date) : null,
                milestone: milestoneId ? { connect: { id: milestoneId } } : undefined,
                estimated_hours: Number(estimated_hours) || 0,
                labels: labelIds.length ? { connect: labelIds.map((id) => ({ id })) } : undefined,
                dependsOn: dependencyValidation.dependencyIds.length ? { connect: dependencyValidation.dependencyIds.map((id) => ({ id })) } : undefined
            }
        })

        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: task.id },
            include: taskHydrationInclude
        })

        await createActivity({
            action: "TASK_CREATED",
            message: `created task "${task.title}"`,
            userId,
            workspaceId: project.workspaceId,
            projectId,
            taskId: task.id,
            metadata: {
                title,
                status,
                priority,
                assigneeId: assigneeId || null,
                dependencyIds: dependencyValidation.dependencyIds,
            },
        });

        if (taskWithAssignee?.assigneeId) {
            await createNotification({
                userId: taskWithAssignee.assigneeId,
                type: "TASK_ASSIGNED",
                title: "New task assigned",
                message: `You were assigned "${task.title}"`,
                link: taskLink(task),
                metadata: {
                    taskId: task.id,
                    projectId,
                },
            });
        }

        console.log("Task created, sending Inngest event:", { taskId: task.id, origin });
        await inngest.send({
            name: "app/task.assigned",
            data: {
                taskId: task.id,
                origin
            }
        })

        res.json({ task: taskWithAssignee, message: "Task created successfully" })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message })
    }
}

//update task
export const updateTask = async (req, res) => {
    try {
        const { id } = req.params; // ✅ get from URL
        const origin = req.get('origin');

        if (!id) {
            return res.status(400).json({ message: "Task ID is required" });
        }

        const { userId } = await req.auth();

        // First get task
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                assignee: true,
                dependsOn: { select: { id: true } },
            }
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const previousAssigneeId = task.assigneeId;

        // Check project permission
        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } }, workspace: { include: { members: true } } }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (!canManageProjectTasks(project, project.workspace, userId)) {
            return res.status(403).json({ message: "You don't have permission to update tasks in this project" });
        }

        // ✅ Update task properly
        const updateData = { ...req.body };
        if (updateData.assigneeId !== undefined) {
            if (updateData.assigneeId && updateData.assigneeId !== "") {
                const isProjectMember = project.members.some((member) => member.user.id === updateData.assigneeId);
                if (!isProjectMember) {
                    return res.status(403).json({ message: "assignee is not a member of the project / workspace" });
                }
                if (!canAssignProjectTasks(project, project.workspace, userId)) {
                    return res.status(403).json({ message: "You don't have permission to assign tasks" });
                }
                updateData.assignee = { connect: { id: updateData.assigneeId } };
            } else {
                updateData.assignee = { disconnect: true };
            }
            delete updateData.assigneeId;
        }

        if (updateData.due_date) {
            updateData.due_date = new Date(updateData.due_date);
        }

        if (updateData.estimated_hours !== undefined) {
            const estimatedHours = Number(updateData.estimated_hours);
            if (Number.isNaN(estimatedHours) || estimatedHours < 0) {
                return res.status(400).json({ message: "Estimated hours must be zero or more" });
            }
            updateData.estimated_hours = estimatedHours;
        }

        if (updateData.milestoneId !== undefined) {
            if (updateData.milestoneId) {
                const milestone = await prisma.milestone.findFirst({
                    where: { id: updateData.milestoneId, projectId: task.projectId },
                });
                if (!milestone) {
                    return res.status(400).json({ message: "Milestone does not belong to this project" });
                }
                updateData.milestone = { connect: { id: updateData.milestoneId } };
            } else {
                updateData.milestone = { disconnect: true };
            }
            delete updateData.milestoneId;
        }

        if (updateData.labelIds !== undefined) {
            const labelIds = updateData.labelIds || [];
            if (labelIds.length > 0) {
                const labelsCount = await prisma.label.count({
                    where: { id: { in: labelIds }, projectId: task.projectId },
                });
                if (labelsCount !== labelIds.length) {
                    return res.status(400).json({ message: "One or more labels do not belong to this project" });
                }
            }
            updateData.labels = { set: labelIds.map((labelId) => ({ id: labelId })) };
            delete updateData.labelIds;
        }

        if (updateData.dependencyIds !== undefined) {
            const dependencyValidation = await validateDependencyIds({
                dependencyIds: updateData.dependencyIds,
                projectId: task.projectId,
                taskId: task.id,
            });
            if (dependencyValidation.error) {
                return res.status(400).json({ message: dependencyValidation.error });
            }
            updateData.dependsOn = { set: dependencyValidation.dependencyIds.map((dependencyId) => ({ id: dependencyId })) };
            delete updateData.dependencyIds;
        }

        const updatedTask = await prisma.task.update({
            where: { id },
            data: updateData,
            include: taskHydrationInclude
        });

        const changes = buildChangeSet(task, updatedTask, ["title", "description", "status", "priority", "type", "due_date", "estimated_hours", "milestoneId"]);

        if (task.status !== updatedTask.status) {
            await createActivity({
                action: "TASK_STATUS_CHANGED",
                message: `moved task "${updatedTask.title}" from ${formatValue(task.status)} to ${formatValue(updatedTask.status)}`,
                userId,
                workspaceId: project.workspaceId,
                projectId: updatedTask.projectId,
                taskId: updatedTask.id,
                metadata: { from: task.status, to: updatedTask.status },
            });
        }

        if (previousAssigneeId !== updatedTask.assigneeId) {
            await createActivity({
                action: "TASK_ASSIGNEE_CHANGED",
                message: `changed assignee for "${updatedTask.title}" from ${task.assignee?.name || "unassigned"} to ${updatedTask.assignee?.name || "unassigned"}`,
                userId,
                workspaceId: project.workspaceId,
                projectId: updatedTask.projectId,
                taskId: updatedTask.id,
                metadata: {
                    from: previousAssigneeId,
                    to: updatedTask.assigneeId,
                },
            });

            if (updatedTask.assigneeId) {
                await createNotification({
                    userId: updatedTask.assigneeId,
                    type: "TASK_ASSIGNED",
                    title: "Task assigned to you",
                    message: `You were assigned "${updatedTask.title}"`,
                    link: taskLink(updatedTask),
                    metadata: {
                        taskId: updatedTask.id,
                        projectId: updatedTask.projectId,
                    },
                });
            }
        }

        const genericChanges = Object.fromEntries(
            Object.entries(changes).filter(([field]) => !["status"].includes(field))
        );
        if (Object.keys(genericChanges).length > 0) {
            await createActivity({
                action: "TASK_UPDATED",
                message: `updated task "${updatedTask.title}"`,
                userId,
                workspaceId: project.workspaceId,
                projectId: updatedTask.projectId,
                taskId: updatedTask.id,
                metadata: { changes: genericChanges },
            });
        }

        if (req.body.labelIds !== undefined) {
            await createActivity({
                action: "TASK_LABELS_UPDATED",
                message: `updated labels for "${updatedTask.title}"`,
                userId,
                workspaceId: project.workspaceId,
                projectId: updatedTask.projectId,
                taskId: updatedTask.id,
                metadata: {
                    labelIds: req.body.labelIds,
                },
            });
        }

        if (req.body.milestoneId !== undefined) {
            await createActivity({
                action: "TASK_MILESTONE_UPDATED",
                message: `updated milestone for "${updatedTask.title}"`,
                userId,
                workspaceId: project.workspaceId,
                projectId: updatedTask.projectId,
                taskId: updatedTask.id,
                metadata: {
                    milestoneId: req.body.milestoneId || null,
                },
            });
        }

        if (req.body.dependencyIds !== undefined) {
            await createActivity({
                action: "TASK_DEPENDENCIES_UPDATED",
                message: `updated dependencies for "${updatedTask.title}"`,
                userId,
                workspaceId: project.workspaceId,
                projectId: updatedTask.projectId,
                taskId: updatedTask.id,
                metadata: {
                    dependencyIds: req.body.dependencyIds || [],
                },
            });
        }

        if (req.body.assigneeId && req.body.assigneeId !== previousAssigneeId) {
            await inngest.send({
                name: "app/task.assigned",
                data: {
                    taskId: updatedTask.id,
                    origin
                }
            })
        }

        res.json({
            task: updatedTask,
            message: "Task updated successfully"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

//delete task
export const deleteTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const tasksIds = req.body.tasksIds || req.body.taskIds || [];
        const tasks = await prisma.task.findMany({
            where: { id: { in: tasksIds } }
        })
        if (tasks.length === 0) {
            return res.status(404).json({ message: "Tasks not found" });
        }
        const project = await prisma.project.findUnique({
            where: { id: tasks[0].projectId },
            include: { members: { include: { user: true } }, workspace: { include: { members: true } } }
        })
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        } else if (!canManageProjectTasks(project, project.workspace, userId)) {
            return res.status(403).json({ message: "You don't have permission to delete tasks in this project" });
        }
        await prisma.task.deleteMany({
            where: { id: { in: tasksIds } }
        })

        await Promise.all(tasks.map((task) => createActivity({
            action: "TASK_DELETED",
            message: `deleted task "${task.title}"`,
            userId,
            workspaceId: project.workspaceId,
            projectId: task.projectId,
            taskId: null,
            metadata: {
                taskId: task.id,
                title: task.title,
            },
        })));

        res.json({ message: "Task deleted successfully" })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message })
    }
}
