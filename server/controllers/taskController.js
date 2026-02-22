import prisma from "../configs/prisma.js";
import { inngest } from "../inngest/index.js";

// Create task
export const createTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId, title, description, type, status, priority, assigneeId, due_date } = req.body;
        const origin = req.get('origin')

        // Check if user has admin role for project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } }
        })
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        } else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You don't have admin privileges for this project" });
        } else if (assigneeId && !project.members.find((member) => member.user.id === assigneeId)) {
            return res.status(403).json({ message: "assignee is not a member of the project / workspace" });
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
                due_date: due_date ? new Date(due_date) : null
            }
        })

        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: task.id },
            include: { assignee: true }
        })

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
            where: { id }
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const previousAssigneeId = task.assigneeId;

        // Check project permission
        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.team_lead !== userId) {
            return res.status(403).json({ message: "No permission" });
        }

        // ✅ Update task properly
        const updateData = { ...req.body };
        if (updateData.assigneeId !== undefined) {
            if (updateData.assigneeId && updateData.assigneeId !== "") {
                updateData.assignee = { connect: { id: updateData.assigneeId } };
            } else {
                updateData.assignee = { disconnect: true };
            }
            delete updateData.assigneeId;
        }

        const updatedTask = await prisma.task.update({
            where: { id },
            data: updateData
        });

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
        const { tasksIds } = req.body;
        const tasks = await prisma.task.findMany({
            where: { id: { in: tasksIds } }
        })
        if (tasks.length === 0) {
            return res.status(404).json({ message: "Tasks not found" });
        }
        const project = await prisma.project.findUnique({
            where: { id: tasks[0].projectId },
            include: { members: { include: { user: true } } }
        })
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        } else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You don't have admin privileges for this project" });
        }
        await prisma.task.deleteMany({
            where: { id: { in: tasksIds } }
        })

        res.json({ message: "Task deleted successfully" })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message })
    }
}