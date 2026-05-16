import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { getSwaggerHtml, openApiDocument, swaggerUiAssetPath } from './docs/openapi.js';
import { errorHandler } from './middleware/error.js';
import { notFoundHandler } from './middleware/not-found.js';
import { router } from './routes/index.js';

export const app = express();
app.set('etag', false);

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsDirectory = path.resolve(currentDir, '../uploads');
const swaggerContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "font-src 'self' data:",
  "form-action 'self'",
  "img-src 'self' data:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "frame-ancestors 'self'"
].join(';');

const allowedOrigins = new Set([env.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173']);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin is not allowed'));
    },
    credentials: true
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    xFrameOptions: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'frame-ancestors': ["'self'", env.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173']
      }
    }
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(env.isProduction ? 'combined' : 'dev'));
app.use('/uploads', express.static(uploadsDirectory));
app.use('/api/docs/assets', express.static(swaggerUiAssetPath, { index: false, maxAge: '1h' }));
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.get('/api/docs/openapi.json', (req, res) => {
  res.json(openApiDocument);
});

app.get('/api/docs', (req, res) => {
  res.setHeader('Content-Security-Policy', swaggerContentSecurityPolicy);
  res.type('html').send(getSwaggerHtml());
});

app.use('/api', router);
app.use(notFoundHandler);
app.use(errorHandler);
