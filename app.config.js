// Web builds can be served from a sub-path (GitHub Pages: /frozen-codex) or a domain root (Cloudflare Pages).
// WEB_BASE_URL decides; with no value the site is built for the root.
module.exports = ({ config }) => {
  const base = process.env.WEB_BASE_URL;
  const experiments = { ...(config.experiments || {}) };
  if (base) experiments.baseUrl = base;
  else delete experiments.baseUrl;
  return { ...config, experiments };
};
