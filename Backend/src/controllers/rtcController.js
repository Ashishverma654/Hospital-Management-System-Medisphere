export const getIceServers = async (req, res) => {
  try {
    const ident = process.env.XIRSYS_IDENT;
    const secret = process.env.XIRSYS_SECRET;
    const channel = process.env.XIRSYS_CHANNEL;

    if (!ident || !secret || !channel) {
      return res.status(500).json({ message: "Xirsys credentials are not configured." });
    }

    const auth = Buffer.from(`${ident}:${secret}`).toString("base64");
    const response = await fetch(`https://global.xirsys.net/_turn/${channel}`, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ format: "urls" }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ message: "Failed to fetch ICE servers.", details: text });
    }

    const payload = await response.json();
    const iceServers = payload?.v?.iceServers || payload?.iceServers || [];

    return res.json({ iceServers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
