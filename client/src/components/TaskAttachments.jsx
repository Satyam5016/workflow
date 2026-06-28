import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { DownloadIcon, FileIcon, PaperclipIcon, Trash2Icon, UploadCloudIcon } from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../configs/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const formatFileSize = (bytes = 0) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
};

const TaskAttachments = ({ task, project }) => {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [attachments, setAttachments] = useState(task?.attachments || []);
    const [uploading, setUploading] = useState(false);
    const [downloadingId, setDownloadingId] = useState("");

    const canDeleteAny = useMemo(() => {
        return project?.team_lead === user?.id;
    }, [project?.team_lead, user?.id]);

    const fetchAttachments = useCallback(async () => {
        if (!task?.id) return;

        try {
            const token = await getToken();
            const { data } = await api.get(`/api/attachments/task/${task.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAttachments(data.attachments || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
    }, [getToken, task?.id]);

    const handleUpload = async (event) => {
        const selectedFiles = Array.from(event.target.files || []);
        event.target.value = "";

        if (!selectedFiles.length) return;

        const oversizedFile = selectedFiles.find((file) => file.size > MAX_FILE_SIZE);
        if (oversizedFile) {
            toast.error(`${oversizedFile.name} is larger than 5MB`);
            return;
        }

        try {
            setUploading(true);
            toast.loading("Uploading attachment...");

            const files = await Promise.all(selectedFiles.map(async (file) => ({
                name: file.name,
                type: file.type,
                size: file.size,
                dataUrl: await readFileAsDataUrl(file),
            })));

            const token = await getToken();
            const { data } = await api.post("/api/attachments", { taskId: task.id, files }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setAttachments((prev) => [...(data.attachments || []), ...prev]);
            toast.dismissAll();
            toast.success(data.message || "Attachment uploaded");
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (attachment) => {
        try {
            setDownloadingId(attachment.id);
            const token = await getToken();
            const response = await api.get(`/api/attachments/${attachment.id}/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob",
            });

            const url = URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = url;
            link.download = attachment.fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setDownloadingId("");
        }
    };

    const handleDelete = async (attachmentId) => {
        const confirmed = window.confirm("Delete this attachment?");
        if (!confirmed) return;

        try {
            const token = await getToken();
            const { data } = await api.delete(`/api/attachments/${attachmentId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId));
            toast.success(data.message || "Attachment deleted");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    useEffect(() => {
        setAttachments(task?.attachments || []);
    }, [task?.attachments]);

    useEffect(() => {
        fetchAttachments();
    }, [fetchAttachments]);

    return (
        <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                    <PaperclipIcon className="size-5" /> Attachments ({attachments.length})
                </h2>

                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm cursor-pointer hover:opacity-90">
                    <UploadCloudIcon className="size-4" />
                    {uploading ? "Uploading" : "Upload"}
                    <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
            </div>

            {attachments.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No attachments yet.</p>
            ) : (
                <div className="space-y-3">
                    {attachments.map((attachment) => {
                        const canDelete = canDeleteAny || attachment.user?.id === user?.id;

                        return (
                            <div key={attachment.id} className="flex items-start gap-3 rounded border border-zinc-200 dark:border-zinc-800 p-3">
                                <div className="p-2 rounded bg-zinc-100 dark:bg-zinc-800">
                                    <FileIcon className="size-4 text-zinc-600 dark:text-zinc-300" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{attachment.fileName}</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {formatFileSize(attachment.fileSize)} · {attachment.user?.name || "Unknown"} · {format(new Date(attachment.createdAt), "dd MMM yyyy")}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button type="button" onClick={() => handleDownload(attachment)} className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Download attachment">
                                        <DownloadIcon className={`size-4 ${downloadingId === attachment.id ? "text-blue-500" : "text-zinc-600 dark:text-zinc-300"}`} />
                                    </button>
                                    {canDelete && (
                                        <button type="button" onClick={() => handleDelete(attachment.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950" title="Delete attachment">
                                            <Trash2Icon className="size-4 text-red-600 dark:text-red-400" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TaskAttachments;
