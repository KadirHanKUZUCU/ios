import Foundation

/// App Groups aracılığıyla Container App ve Extension'lar arasında veri paylaşımını yöneten servis
public final class SharedDataManager: @unchecked Sendable {
    public static let shared = SharedDataManager()
    
    private let suiteName: String
    private let userDefaults: UserDefaults?
    private let fileManager = FileManager.default
    private let lock = NSLock()
    
    private init(suiteName: String = AppGroupConstants.appGroupId) {
        self.suiteName = suiteName
        self.userDefaults = UserDefaults(suiteName: suiteName)
    }
    
    // MARK: - Paylaşılan Dosya Yolu
    private var sharedContainerURL: URL? {
        fileManager.containerURL(forSecurityApplicationGroupIdentifier: suiteName)
    }
    
    private var rulesFileURL: URL? {
        sharedContainerURL?.appendingPathComponent("rules.json")
    }
    
    // MARK: - Kural Yükleme & Kaydetme
    
    /// Kuralları App Group UserDefaults'tan (veya paylaşılan JSON dosyasından) okur
    public func loadRules() -> FilterRules {
        lock.lock()
        defer { lock.unlock() }
        
        // 1. Önce UserDefaults'tan dene
        if let data = userDefaults?.data(forKey: AppGroupConstants.Keys.rules),
           let rules = try? JSONDecoder().decode(FilterRules.self, from: data) {
            return rules
        }
        
        // 2. UserDefaults boşsa paylaşılan JSON dosyasından dene
        if let fileURL = rulesFileURL,
           let data = try? Data(contentsOf: fileURL),
           let rules = try? JSONDecoder().decode(FilterRules.self, from: data) {
            return rules
        }
        
        // 3. İlk açılışta varsayılan kuralları kaydet ve döndür
        let initialRules = FilterRules()
        saveRulesInternal(initialRules)
        return initialRules
    }
    
    /// Kuralları hem UserDefaults'a hem de paylaşılan JSON dosyasına yazar
    public func saveRules(_ rules: FilterRules) {
        lock.lock()
        defer { lock.unlock() }
        saveRulesInternal(rules)
    }
    
    private func saveRulesInternal(_ rules: FilterRules) {
        guard let data = try? JSONEncoder().encode(rules) else { return }
        
        // UserDefaults'a yaz
        userDefaults?.set(data, forKey: AppGroupConstants.Keys.rules)
        userDefaults?.synchronize()
        
        // Paylaşılan JSON dosyasına yedekle
        if let fileURL = rulesFileURL {
            try? data.write(to: fileURL, options: .atomic)
        }
    }
    
    // MARK: - Ekleme / Silme Kolaylık Metotları
    
    public func addBlacklistKeyword(_ keyword: String) {
        var rules = loadRules()
        let trimmed = keyword.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !trimmed.isEmpty, !rules.blacklistKeywords.contains(trimmed) else { return }
        rules.blacklistKeywords.append(trimmed)
        saveRules(rules)
    }
    
    public func removeBlacklistKeyword(at offsets: IndexSet) {
        var rules = loadRules()
        rules.blacklistKeywords.remove(atOffsets: offsets)
        saveRules(rules)
    }
    
    public func addRegexPattern(_ pattern: String) {
        var rules = loadRules()
        let trimmed = pattern.trimmingCharacters(in: .whitespacesAndNewlines)
        // Geçerli bir regex mi kontrol et
        guard !trimmed.isEmpty, (try? NSRegularExpression(pattern: trimmed)) != nil else { return }
        guard !rules.regexPatterns.contains(trimmed) else { return }
        rules.regexPatterns.append(trimmed)
        saveRules(rules)
    }
    
    public func removeRegexPattern(at offsets: IndexSet) {
        var rules = loadRules()
        rules.regexPatterns.remove(atOffsets: offsets)
        saveRules(rules)
    }
    
    public func addBlockedPrefix(_ prefix: String) {
        var rules = loadRules()
        let sanitized = sanitizePhoneNumber(prefix)
        guard !sanitized.isEmpty, !rules.blockedNumberPrefixes.contains(sanitized) else { return }
        rules.blockedNumberPrefixes.append(sanitized)
        saveRules(rules)
    }
    
    public func removeBlockedPrefix(at offsets: IndexSet) {
        var rules = loadRules()
        rules.blockedNumberPrefixes.remove(atOffsets: offsets)
        saveRules(rules)
    }
    
    public func addCustomBlockedNumber(_ number: String) {
        var rules = loadRules()
        let sanitized = sanitizePhoneNumber(number)
        guard !sanitized.isEmpty, !rules.customBlockedNumbers.contains(sanitized) else { return }
        rules.customBlockedNumbers.append(sanitized)
        saveRules(rules)
    }
    
    public func removeCustomBlockedNumber(at offsets: IndexSet) {
        var rules = loadRules()
        rules.customBlockedNumbers.remove(atOffsets: offsets)
        saveRules(rules)
    }
    
    public func addWhitelistKeyword(_ keyword: String) {
        var rules = loadRules()
        let trimmed = keyword.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !trimmed.isEmpty, !rules.whitelistKeywords.contains(trimmed) else { return }
        rules.whitelistKeywords.append(trimmed)
        saveRules(rules)
    }
    
    public func removeWhitelistKeyword(at offsets: IndexSet) {
        var rules = loadRules()
        rules.whitelistKeywords.remove(atOffsets: offsets)
        saveRules(rules)
    }
    
    // MARK: - Senkronizasyon Durumu
    
    public func recordSyncResult(success: Bool, message: String) {
        userDefaults?.set(Date().timeIntervalSince1970, forKey: AppGroupConstants.Keys.lastCallSyncDate)
        userDefaults?.set(message, forKey: AppGroupConstants.Keys.lastCallSyncStatus)
        userDefaults?.synchronize()
    }
    
    public func lastSyncInfo() -> (date: Date?, status: String?) {
        let timestamp = userDefaults?.double(forKey: AppGroupConstants.Keys.lastCallSyncDate) ?? 0
        let date = timestamp > 0 ? Date(timeIntervalSince1970: timestamp) : nil
        let status = userDefaults?.string(forKey: AppGroupConstants.Keys.lastCallSyncStatus)
        return (date, status)
    }
    
    // MARK: - Numara Temizleme Yardımcısı
    
    public func sanitizePhoneNumber(_ input: String) -> String {
        // "+", boşluk, tire gibi karakterleri temizler
        var cleaned = input.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
        // Eğer 0 ile başlıyorsa Türkiye kodu için 90 ekle veya 0'ı kaldır (örnek: 0532 -> 90532)
        if cleaned.hasPrefix("0") {
            cleaned = "9" + cleaned
        }
        return cleaned
    }
}

