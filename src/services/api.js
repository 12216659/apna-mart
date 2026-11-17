import { API_BASE_URL } from '../config';

export async function requestJson(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(
      payload.message || 'The request could not be completed.',
    );
    error.code = payload.code;
    error.details = payload.details;
    error.status = response.status;
    throw error;
  }

  return payload;
}
