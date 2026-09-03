import { wedding } from '../data/wedding';
import type { AccountItem, ContactItem } from '../data/wedding';

export type PublicSiteConfig = {
  rsvpEnabled: boolean;
  rsvpDeadline: string;
  guestbookEnabled: boolean;
  guestbookWriteEnabled: boolean;
  musicEnabled: boolean;
  contactsEnabled: boolean;
  accountsEnabled: boolean;
  contacts: ContactItem[];
  accounts: {
    groom: AccountItem[];
    bride: AccountItem[];
  };
  turnstileEnabled: boolean;
};

export const defaultSiteConfig: PublicSiteConfig = {
  rsvpEnabled: true,
  rsvpDeadline: wedding.rsvp.fallbackDeadline,
  guestbookEnabled: true,
  guestbookWriteEnabled: true,
  musicEnabled: false,
  contactsEnabled: false,
  accountsEnabled: false,
  contacts: [],
  accounts: { groom: [], bride: [] },
  turnstileEnabled: false,
};

let siteConfigPromise: Promise<PublicSiteConfig> | null = null;

const text = (value: unknown) => String(value ?? '').trim();

function contactsFrom(value: unknown): ContactItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    id: text(item?.id),
    label: text(item?.label),
    name: text(item?.name),
    phone: text(item?.phone),
  })).filter((item) => item.id && item.name && item.phone);
}

function accountGroupFrom(value: unknown): AccountItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    id: text(item?.id),
    label: text(item?.label),
    bank: text(item?.bank),
    accountNumber: text(item?.accountNumber),
    holder: text(item?.holder),
  })).filter((item) => item.id && item.accountNumber);
}

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
      contactsEnabled: data.contactsEnabled === true,
      accountsEnabled: data.accountsEnabled === true,
      contacts: contactsFrom(data.contacts),
      accounts: {
        groom: accountGroupFrom(data.accounts?.groom),
        bride: accountGroupFrom(data.accounts?.bride),
      },
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
