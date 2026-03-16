import 'dotenv/config';
import express from 'express';
import inviteRouter from './routes/invite.js';
import validationRouter from './routes/validation.js';
import resonanceRouter from './routes/resonance.js';
import energyRouter from './routes/energy.js';
import dailySparkRouter from './routes/dailySpark.js';
import { ensureDailySparkSchema } from './db/initDailySparkSchema.js';

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(express.json({ limit: '256kb' }));
app.use('/api', inviteRouter);
app.use('/api', validationRouter);
app.use('/api', resonanceRouter);
app.use('/api', energyRouter);
app.use('/api', dailySparkRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  try {
    await ensureDailySparkSchema();
  } catch (e) {
    console.warn('Daily Spark schema init skipped or failed:', e.message);
  }
  app.listen(port, () => {
    console.log(`Glimmer API listening on http://localhost:${port}`);
  });
}

start();
