import { Inngest } from "inngest";
import prisma from "../configs/prisma.js"; // adjust path if needed
import sendEmail from "../configs/nodemailer.js";
import { createNotification, taskLink } from "../utils/notificationService.js";
// Create a client to send and receive events
export const inngest = new Inngest({ id: "work--flow" });

const DAY_BEFORE_DEADLINE_MS = 24 * 60 * 60 * 1000;

const normalizeWorkspaceRole = (role = "") => {
  const normalized = String(role).toLowerCase();
  if (normalized.includes("admin")) return "ADMIN";
  if (normalized.includes("manager")) return "MANAGER";
  return "MEMBER";
};

const buildTaskEmail = ({ task, taskUrl, intro, footer }) => `<div style="max-width: 600px;">
  <h2>Hi ${task.assignee.name},</h2>

  <p style="font-size: 16px;">${intro}</p>
  <p style="font-size: 18px; font-weight: bold; color: #007bff; margin: 8px 0;">${task.title}</p>

  <div style="border: 1px solid #ddd; padding: 12px 16px; border-radius: 6px; margin-bottom: 30px;">
    <p style="margin: 6px 0;"><strong>Project:</strong> ${task.project.name}</p>
    <p style="margin: 6px 0;"><strong>Description:</strong> ${task.description || "No description"}</p>
    <p style="margin: 6px 0;"><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>
  </div>

  <a href="${taskUrl}" style="background-color: #007bff; padding: 12px 24px; border-radius: 5px; color: #fff; font-weight: 600; font-size: 16px; text-decoration: none;">
    View Task
  </a>

  <p style="margin-top: 20px; font-size: 14px; color: #6c757d;">
    ${footer}
  </p>
</div>`;


// Inngest Function to save user data to a database
const syncUserCreation = inngest.createFunction(
  { id: 'sync-user-from-clerk' },
  { event: 'clerk/user.created' },
  async ({ event }) => {
    const { data } = event
    await prisma.user.create({
      data: {
        id: data.id,
        email: data?.email_addresses[0]?.email_address,
        name: data?.first_name + " " + data?.last_name,
        image: data?.image_url,
      }
    })
  }
)

// Inngest Function to delete user from database
const syncUserDeletion = inngest.createFunction(
  { id: 'delete-user-with-clerk' },
  { event: 'clerk/user.deleted' },
  async ({ event }) => {
    const { data } = event
    await prisma.user.delete({
      where: {
        id: data.id,
      }
    })
  }
)

// Inngest Function to update user data in database
const syncUserUpdation = inngest.createFunction(
  { id: 'update-user-from-clerk' },
  { event: 'clerk/user.updated' },
  async ({ event }) => {
    const { data } = event
    await prisma.user.update({
      where: {
        id: data.id
      },
      data: {
        email: data?.email_addresses[0]?.email_address,
        name: data?.first_name + " " + data?.last_name,
        image: data?.image_url,
      }
    })
  }
)

// Inngest Function to save workspace data to a database
const syncWorkspaceCreation = inngest.createFunction(
  { id: 'sync-workspace-from-clerk' },
  { event: 'clerk/organization.created' },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url,
      }
    })
    // Add creator as ADMIN member
    await prisma.workspaceMember.create({
      data: {
        userId: data.created_by,
        workspaceId: data.id,
        role: "ADMIN"
      }
    })
  }
)

// Inngest Function to update workspace data in database
const syncWorkspaceUpdation = inngest.createFunction(
  { id: 'update-workspace-from-clerk' },
  { event: 'clerk/organization.updated' },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.update({
      where: {
        id: data.id
      },
      data: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url,
      }
    })
  }
)

// Inngest Function to delete workspace from database
const syncWorkspaceDeletion = inngest.createFunction(
  { id: 'delete-workspace-with-clerk' },
  { event: 'clerk/organization.deleted' },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.delete({
      where: {
        id: data.id
      }
    })
  }
)

// Inngest Function to save workspace member data to a database
const syncWorkspaceMemberCreation = inngest.createFunction(
  { id: 'sync-workspace-member-from-clerk' },
  { event: 'clerk/organizationInvitation.accepted' },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspaceMember.create({
      data: {
        userId: data.user_id,
        workspaceId: data.organization_id,
        role: normalizeWorkspaceRole(data.role_name || data.role),
      }
    })
  }
)

// Inngest Function to Send Email on Task Creation
const sendTaskAssignmentEmail = inngest.createFunction(
  { id: "send-task-assignment-mail" },
  { event: "app/task.assigned" },
  async ({ event, step }) => {
    const { taskId, origin } = event.data;
    console.log("Inngest Event Received: app/task.assigned", { taskId, origin });
    const baseUrl = origin || "http://localhost:5173";

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, project: true }
    })

    if (!task) {
      console.error("Task not found for notification:", taskId);
      return;
    }

    if (!task.assignee || !task.assignee.email) {
      console.error("Assignee or email not found for task:", { taskId, assignee: task.assignee });
      return;
    }

    const taskUrl = `${baseUrl}/taskDetails?projectId=${task.projectId}&taskId=${taskId}`;

    console.log("Sending assignment email to:", task.assignee.email);
    try {
      await sendEmail({
        to: task.assignee.email,
        subject: `New Task Assigned: ${task.title}`,
        body: buildTaskEmail({
          task,
          taskUrl,
          intro: "You've been assigned a new task:",
          footer: "Please make sure to review and complete it before the due date.",
        })
      })
      console.log("Assignment email sent successfully to:", task.assignee.email);
    } catch (error) {
      console.error("Failed to send assignment email:", error);
    }
    const dueDate = new Date(task.due_date);
    const reminderDate = new Date(dueDate.getTime() - DAY_BEFORE_DEADLINE_MS);
    const now = new Date();

    if (dueDate > now) {
      if (reminderDate > now) {
        await step.sleepUntil('wait-until-24-hours-before-due-date', reminderDate);
      }

      await step.run('send-before-deadline-reminder-if-needed', async () => {
        const latestTask = await prisma.task.findUnique({
          where: { id: taskId },
          include: { assignee: true, project: true }
        })

        if (!latestTask || !latestTask.assignee?.email || latestTask.status === "DONE") return;
        if (new Date(latestTask.due_date) <= new Date()) return;

        await createNotification({
          userId: latestTask.assigneeId,
          type: "TASK_DUE_SOON",
          title: "Task due soon",
          message: `"${latestTask.title}" is due on ${new Date(latestTask.due_date).toLocaleDateString()}`,
          link: taskLink(latestTask),
          metadata: {
            taskId,
            projectId: latestTask.projectId,
            dueDate: latestTask.due_date,
          },
        });

        await sendEmail({
          to: latestTask.assignee.email,
          subject: `Due soon: ${latestTask.title}`,
          body: buildTaskEmail({
            task: latestTask,
            taskUrl: `${baseUrl}${taskLink(latestTask)}`,
            intro: `This task is due soon in ${latestTask.project.name}:`,
            footer: "Please review it before the deadline.",
          })
        })
      })

      await step.sleepUntil('wait-for-the-due-date', dueDate);
    }

    await step.run('send-due-date-reminder-if-needed', async () => {
      const latestTask = await prisma.task.findUnique({
        where: { id: taskId },
        include: { assignee: true, project: true }
      })

      if (!latestTask || !latestTask.assignee?.email || latestTask.status === "DONE") return;

      await createNotification({
        userId: latestTask.assigneeId,
        type: "TASK_DUE",
        title: "Task due now",
        message: `"${latestTask.title}" has reached its deadline`,
        link: taskLink(latestTask),
        metadata: {
          taskId,
          projectId: latestTask.projectId,
          dueDate: latestTask.due_date,
        },
      });

      await sendEmail({
        to: latestTask.assignee.email,
        subject: `Deadline reminder: ${latestTask.title}`,
        body: buildTaskEmail({
          task: latestTask,
          taskUrl: `${baseUrl}${taskLink(latestTask)}`,
          intro: `This task has reached its deadline in ${latestTask.project.name}:`,
          footer: "Please update the task status when it is complete.",
        })
      })
    })
  }
)

// Create an empty array where we'll export future Inngest functions
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  syncWorkspaceCreation,
  syncWorkspaceUpdation,
  syncWorkspaceDeletion,
  syncWorkspaceMemberCreation,
  sendTaskAssignmentEmail
];
