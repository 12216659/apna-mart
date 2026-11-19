export const APP_ENVIRONMENTS = ['development', 'preview', 'production'];

export function resolveApiBaseUrl(
  environment = process.env.EXPO_PUBLIC_APP_ENV || process.env.APP_ENV || 'development',
  env = process.env,
) {
  const configuredBaseUrl = env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  const normalizedEnvironment = APP_ENVIRONMENTS.includes(environment)
    ? environment
    : 'development';

  const defaultApiUrls = {
    development: env.EXPO_PUBLIC_API_URL_DEVELOPMENT || 'https://dev-api.apnamart.example.com',
    preview: env.EXPO_PUBLIC_API_URL_PREVIEW || 'https://preview-api.apnamart.example.com',
    production: env.EXPO_PUBLIC_API_URL_PRODUCTION || 'https://api.apnamart.example.com',
  };

  return (defaultApiUrls[normalizedEnvironment] || defaultApiUrls.development).replace(/\/$/, '');
}

export const APP_ENV =
  process.env.EXPO_PUBLIC_APP_ENV || process.env.APP_ENV || 'development';
export const API_BASE_URL = resolveApiBaseUrl(APP_ENV, process.env);
