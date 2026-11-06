export interface FilterRules {
  blacklistKeywords: string[];
  regexPatterns: string[];
  blockedNumberPrefixes: string[];
  customBlockedNumbers: string[];
  whitelistKeywords: string[];
}

export interface SpamVerdict {
  isJunk: boolean;
  action: 'JUNK' | 'ALLOW';
  reason: string;
  normalizedBody: string;
  matchedRules: string[];
}

export interface SyncInfo {
  lastSyncDate: string | null;
  lastSyncStatus: string | null;
  isCallKitEnabled?: boolean;
  isAndroidRoleGranted?: boolean;
}

export type SpamCategory =
  | 'BETTING'               // Yasadışı Bahis / Kumar
  | 'PHISHING'              // Sahte Kargo / Oltalama Linki
  | 'SCAM_CALL'             // Sahte Çağrı Merkezi / Dolandırıcılık
  | 'AGGRESSIVE_MARKETING'  // Agresif Pazarlama / Robot Arama
  | 'OTHER';

export interface SpamReport {
  id: string;
  timestamp: string;
  type: 'SMS' | 'CALL';
  senderOrNumber: string;
  rawContent?: string;
  sanitizedContent?: string;
  category: SpamCategory;
  anonymousConsent: boolean;
}

export interface UserConsentSettings {
  crowdsourceConsent: boolean;
  consentDate: string | null;
}

export const DEFAULT_RULES: FilterRules = {
  blacklistKeywords: [
    "freespin",
    "discount",
    "matadorbet",
    "bahis",
    "yatirima ek",
    "nakit bakiye",
    "odullu turnuva",
    "slot",
    "t.me/",
    "norabahis",
    "casino",
    "deneme bonusu",
    "cevrimsiz",
    "canli mac izle",
    "giris adresi"
  ],
  regexPatterns: [
    "https?:\\/\\/(t\\.ly|mtd\\.s\\.gy|bit\\.ly|tinyurl\\.com|cutt\\.ly)\\/[a-zA-Z0-9_-]+",
    "(?i)(b\\d{3})\\b.*?(bahis|bonus|slot|casino|freespin)",
    "(?i)(kazan|bonus|fırsat)\\s*[:=]\\s*https?:\\/\\/\\S+"
  ],
  blockedNumberPrefixes: [
    "90375",
    "90729",
    "90850"
  ],
  customBlockedNumbers: [],
  whitelistKeywords: [
    "hesap ekstreniz",
    "transfer",
    "onay kodu",
    "şifre",
    "sifre",
    "dogrulama kodu",
    "doğrulama kodu",
    "tek kullanımlık",
    "guvenlik kodu",
    "güvenlik kodu",
    "dekont",
    "kargo teslim"
  ]
};

export const APP_GROUP_ID = "group.com.app.spamfilter";
export const CALL_DIRECTORY_EXTENSION_ID = "com.app.spamfilter.CallDirectoryExtension";
