import dotenv from 'dotenv';
import express from 'express';

import connection from './config/db';
import authRoutes from './routes/authRoutes';

dotenv.config();
connection();

const app = express();

app.use(express.json());
app.use('/api/auth',authRoutes);

const PORT = process.env.PORT;
app.listen(PORT,()=>{
    console.log(`Server running on ${PORT}`)
})

