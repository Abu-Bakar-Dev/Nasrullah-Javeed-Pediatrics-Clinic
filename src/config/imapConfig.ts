// IMAP & Mail Server Configuration
// Used for receiving & dispatching password reset emails via abu.bakar041295@gmail.com

export interface ImapConfig {
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  emailUser: string;
  appPassword: string; // Gmail App Password (16 characters)
  useTls: boolean;
}

const STORAGE_KEY = 'medflow_imap_config';

export const DEFAULT_IMAP_CONFIG: ImapConfig = {
  imapHost: 'imap.gmail.com',
  imapPort: 993,
  smtpHost: 'smtp.gmail.com',
  smtpPort: 465,
  emailUser: 'abu.bakar041295@gmail.com',
  // Configure Gmail SMTP securely in Supabase; never ship credentials to browsers.
  appPassword: '',
  useTls: true,
};

export const getImapConfig = (): ImapConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_IMAP_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Could not parse saved IMAP config:', e);
  }
  return DEFAULT_IMAP_CONFIG;
};

export const saveImapConfig = (config: ImapConfig): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};
