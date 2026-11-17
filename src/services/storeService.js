import { requestJson } from './api';

export async function fetchNearbyStores(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    within: '500',
    limit: '20',
  });
  const result = await requestJson(`/api/stores?${params.toString()}`);
  return Array.isArray(result.stores) ? result.stores : [];
}
