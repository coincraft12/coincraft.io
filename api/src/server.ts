import 'dotenv/config';
import { buildApp } from './app';

const PORT = Number(process.env.PORT ?? 4000);

async function start() {
  const app = await buildApp();
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`CoinCraft API running on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
