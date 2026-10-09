import 'dotenv/config';
import http from 'http';
import app from './app';
import { retryFailedEvents } from './modules/webhook/webhook.service';

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n Server running on port ${PORT}\n`);
});

setInterval(() => {
  retryFailedEvents().catch((error) => {
    console.error('[Retry Job Error]', error.message);
  });
}, 60 * 1000);
