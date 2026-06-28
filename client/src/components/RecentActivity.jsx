import { useSelector } from "react-redux";
import ActivityTimeline from "./ActivityTimeline";

const RecentActivity = () => {
    const { currentWorkspace } = useSelector((state) => state.workspace);
    const activities = currentWorkspace?.activities || [];

    return (
        <div className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-lg transition-all overflow-hidden">
            <div className="border-b border-zinc-200 dark:border-zinc-800 p-4">
                <h2 className="text-lg text-zinc-800 dark:text-zinc-200">Recent Activity</h2>
            </div>

            <ActivityTimeline activities={activities} emptyText="No recent activity" />
        </div>
    );
};

export default RecentActivity;
