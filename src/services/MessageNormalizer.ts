import { FilterRules, SpamVerdict } from '../types';

export class MessageNormalizer {
  private static readonly leetMap: Record<string, string> = {
    '0': 'o',
    '1': 'i',
    '!': 'i',
    '|': 'i',
    '3': 'e',
    '4': 'a',
    '@': 'a',
    '5': 's',
    '$': 's',
    '7': 't',
    '8': 'b',
  };

  private static readonly turkishDiacriticsMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'I': 'i',
    'İ': 'i', 'i': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u',
  };

  /**
   * Metni adım adım temizler ve normalize eder
   */
  public static normalize(text: string): string {
    if (!text) return '';

    // 1. Görünmez karakterleri temizle
    let cleaned = this.stripInvisibleCharacters(text);

    // 2. Türkçe küçültme
    cleaned = cleaned.toLocaleLowerCase('tr-TR');

    // 3. Türkçe aksan ve özel harfleri sadeleştir
    cleaned = this.stripTurkishDiacritics(cleaned);

    // 4. Harfler arasına gizlenmiş ayraçları birleştir (f-r-e-e-s-p-i-n -> freespin)
    cleaned = this.collapseSpacedOrHyphenatedWords(cleaned);

    // 5. Leetspeak çözümleme (b0nus -> bonus, c4sino -> casino)
    cleaned = this.replaceLeetspeak(cleaned);

    return cleaned;
  }

  private static stripInvisibleCharacters(text: string): string {
    return text.replace(/[\u200B\u200C\u200D\uFEFF\u00AD\u2060]/g, '');
  }

  private static stripTurkishDiacritics(text: string): string {
    return text.split('').map(char => this.turkishDiacriticsMap[char] || char).join('');
  }

  private static collapseSpacedOrHyphenatedWords(text: string): string {
    // Tek harfler arasına konulmuş boşluk, tire, nokta, alt çizgi vb. silinir
    return text.replace(/(?<=[a-z0-9])[ \.\-\_\*\~](?=[a-z0-9])/gi, '');
  }

  private static replaceLeetspeak(text: string): string {
    return text.split('').map(char => this.leetMap[char] || char).join('');
  }

  /**
   * Mesajı kurallara göre değerlendirir
   */
  public static evaluate(
    sender: string,
    messageBody: string,
    rules: FilterRules
  ): SpamVerdict {
    if (!messageBody || messageBody.trim().length === 0) {
      return {
        isJunk: false,
        action: 'ALLOW',
        reason: 'Boş mesaj gövdesi',
        normalizedBody: '',
        matchedRules: [],
      };
    }

    const rawLower = messageBody.toLocaleLowerCase('tr-TR');
    const normalizedBody = this.normalize(messageBody);
    const senderLower = (sender || '').toLocaleLowerCase('tr-TR');
    const matchedRules: string[] = [];

    // 1. Aşama: Whitelist (İstisnalar)
    for (const white of rules.whitelistKeywords) {
      const normWhite = white.toLocaleLowerCase('tr-TR');
      if (rawLower.includes(normWhite) || normalizedBody.includes(normWhite)) {
        return {
          isJunk: false,
          action: 'ALLOW',
          reason: `Güvenli kelime eşleşti (Whitelist): '${white}'`,
          normalizedBody,
          matchedRules: [`Whitelist: ${white}`],
        };
      }
    }

    // Güvenilir banka gönderenleri
    const trustedSenders = ['garanti', 'isbank', 'akbank', 'ziraat', 'yapikredi', 'qnb', 'vakifbank', 'halkbank', 'teb', 'enpara'];
    if (trustedSenders.some(bank => senderLower.includes(bank))) {
      return {
        isJunk: false,
        action: 'ALLOW',
        reason: `Güvenilir kurumsal banka göndereni: '${sender}'`,
        normalizedBody,
        matchedRules: [`Trusted Sender: ${sender}`],
      };
    }

    // 2. Aşama: Kara Liste Kelime Kontrolü
    for (const keyword of rules.blacklistKeywords) {
      const normKeyword = this.normalize(keyword);
      if (!normKeyword) continue;

      if (rawLower.includes(keyword.toLocaleLowerCase('tr-TR')) || normalizedBody.includes(normKeyword)) {
        matchedRules.push(`Kara Liste: ${keyword}`);
        return {
          isJunk: true,
          action: 'JUNK',
          reason: `Kara liste kelimesi tespit edildi: '${keyword}'`,
          normalizedBody,
          matchedRules,
        };
      }
    }

    // 3. Aşama: Regex ve Kısaltılmış URL Kontrolü
    for (const pattern of rules.regexPatterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(messageBody) || regex.test(normalizedBody)) {
          matchedRules.push(`Regex: ${pattern}`);
          return {
            isJunk: true,
            action: 'JUNK',
            reason: `Regex deseniyle eşleşti: '${pattern}'`,
            normalizedBody,
            matchedRules,
          };
        }
      } catch (e) {
        // Geçersiz regex ise atla
      }
    }

    // 4. Aşama: B-Kodu ve Bahis Terimi Kombinasyonu
    const bCodeRegex = /\bB\d{3}\b/i;
    if (bCodeRegex.test(messageBody)) {
      const bettingKeywords = ['oran', 'kupon', 'yatirim', 'cevrim', 'canli', 'giris', 'bonus', 'kazanc'];
      for (const term of bettingKeywords) {
        if (normalizedBody.includes(term)) {
          matchedRules.push(`B-Kodu + Bahis Terimi: ${term}`);
          return {
            isJunk: true,
            action: 'JUNK',
            reason: `B-kodu ve kumar terimi tespit edildi: '${term}'`,
            normalizedBody,
            matchedRules,
          };
        }
      }
    }

    return {
      isJunk: false,
      action: 'ALLOW',
      reason: 'Herhangi bir spam kuralıyla eşleşmedi',
      normalizedBody,
      matchedRules: [],
    };
  }
}

