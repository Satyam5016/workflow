import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import workspaceRouter from './routes/workspaceRoutes.js';
import { protect } from './middleware/authMiddleware.js';
import projectRouter from './routes/projectRoutes.js';
import taskRouter from './routes/taskRoutes.js';
import commentRouter from './routes/commentRoutes.js';
import activityRouter from './routes/activityRoutes.js';
import attachmentRouter from './routes/attachmentRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';
import subtaskRouter from './routes/subtaskRoutes.js';
import labelRouter from './routes/labelRoutes.js';
import timeEntryRouter from './routes/timeEntryRoutes.js';
import milestoneRouter from './routes/milestoneRoutes.js';

const app = express();
app.use(express.json({ limit: '30mb' }));
const allowedOrigins = ['https://work-flow-flame.vercel.app'];
const isLocalDevOrigin = (origin) => /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app') || isLocalDevOrigin(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(clerkMiddleware());

app.get('/', (req, res) => res.send('server is live!'));
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'workflow-api' }));
app.use("/api/inngest", serve({ client: inngest, functions }));

//Routes
app.use('/api/workspaces', protect, workspaceRouter);
app.use('/api/projects', protect, projectRouter);
app.use('/api/tasks', protect, taskRouter);
app.use('/api/comments', protect, commentRouter);
app.use('/api/activities', protect, activityRouter);
app.use('/api/attachments', protect, attachmentRouter);
app.use('/api/notifications', protect, notificationRouter);
app.use('/api/subtasks', protect, subtaskRouter);
app.use('/api/labels', protect, labelRouter);
app.use('/api/time-entries', protect, timeEntryRouter);
app.use('/api/milestones', protect, milestoneRouter);



const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
