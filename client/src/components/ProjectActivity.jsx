import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../configs/api";
import ActivityTimeline from "./ActivityTimeline";

const ProjectActivity = ({ project }) => {
    const { getToken } = useAuth();
    const [activities, setActivities] = useState(project?.activities || []);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setActivities(project?.activities || []);
    }, [project]);

    useEffect(() => {
        const fetchActivities = async () => {
            if (!project?.id) return;

            setLoading(true);
            try {
                const token = await getToken();
                const { data } = await api.get(`/api/activities/project/${project.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setActivities(data.activities || []);
            } catch (error) {
                toast.error(error?.response?.data?.message || error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [getToken, project?.id]);

    if (loading && activities.length === 0) {
        return <div className="text-zinc-500 dark:text-zinc-400 text-sm">Loading activity...</div>;
    }

    return (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <ActivityTimeline activities={activities} emptyText="No project activity yet" />
        </div>
    );
};

export default ProjectActivity;
