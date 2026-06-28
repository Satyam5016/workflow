import { FolderOpen, CheckCircle, Users, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function StatsGrid() {
    const currentWorkspace = useSelector(
        (state) => state?.workspace?.currentWorkspace || null
    );

    const [stats, setStats] = useState({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        myTasks: 0,
        overdueIssues: 0,
    });

    const statCards = [
        {
            icon: FolderOpen,
            title: "Total Projects",
            value: stats.totalProjects,
            subtitle: `projects in ${currentWorkspace?.name || "workspace"}`,
            bgColor: "bg-blue-500/10",
            textColor: "text-blue-500",
        },
        {
            icon: CheckCircle,
            title: "Completed Projects",
            value: stats.completedProjects,
            subtitle: `of ${stats.totalProjects} total`,
            bgColor: "bg-emerald-500/10",
            textColor: "text-emerald-500",
        },
        {
            icon: Users,
            title: "My Tasks",
            value: stats.myTasks,
            subtitle: "assigned to me",
            bgColor: "bg-purple-500/10",
            textColor: "text-purple-500",
        },
        {
            icon: AlertTriangle,
            title: "Overdue",
            value: stats.overdueIssues,
            subtitle: "need attention",
            bgColor: "bg-amber-500/10",
            textColor: "text-amber-500",
        },
    ];

    useEffect(() => {
        if (currentWorkspace) {
            setStats({
                totalProjects: currentWorkspace.projects.filter(Boolean).length,
                activeProjects: currentWorkspace.projects.filter(Boolean).filter(
                    (p) => p.status !== "CANCELLED" && p.status !== "COMPLETED"
                ).length,
                completedProjects: currentWorkspace.projects.filter(Boolean).filter((p) => p.status === "COMPLETED").length,
                myTasks: currentWorkspace.projects.filter(Boolean).reduce(
                    (acc, project) =>
                        acc +
                        (project.tasks || []).filter((t) => t.assignee?.email === currentWorkspace.owner?.email).length,
                    0
                ),
                overdueIssues: currentWorkspace.projects.filter(Boolean).reduce(
                    (acc, project) =>
                        acc + (project.tasks || []).filter((t) => new Date(t.due_date) < new Date() && t.status !== "DONE").length,
                    0
                ),
            });
        }
    }, [currentWorkspace]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {statCards.map(
                (card, i) => (
                    <div key={i} className="group bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-teal-200 dark:hover:border-teal-500/30 transition duration-200 rounded-lg shadow-sm hover:-translate-y-0.5" >
                        <div className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                                        {card.title}
                                    </p>
                                    <p className="text-3xl font-bold text-zinc-800 dark:text-white">
                                        {card.value}
                                    </p>
                                    {card.subtitle && (
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                            {card.subtitle}
                                        </p>
                                    )}
                                </div>
                                <div className={`p-3 rounded-xl ${card.bgColor} bg-opacity-20`}>
                                    <card.icon size={20} className={card.textColor} />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
