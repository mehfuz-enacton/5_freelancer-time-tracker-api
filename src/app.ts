import dotenv from 'dotenv';
import express from 'express';

import connection from './config/db';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import timeEntryRoutes from './routes/timeEntryRoutes';
import summaryRoutes from './routes/summaryRoutes';

dotenv.config();
connection();

const app = express();

app.use(express.json());
app.use('/api/auth',authRoutes);
app.use('/api/projects',projectRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/summary',summaryRoutes)

const PORT = process.env.PORT;
app.listen(PORT,()=>{
    console.log(`Server running on ${PORT}`)
})

