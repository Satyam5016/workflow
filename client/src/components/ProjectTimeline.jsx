import { addDays, differenceInCalendarDays, format, isBefore, min, max } from "date-fns";
import { AlertTriangleIcon, CalendarDaysIcon, GitBranchIcon, MilestoneIcon } from "lucide-react";

const statusColors = {
    TODO: "bg-slate-400",
    IN_PROGRESS: "bg-amber-500",
    DONE: "bg-emerald-500",
};

const clamp = (value, minValue, maxValue) => Math.min(Math.max(value, minValue), maxValue);

const ProjectTimeline = ({ project }) => {
    const tasks = project?.tasks || [];
    const datedTasks = tasks.filter((task) => task.due_date);
    const projectStart = project?.start_date ? new Date(project.start_date) : null;
    const projectEnd = project?.end_date ? new Date(project.end_date) : null;
    const taskDates = datedTasks.map((task) => new Date(task.due_date));
    const start = projectStart || (taskDates.length ? min(taskDates) : new Date());
    const end = projectEnd || (taskDates.length ? max(taskDates) : addDays(start, 14));
    const totalDays = Math.max(1, differenceInCalendarDays(end, start));

    const milestones = project?.milestones || [];

    return (
        <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                            <CalendarDaysIcon className="size-5 text-teal-600 dark:text-teal-300" />
                            Gantt Timeline
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Plan delivery windows, dependencies, milestones, and risky due dates.</p>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-zinc-400">
                        {format(start, "dd MMM yyyy")} - {format(end, "dd MMM yyyy")}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="min-w-[760px]">
                    <div className="grid grid-cols-[18rem_minmax(0,1fr)] border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                        <div className="p-3">Task</div>
                        <div className="grid grid-cols-4 p-3">
                            <span>{format(start, "dd MMM")}</span>
                            <span className="text-center">{format(addDays(start, Math.round(totalDays / 3)), "dd MMM")}</span>
                            <span className="text-center">{format(addDays(start, Math.round((totalDays * 2) / 3)), "dd MMM")}</span>
                            <span className="text-right">{format(end, "dd MMM")}</span>
                        </div>
                    </div>

                    {milestones.length > 0 && (
                        <div className="relative h-12 border-b border-slate-200 dark:border-zinc-800">
                            <div className="absolute inset-y-0 left-72 right-0">
                                {milestones.filter((milestone) => milestone.due_date).map((milestone) => {
                                    const offset = clamp((differenceInCalendarDays(new Date(milestone.due_date), start) / totalDays) * 100, 0, 100);
                                    return (
                                        <div key={milestone.id} className="absolute top-2 flex -translate-x-1/2 flex-col items-center" style={{ left: `${offset}%` }}>
                                            <MilestoneIcon className="size-4 text-purple-600 dark:text-purple-300" />
                                            <span className="mt-1 max-w-24 truncate text-[10px] text-purple-700 dark:text-purple-300">{milestone.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex h-full items-center gap-2 px-3 text-sm text-slate-600 dark:text-zinc-300">
                                <MilestoneIcon className="size-4" /> Milestones
                            </div>
                        </div>
                    )}

                    {datedTasks.length === 0 ? (
                        <div className="p-10 text-center text-sm text-slate-500 dark:text-zinc-400">Add task due dates to populate the timeline.</div>
                    ) : (
                        datedTasks.map((task) => {
                            const dueDate = new Date(task.due_date);
                            const left = clamp((differenceInCalendarDays(dueDate, start) / totalDays) * 100, 0, 100);
                            const width = clamp(task.estimated_hours ? Math.max(5, Number(task.estimated_hours) * 2) : 8, 5, 28);
                            const blocked = (task.dependsOn || []).some((item) => item.status !== "DONE");
                            const risky = isBefore(dueDate, new Date()) && task.status !== "DONE";

                            return (
                                <div key={task.id} className="grid grid-cols-[18rem_minmax(0,1fr)] border-b border-slate-100 last:border-b-0 dark:border-zinc-800">
                                    <div className="p-3">
                                        <p className="truncate text-sm font-medium text-slate-900 dark:text-zinc-100">{task.title}</p>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                                            {task.assignee?.name || "Unassigned"}
                                            {blocked && <GitBranchIcon className="size-3.5 text-amber-500" />}
                                            {risky && <AlertTriangleIcon className="size-3.5 text-red-500" />}
                                        </div>
                                    </div>
                                    <div className="relative flex items-center p-3">
                                        <div className="absolute left-3 right-3 top-1/2 h-px bg-slate-100 dark:bg-zinc-800" />
                                        <div className={`relative h-4 rounded-full ${statusColors[task.status] || statusColors.TODO} shadow-sm`} style={{ left: `${left}%`, width: `${width}%` }} title={`${task.title} due ${format(dueDate, "dd MMM yyyy")}`} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectTimeline;
