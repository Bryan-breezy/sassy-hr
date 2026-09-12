export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    time: new Date().toISOString(),
    hasGoogle: !!(process.env.GOOGLE_APPS_SCRIPT_URL && process.env.GOOGLE_APPS_SCRIPT_TOKEN),
    node: process.version,
  });
}
