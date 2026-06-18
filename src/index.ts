import 'dotenv/config';
import http from 'http';
import app from './app';

const server = http.createServer(app);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Multivendor API',
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n Server running on port ${PORT}\n`);
});