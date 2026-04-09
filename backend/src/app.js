import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { router } from './routes/index.js';
import { errorHandler } from './middleware/error.js';
import { env } from './config/env.js';

export const app = express();

app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/api', router);
app.use(errorHandler);
