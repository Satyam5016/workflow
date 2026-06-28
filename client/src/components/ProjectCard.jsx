import { Link } from "react-router-dom";
import { CalendarDaysIcon, UsersIcon } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
    PLANNING: "bg-gray-200 dark:bg-zinc-600 text-gray-900 dark:text-zinc-200",
    ACTIVE: "bg-emerald-200 dark:bg-emerald-500 text-emerald-900 dark:text-emerald-900",
    ON_HOLD: "bg-amber-200 dark:bg-amber-500 text-amber-900 dark:text-amber-900",
    COMPLETED: "bg-blue-200 dark:bg-blue-500 text-blue-900 dark:text-blue-900",
    CANCELLED: "bg-red-200 dark:bg-red-500 text-red-900 dark:text-red-900",
};

const ProjectCard = ({ project }) => {
    const completedTasks = (project.tasks || []).filter((task) => task.status === "DONE").length;
    const totalTasks = (project.tasks || []).length;

    return (
        <Link to={`/projectsDetail?id=${project.id}&tab=tasks`} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-teal-200 dark:hover:border-teal-500/30 rounded-lg p-5 transition-all duration-200 group shadow-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-950 dark:text-zinc-100 mb-1 truncate group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                        {project.name}
                    </h3>
                    <p className="text-slate-500 dark:text-zinc-400 text-sm line-clamp-2 mb-3">
                        {project.description || "No description"}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-0.5 rounded text-xs ${statusColors[project.status]}`} >
                    {project.status.replace("_", " ")}
                </span>
                <span className="text-xs text-gray-500 dark:text-zinc-500 capitalize">
                    {project.priority} priority
                </span>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1">
                    <UsersIcon className="size-3.5" /> {project.members?.length || 0} members
                </span>
                {project.end_date && (
                    <span className="inline-flex items-center gap-1">
                        <CalendarDaysIcon className="size-3.5" /> {format(new Date(project.end_date), "MMM d")}
                    </span>
                )}
                <span>{completedTasks}/{totalTasks} tasks done</span>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-zinc-500">Progress</span>
                    <span className="text-gray-400 dark:text-zinc-400">{project.progress || 0}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded overflow-hidden">
                    <div className="h-1.5 rounded bg-teal-500" style={{ width: `${project.progress || 0}%` }} />
                </div>
            </div>

            </Link>
    );
};

export default ProjectCard;
