import { wedding } from '../data/wedding';

export type PublicSiteConfig = {
  rsvpEnabled: boolean;
  rsvpDeadline: string;
  guestbookEnabled: boolean;
  guestbookWriteEnabled: boolean;
  musicEnabled: boolean;
  turnstileEnabled: boolean;
};

export const defaultSiteConfig: PublicSiteConfig = {
  rsvpEnabled: true,
  rsvpDeadline: wedding.rsvp.fallbackDeadline,
  guestbookEnabled: true,
  guestbookWriteEnabled: true,
  musicEnabled: false,
  turnstileEnabled: false,
};

let siteConfigPromise: Promise<PublicSiteConfig> | null = null;

async function requestSiteConfig(): Promise<PublicSiteConfig> {
  try {
    const response = await fetch('/api/site-config', {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) return defaultSiteConfig;

    const data = await response.json().catch(() => ({}));
    return {
      rsvpEnabled: data.rsvpEnabled !== false,
      rsvpDeadline: String(data.rsvpDeadline || wedding.rsvp.fallbackDeadline || ''),
      guestbookEnabled: data.guestbookEnabled !== false,
      guestbookWriteEnabled: data.guestbookWriteEnabled !== false,
      musicEnabled: data.musicEnabled === true,
      turnstileEnabled: data.turnstileEnabled === true,
    };
  } catch {
    return defaultSiteConfig;
  }
}

export function fetchSiteConfig() {
  if (!siteConfigPromise) siteConfigPromise = requestSiteConfig();
  return siteConfigPromise;
}
