import { requestJson } from './api';

const jsonOptions = payload => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const authSession = result => {
  if (result.requiresPhone) return result;
  if (!result.token || !result.user) {
    throw new Error(result.message || 'Unable to continue. Please try again.');
  }
  return { token: result.token, user: result.user };
};

export async function registerCustomer(payload) {
  return authSession(
    await requestJson('/api/auth/register', jsonOptions(payload)),
  );
}

export async function loginCustomer(payload) {
  return authSession(await requestJson('/api/auth/login', jsonOptions(payload)));
}

export async function authenticateWithGoogle(credential, phone) {
  return authSession(
    await requestJson(
      '/api/auth/google',
      jsonOptions({
        credential,
        ...(phone ? { phone } : {}),
      }),
    ),
  );
}

export async function checkUsernameAvailability(username) {
  const result = await requestJson(
    `/api/auth/availability?username=${encodeURIComponent(username)}`,
  );
  return result.usernameAvailable;
}

export async function checkPhoneAvailability(phone) {
  const result = await requestJson(
    `/api/auth/availability?phone=${encodeURIComponent(phone)}`,
  );
  return result.phoneAvailable;
}

export async function getCurrentCustomer(token) {
  const result = await requestJson('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!result.user) {
    throw new Error('Your account profile could not be loaded.');
  }
  return result.user;
}
