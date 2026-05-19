import https from 'https';
import http from 'http';

/**
 * Periodically pings the provided URL to keep the server active.
 * @param {string} url - The public URL of the backend server.
 */
const keepAlive = (url) => {
  // Use provided url or fallback to Render's automatic RENDER_EXTERNAL_URL env variable
  const targetUrl = url || process.env.RENDER_EXTERNAL_URL;

  if (!targetUrl) {
    console.warn("Keep-alive: BACKEND_URL or RENDER_EXTERNAL_URL not set in environment. Skipping self-ping.");
    return;
  }

  // Target the lightweight /api/health endpoint
  const pingUrl = targetUrl.endsWith('/') 
    ? `${targetUrl}api/health` 
    : `${targetUrl}/api/health`;

  const protocol = pingUrl.startsWith('https') ? https : http;
  // Ping every 5 minutes (Render's inactivity timeout is 15 minutes)
  const interval = 5 * 60 * 1000; 

  console.log(`Keep-alive: Starting self-ping loop for ${pingUrl} every 5 minutes.`);

  const doPing = () => {
    try {
      protocol.get(pingUrl, (res) => {
        console.log(`Keep-alive: Pinged ${pingUrl}. Status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error(`Keep-alive: Ping failed for ${pingUrl}:`, err.message);
      });
    } catch (error) {
      console.error(`Keep-alive: Unexpected error during ping:`, error.message);
    }
  };

  // Ping once immediately on startup
  doPing();

  // Schedule periodic pings
  setInterval(doPing, interval);
};

export default keepAlive;
