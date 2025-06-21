import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { responseHandler, errorHandler } from './utils/express.util';
import { snakeToCamelMiddleware, camelToSnakeMiddleware } from './utils/case-converter.util';
import stationRoutes from './routes/station.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom Middlewares
app.use(responseHandler);
app.use(snakeToCamelMiddleware);
app.use(camelToSnakeMiddleware);

// Routes
app.use(stationRoutes);
app.get('/', (req, res: any) => {
  res.sendSuccess(200, 'API is running successfully');
});

// Error Handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
