export const WorkspacePermission = {
    INVITE_MEMBERS: "invite_members",
    CREATE_PROJECTS: "create_projects",
    UPDATE_PROJECTS: "update_projects",
    DELETE_PROJECTS: "delete_projects",
    MANAGE_TASKS: "manage_tasks",
    ASSIGN_TASKS: "assign_tasks",
    MANAGE_LABELS: "manage_labels",
    UPDATE_SETTINGS: "update_settings",
};

const permissionMap = {
    ADMIN: Object.values(WorkspacePermission),
    MANAGER: [
        WorkspacePermission.INVITE_MEMBERS,
        WorkspacePermission.CREATE_PROJECTS,
        WorkspacePermission.UPDATE_PROJECTS,
        WorkspacePermission.MANAGE_TASKS,
        WorkspacePermission.ASSIGN_TASKS,
        WorkspacePermission.MANAGE_LABELS,
    ],
    MEMBER: [],
};

export const hasWorkspacePermission = (role, permission) => {
    return Boolean(permissionMap[role]?.includes(permission));
};

export const getWorkspaceMembership = (workspace, userId) => {
    return workspace?.members?.find((member) => member.userId === userId);
};

export const userHasWorkspacePermission = (workspace, userId, permission) => {
    const membership = getWorkspaceMembership(workspace, userId);
    return hasWorkspacePermission(membership?.role, permission);
};

export const canManageProject = (project, workspace, userId) => {
    return project?.team_lead === userId || userHasWorkspacePermission(workspace, userId, WorkspacePermission.UPDATE_PROJECTS);
};

export const canManageProjectTasks = (project, workspace, userId) => {
    return project?.team_lead === userId || userHasWorkspacePermission(workspace, userId, WorkspacePermission.MANAGE_TASKS);
};

export const canAssignProjectTasks = (project, workspace, userId) => {
    return project?.team_lead === userId || userHasWorkspacePermission(workspace, userId, WorkspacePermission.ASSIGN_TASKS);
};
