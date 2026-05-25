export const getApiBaseUrl = () => {
  const baseUrl = process.env.APP_URL;

  if (!baseUrl) {
    throw new Error("Missing API base URL. Set APP_URL in .env.local.");
  }

  return `${baseUrl.replace(/\/$/, "")}/api`;
};

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};
