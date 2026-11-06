import Foundation

/// App Group tanımlayıcısı ve paylaşılan UserDefaults anahtarları
public enum AppGroupConstants {
    /// Xcode Signing & Capabilities altında yapılandırılan App Group kimliği
    public static let appGroupId = "group.com.app.spamfilter"
    
    /// Call Directory Extension bundle kimliği
    public static let callDirectoryExtensionId = "com.app.spamfilter.CallDirectoryExtension"
    
    /// Paylaşılan depolama anahtarları
    public enum Keys {
        public static let rules = "spam_filter_rules_key"
        public static let lastCallSyncDate = "last_call_sync_date"
        public static let lastCallSyncStatus = "last_call_sync_status"
    }
}

