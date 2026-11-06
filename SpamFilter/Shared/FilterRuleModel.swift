import Foundation

/// Tüm filtreleme kurallarını temsil eden model
public struct FilterRules: Codable, Equatable {
    public var blacklistKeywords: [String]
    public var regexPatterns: [String]
    public var blockedNumberPrefixes: [String]
    public var customBlockedNumbers: [String]
    public var whitelistKeywords: [String]
    
    public init(
        blacklistKeywords: [String] = FilterRules.defaultBlacklistKeywords,
        regexPatterns: [String] = FilterRules.defaultRegexPatterns,
        blockedNumberPrefixes: [String] = FilterRules.defaultBlockedPrefixes,
        customBlockedNumbers: [String] = [],
        whitelistKeywords: [String] = FilterRules.defaultWhitelistKeywords
    ) {
        self.blacklistKeywords = blacklistKeywords
        self.regexPatterns = regexPatterns
        self.blockedNumberPrefixes = blockedNumberPrefixes
        self.customBlockedNumbers = customBlockedNumbers
        self.whitelistKeywords = whitelistKeywords
    }
    
    // MARK: - Varsayılan Kurallar
    public static let defaultBlacklistKeywords: [String] = [
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
    ]
    
    public static let defaultRegexPatterns: [String] = [
        #"https?:\/\/(t\.ly|mtd\.s\.gy|bit\.ly|tinyurl\.com|cutt\.ly)\/[a-zA-Z0-9_-]+"#,
        #"(?i)(b\d{3})\b.*?(bahis|bonus|slot|casino|freespin)"#, // B-kodu ile bahis terimi kombinasyonu
        #"(?i)(kazan|bonus|fırsat)\s*[:=]\s*https?:\/\/\S+"#
    ]
    
    public static let defaultBlockedPrefixes: [String] = [
        "90375", // Sanal santral / şüpheli VoIP blokları
        "90729",
        "90850"  // İstenmeyen kurumsal çağrı ön eki (özelleştirilebilir)
    ]
    
    public static let defaultWhitelistKeywords: [String] = [
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
}

