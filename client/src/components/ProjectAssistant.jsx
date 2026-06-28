import { useMemo, useState } from "react";
import { AlertTriangleIcon, BotIcon, CheckCircle2Icon, LightbulbIcon, SendIcon, SparklesIcon, UserRoundIcon } from "lucide-react";

const getLoggedHours = (task) => (task.timeEntries || []).reduce((sum, entry) => sum + Number(entry.hours || 0), 0);

const ProjectAssistant = ({ project }) => {
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState([]);

    const insights = useMemo(() => {
        const tasks = project?.tasks || [];
        const overdue = tasks.filter((task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== "DONE");
        const blocked = tasks.filter((task) => (task.dependsOn || []).some((dependency) => dependency.status !== "DONE"));
        const highPriority = tasks.filter((task) => task.priority === "HIGH" && task.status !== "DONE");
        const done = tasks.filter((task) => task.status === "DONE").length;
        const completion = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
        const planned = tasks.reduce((sum, task) => sum + Number(task.estimated_hours || 0), 0);
        const logged = tasks.reduce((sum, task) => sum + getLoggedHours(task), 0);
        const workload = tasks.reduce((acc, task) => {
            const name = task.assignee?.name || "Unassigned";
            acc[name] = (acc[name] || 0) + Number(task.estimated_hours || 0);
            return acc;
        }, {});
        const busiest = Object.entries(workload).sort((a, b) => b[1] - a[1])[0];

        return {
            completion,
            overdue,
            blocked,
            highPriority,
            planned,
            logged,
            busiest,
            recommendations: [
                overdue.length ? `Resolve ${overdue.length} overdue task${overdue.length === 1 ? "" : "s"} before adding new scope.` : "No overdue tasks. Keep the current delivery rhythm.",
                blocked.length ? `Unblock ${blocked.length} dependency chain${blocked.length === 1 ? "" : "s"} to improve flow.` : "No active dependency blockers detected.",
                busiest ? `${busiest[0]} carries the highest estimated load at ${busiest[1].toFixed(1)}h.` : "Assign estimates to see workload risk.",
            ],
        };
    }, [project]);

    const answerPrompt = () => {
        if (!prompt.trim()) return;
        const question = prompt.trim().toLowerCase();
        let response = `Project is ${insights.completion}% complete with ${insights.overdue.length} overdue task(s), ${insights.blocked.length} blocked task(s), and ${insights.highPriority.length} open high-priority item(s).`;

        if (question.includes("risk") || question.includes("delay") || question.includes("overdue")) {
            response = insights.overdue.length
                ? `Main risk: ${insights.overdue.map((task) => task.title).slice(0, 3).join(", ")}. Move these first or adjust dates.`
                : "I do not see overdue work right now. Watch high-priority open tasks and dependency blockers.";
        } else if (question.includes("who") || question.includes("workload") || question.includes("overload")) {
            response = insights.busiest ? `${insights.busiest[0]} has the highest planned load at ${insights.busiest[1].toFixed(1)}h. Consider moving low-priority work if deadlines are tight.` : "There is not enough estimated-hour data to identify workload pressure.";
        } else if (question.includes("next") || question.includes("priority")) {
            const nextTasks = [...insights.blocked, ...insights.highPriority, ...insights.overdue]
                .filter((task, index, arr) => arr.findIndex((item) => item.id === task.id) === index)
                .slice(0, 4)
                .map((task) => task.title);
            response = nextTasks.length ? `Recommended next focus: ${nextTasks.join(", ")}.` : "Recommended next focus: keep closing in-progress work and prepare the next milestone.";
        }

        setMessages((prev) => [...prev, { role: "user", text: prompt.trim() }, { role: "assistant", text: response }]);
        setPrompt("");
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                        <BotIcon className="size-5 text-teal-600 dark:text-teal-300" />
                        AI Project Assistant
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Smart project analysis from your tasks, dependencies, time logs, priorities, and due dates.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: "Completion", value: `${insights.completion}%`, icon: CheckCircle2Icon, color: "text-emerald-600" },
                        { label: "Overdue", value: insights.overdue.length, icon: AlertTriangleIcon, color: "text-red-600" },
                        { label: "Blocked", value: insights.blocked.length, icon: SparklesIcon, color: "text-amber-600" },
                        { label: "Logged / Planned", value: `${insights.logged.toFixed(1)} / ${insights.planned.toFixed(1)}h`, icon: UserRoundIcon, color: "text-teal-600" },
                    ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                            <item.icon className={`mb-3 size-5 ${item.color}`} />
                            <p className="text-sm text-slate-500 dark:text-zinc-400">{item.label}</p>
                            <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{item.value}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <h3 className="font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                        <LightbulbIcon className="size-4 text-amber-500" />
                        Recommended Actions
                    </h3>
                    <div className="mt-4 space-y-3">
                        {insights.recommendations.map((item) => (
                            <div key={item} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-zinc-900 dark:text-zinc-300">{item}</div>
                        ))}
                    </div>
                </div>
            </div>

            <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-4">
                    <p className="font-semibold text-slate-950 dark:text-white">Ask about this project</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Try: “What is delayed?” or “Who is overloaded?”</p>
                </div>
                <div className="mb-4 max-h-96 space-y-3 overflow-y-auto">
                    {messages.length === 0 ? (
                        <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">I can summarize risk, blockers, workload, and next priorities for this project.</p>
                    ) : messages.map((message, index) => (
                        <div key={`${message.role}-${index}`} className={`rounded-lg p-3 text-sm ${message.role === "user" ? "bg-teal-50 text-teal-900 dark:bg-teal-500/10 dark:text-teal-100" : "bg-slate-50 text-slate-700 dark:bg-zinc-900 dark:text-zinc-300"}`}>
                            {message.text}
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") answerPrompt(); }} placeholder="Ask a project question..." className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white" />
                    <button onClick={answerPrompt} className="inline-flex size-10 items-center justify-center rounded-lg bg-teal-600 text-white hover:bg-teal-700" title="Ask">
                        <SendIcon className="size-4" />
                    </button>
                </div>
            </aside>
        </div>
    );
};

export default ProjectAssistant;
