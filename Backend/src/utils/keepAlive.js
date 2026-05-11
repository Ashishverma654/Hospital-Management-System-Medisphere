import https from 'https';
import http from 'http';

/**
 * Periodically pings the provided URL to keep the server active.
 * @param {string} url - The public URL of the backend server.
 */
const keepAlive = (url) => {
  if (!url) {
    console.warn("Keep-alive: BACKEND_URL not set in environment. Skipping self-ping.");
    return;
  }

  const protocol = url.startsWith('https') ? https : http;
  const interval = 14 * 60 * 1000; // 14 minutes

  console.log(`Keep-alive: Starting self-ping loop for ${url} every 14 minutes.`);

  setInterval(() => {
    try {
      protocol.get(url, (res) => {
        console.log(`Keep-alive: Pinged ${url}. Status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error(`Keep-alive: Ping failed for ${url}:`, err.message);
      });
    } catch (error) {
      console.error(`Keep-alive: Unexpected error during ping:`, error.message);
    }
  }, interval);
};

export default keepAlive;
