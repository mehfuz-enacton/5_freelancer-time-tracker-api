import dotenv from 'dotenv';
import express from 'express';

import connection from './config/db';

dotenv.config();
connection();

const app = express();

app.use(express.json());

const PORT = process.env.PORT;
app.listen(PORT,()=>{
    console.log(`Server running on ${PORT}`)
})

