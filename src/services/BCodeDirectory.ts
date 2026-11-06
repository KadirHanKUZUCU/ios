export interface BCodeInfo {
  code: string;
  operatorName: string;
  category: 'MAJOR_CARRIER' | 'CORPORATE_SMS' | 'HIGH_RISK_SPAM' | 'UNKNOWN';
  description: string;
}

export class BCodeDirectory {
  private static readonly database: Record<string, BCodeInfo> = {
    B001: {
      code: 'B001',
      operatorName: 'Türk Telekomünikasyon A.Ş.',
      category: 'MAJOR_CARRIER',
      description: 'Türkiye ana altyapı operatörü (Resmi kurum ve bankalar kullanır).',
    },
    B002: {
      code: 'B002',
      operatorName: 'Turkcell İletişim Hizmetleri A.Ş.',
      category: 'MAJOR_CARRIER',
      description: 'Türkiye ana mobil operatörü (Güvenilir kurumsal SMS sağlayıcısı).',
    },
    B003: {
      code: 'B003',
      operatorName: 'Vodafone Telekomünikasyon A.Ş.',
      category: 'MAJOR_CARRIER',
      description: 'Türkiye ana mobil operatörü.',
    },
    B018: {
      code: 'B018',
      operatorName: 'Superonline İletişim Hizmetleri',
      category: 'CORPORATE_SMS',
      description: 'Kurumsal internet ve SMS sağlayıcısı.',
    },
    B021: {
      code: 'B021',
      operatorName: 'Netgsm İletişim ve Bilgi Teknolojileri',
      category: 'CORPORATE_SMS',
      description: 'Sanal mobil operatör ve toplu ticari SMS sağlayıcısı.',
    },
    B030: {
      code: 'B030',
      operatorName: 'Türk Telekom Mobil (Avea)',
      category: 'MAJOR_CARRIER',
      description: 'Mobil operatör ağı.',
    },
    B154: {
      code: 'B154',
      operatorName: 'Verimor Telekomünikasyon',
      category: 'HIGH_RISK_SPAM',
      description: 'Sıklıkla yetkisiz bahis ve toplu pazarlama şikayetlerinde adı geçen sanal santral aracı.',
    },
    B214: {
      code: 'B214',
      operatorName: 'Fiks İletişim / Sanal SMS Servisi',
      category: 'HIGH_RISK_SPAM',
      description: 'Yasadışı bahis, kumar ve sahte kredi mesajlarında yoğun tespit edilen B-kodu.',
    },
    B250: {
      code: 'B250',
      operatorName: 'Organik Haberleşme Teknolojileri',
      category: 'HIGH_RISK_SPAM',
      description: 'Freespin ve kaçak casino reklamlarında sıkça kullanılan toplu SMS kodu.',
    },
    B273: {
      code: 'B273',
      operatorName: 'Mikro İletişim Hizmetleri',
      category: 'HIGH_RISK_SPAM',
      description: 'İzinsiz ticari elektronik ileti şikayetlerinde yüksek riskli sanal aracı.',
    },
  };

  /**
   * Mesaj metninden B-kodunu (örn: B001, B214) ayıklar
   */
  public static extractBCode(text: string): string | null {
    const match = text.match(/\b(B\d{3})\b/i);
    return match ? match[1].toUpperCase() : null;
  }

  /**
   * B-koduna göre operatör ve risk bilgisini döndürür
   */
  public static lookup(codeOrText: string): BCodeInfo {
    const code = this.extractBCode(codeOrText) || codeOrText.toUpperCase();
    if (this.database[code]) {
      return this.database[code];
    }
    return {
      code,
      operatorName: 'Bilinmeyen / Kayıtsız SMS Taşıyıcısı',
      category: 'UNKNOWN',
      description: 'BTK veritabanında standart dışı veya yabancı aracı operatör.',
    };
  }
}

