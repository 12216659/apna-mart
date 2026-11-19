import { resolveApiBaseUrl } from './config';

describe('API base URL configuration', () => {
  it('prefers the explicit public API URL when provided', () => {
    expect(
      resolveApiBaseUrl('production', {
        EXPO_PUBLIC_API_URL: 'https://api.apnamart.example.com',
      }),
    ).toBe('https://api.apnamart.example.com');
  });

  it('uses the environment-specific URL when no public override is present', () => {
    expect(
      resolveApiBaseUrl('preview', {
        EXPO_PUBLIC_API_URL_PREVIEW: 'https://preview-api.apnamart.example.com',
      }),
    ).toBe('https://preview-api.apnamart.example.com');
  });

  it('falls back to the public production endpoint without exposing localhost values', () => {
    expect(resolveApiBaseUrl('production', {})).toBe(
      'https://api.apnamart.example.com',
    );
  });
});
