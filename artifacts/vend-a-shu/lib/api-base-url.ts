import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL_STORAGE_KEY = 'vas.apiBaseUrl';

const TRAILING_SLASHES = /\/+$/;
const HEALTH_TIMEOUT_MS = 10_000;

/** Replit / hosted default when no stored URL exists. */
export function replitDefaultBaseUrl(): string | null {
  const domain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
  if (!domain) {
    return null;
  }
  if (/^https?:\/\//i.test(domain)) {
    return domain.replace(TRAILING_SLASHES, '');
  }
  return `https://${domain}`;
}

/**
 * Normalize host/IP/URL + optional port into an origin (no trailing slash, no /api suffix).
 */
export function normalizeServerUrl(
  hostInput: string,
  portInput?: string,
): string | null {
  const raw = hostInput.trim();
  const port = portInput?.trim() ?? '';

  if (!raw) {
    return null;
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (port && !url.port) {
        url.port = port;
      }
      return url.origin.replace(TRAILING_SLASHES, '');
    } catch {
      return null;
    }
  }

  let hostname = raw;
  let embeddedPort = '';

  const ipv6Match = raw.match(/^\[([^\]]+)\](?::(\d+))?$/);
  if (ipv6Match) {
    hostname = `[${ipv6Match[1]}]`;
    embeddedPort = ipv6Match[2] ?? '';
  } else {
    const lastColon = raw.lastIndexOf(':');
    if (lastColon > 0) {
      const maybePort = raw.slice(lastColon + 1);
      if (/^\d+$/.test(maybePort)) {
        hostname = raw.slice(0, lastColon);
        embeddedPort = maybePort;
      }
    }
  }

  const finalPort = port || embeddedPort;
  const origin = finalPort
    ? `http://${hostname}:${finalPort}`
    : `http://${hostname}`;

  try {
    return new URL(origin).origin.replace(TRAILING_SLASHES, '');
  } catch {
    return null;
  }
}

export async function loadStoredApiBaseUrl(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(API_BASE_URL_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return stored.replace(TRAILING_SLASHES, '');
  } catch {
    return null;
  }
}

export async function persistApiBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(
    API_BASE_URL_STORAGE_KEY,
    url.replace(TRAILING_SLASHES, ''),
  );
}

/** Stored URL first, then Replit default. Does not set the active client base URL. */
export async function resolveInitialApiBaseUrl(): Promise<string | null> {
  const stored = await loadStoredApiBaseUrl();
  if (stored) {
    return stored;
  }
  return replitDefaultBaseUrl();
}

/** Target for Connect: explicit input, then stored, then Replit default. */
export async function resolveConnectTarget(
  hostInput: string,
  portInput: string,
): Promise<string | null> {
  const normalized = normalizeServerUrl(hostInput, portInput);
  if (normalized) {
    return normalized;
  }
  return resolveInitialApiBaseUrl();
}

export async function checkApiHealth(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/api/healthz`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      return false;
    }
    const data = (await response.json()) as { status?: string };
    return data.status === 'ok';
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export const CONNECT_ERROR_MESSAGE =
  'Could not connect to the Vend-A-Shu server. Check the address, port, Wi-Fi connection, and that the API server is running.';
