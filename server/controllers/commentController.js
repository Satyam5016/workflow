import prisma from "../configs/prisma.js";
import { createActivity } from "../utils/activityLogger.js";
import { createNotifications, taskLink } from "../utils/notificationService.js";

// Add comment
export const addComment = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { content, taskId } = req.body

    // check if user is projectmember
    const task = await prisma.task.findUnique({
      where: {id: taskId},
      include: { assignee: true }
    })

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await prisma.project.findUnique({
      where: {id: task.projectId},
      include: {members: {include: {user: true}}}
    })
    if (!project){
      return res.status(404).json({ message: "Project not found" });
    }

    const member = project.members.find((member) => member.userId === userId);

    if(!member){
      return res.status(403).json({ message: "You are not member of this project" });
    }

    const comment = await prisma.comment.create({
        data: {taskId, content, userId},
        include: {user: true}
    })

    await createActivity({
      action: "COMMENT_ADDED",
      message: `commented on "${task.title}"`,
      userId,
      workspaceId: project.workspaceId,
      projectId: task.projectId,
      taskId,
      metadata: {
        commentId: comment.id,
        preview: content.slice(0, 120),
      },
    });

    const recipientIds = new Set();
    if (task.assigneeId && task.assigneeId !== userId) {
      recipientIds.add(task.assigneeId);
    }
    project.members.forEach((member) => {
      if (member.userId !== userId) recipientIds.add(member.userId);
    });

    await createNotifications(Array.from(recipientIds).map((recipientId) => ({
      userId: recipientId,
      type: "COMMENT_ADDED",
      title: "New task comment",
      message: `${comment.user.name} commented on "${task.title}"`,
      link: taskLink(task),
      metadata: {
        taskId,
        projectId: task.projectId,
        commentId: comment.id,
      },
    })));

    res.status(201).json({ comment })

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message })
  }
}

// Get comments for task
export const getTaskComments = async (req, res) => {
  try {
    const {taskId} = req.params;
    const comments = await prisma.comment.findMany({
      where: {taskId}, include: {user: true}
    })

    res.json({comments})
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
}
