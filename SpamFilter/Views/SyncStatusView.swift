import SwiftUI
import CallKit

struct SyncStatusView: View {
    @Binding var rules: FilterRules
    
    @State private var isSyncing: Bool = false
    @State private var alertTitle: String = ""
    @State private var alertMessage: String = ""
    @State private var showAlert: Bool = false
    @State private var extensionStatusText: String = "Kontrol ediliyor..."
    @State private var lastSyncDateText: String = "Henüz yapılmadı"
    
    var body: some View {
        NavigationStack {
            List {
                // MARK: - Senkronizasyon Durumu ve Butonu
                Section(header: Text("CallKit Senkronizasyonu")) {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Çağrı engelleme listesi iOS sistem düzeyinde çalışır. Eklediğiniz veya sildiğiniz numaraların aktif olması için Call Directory sistemini senkronize etmelisiniz.")
                            .font(.footnote)
                            .foregroundColor(.secondary)
                        
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Arama Filtresi Durumu:")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(extensionStatusText)
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                            }
                            Spacer()
                        }
                        
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Son Senkronizasyon:")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(lastSyncDateText)
                                    .font(.footnote)
                            }
                            Spacer()
                        }
                        
                        Button(action: syncRulesWithCallKit) {
                            HStack {
                                Spacer()
                                if isSyncing {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .padding(.trailing, 8)
                                }
                                Image(systemName: "arrow.triangle.2.circlepath")
                                Text(isSyncing ? "Senkronize Ediliyor..." : "Kuralları Senkronize Et")
                                    .fontWeight(.bold)
                                Spacer()
                            }
                            .padding(.vertical, 12)
                            .foregroundColor(.white)
                            .background(isSyncing ? Color.gray : Color.blue)
                            .cornerRadius(10)
                        }
                        .disabled(isSyncing)
                    }
                    .padding(.vertical, 6)
                }
                
                // MARK: - İstatistikler
                Section(header: Text("Aktif Kural Özeti")) {
                    HStack {
                        Label("Kara Liste Kelimeleri", systemImage: "text.badge.minus")
                        Spacer()
                        Text("\(rules.blacklistKeywords.count)")
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Label("Regex Kalıpları", systemImage: "curlybraces")
                        Spacer()
                        Text("\(rules.regexPatterns.count)")
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Label("Engellenen Ön Ekler", systemImage: "phone.down")
                        Spacer()
                        Text("\(rules.blockedNumberPrefixes.count)")
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Label("Özel Numaralar", systemImage: "hand.raised")
                        Spacer()
                        Text("\(rules.customBlockedNumbers.count)")
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Label("Güvenli Liste (Whitelist)", systemImage: "shield.checkmark")
                        Spacer()
                        Text("\(rules.whitelistKeywords.count)")
                            .foregroundColor(.secondary)
                    }
                }
                
                // MARK: - Kurulum & iOS İzin Rehberi
                Section(header: Text("Gerekli iOS Sistem Ayarları")) {
                    VStack(alignment: .leading, spacing: 10) {
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("1. SMS Filtresini Etkinleştirme")
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                Text("Ayarlar > Mesajlar > Bilinmeyen ve İstenmeyen > Uygulamayı seçin ve açın.")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        } icon: {
                            Image(systemName: "message.badge.filled.fill")
                                .foregroundColor(.green)
                        }
                        
                        Divider()
                        
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("2. Arama Engellemeyi Etkinleştirme")
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                Text("Ayarlar > Telefon > Arama Engelleme ve No. Belirleme > Uygulamaya izin verin.")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        } icon: {
                            Image(systemName: "phone.badge.checkmark")
                                .foregroundColor(.blue)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("Senkronizasyon")
            .background(Color(.systemGroupedBackground))
            .onAppear(perform: loadSyncInfo)
            .alert(isPresented: $showAlert) {
                Alert(
                    title: Text(alertTitle),
                    message: Text(alertMessage),
                    dismissButton: .default(Text("Tamam"))
                )
            }
        }
    }
    
    // MARK: - Senkronizasyon Metotları
    
    private func loadSyncInfo() {
        let (date, status) = SharedDataManager.shared.lastSyncInfo()
        if let date = date {
            let formatter = DateFormatter()
            formatter.dateStyle = .short
            formatter.timeStyle = .medium
            lastSyncDateText = formatter.string(from: date)
        } else {
            lastSyncDateText = "Henüz yapılmadı"
        }
        
        // Call Directory Extension durumunu kontrol et
        CXCallDirectoryManager.sharedInstance.getEnabledStatusForExtension(
            withIdentifier: AppGroupConstants.callDirectoryExtensionId
        ) { status, error in
            DispatchQueue.main.async {
                if let error = error {
                    self.extensionStatusText = "Hata: \(error.localizedDescription)"
                    return
                }
                
                switch status {
                case .enabled:
                    self.extensionStatusText = "✅ Aktif (Etkinleştirildi)"
                case .disabled:
                    self.extensionStatusText = "⚠️ Devre Dışı (Ayarlardan açılmalı)"
                case .unknown:
                    self.extensionStatusText = "❓ Bilinmiyor (Simülatör veya izin bekliyor)"
                @unknown default:
                    self.extensionStatusText = "Bilinmiyor"
                }
            }
        }
    }
    
    private func syncRulesWithCallKit() {
        isSyncing = true
        
        // 1. Kuralları App Group storage'ına kaydet
        SharedDataManager.shared.saveRules(rules)
        
        // 2. CallDirectoryManager üzerinden reloadExtension çağır
        CXCallDirectoryManager.sharedInstance.reloadExtension(
            withIdentifier: AppGroupConstants.callDirectoryExtensionId
        ) { error in
            DispatchQueue.main.async {
                self.isSyncing = false
                
                if let error = error as? CXErrorCodeCallDirectoryManagerError {
                    handleCallKitError(error)
                } else if let error = error {
                    self.alertTitle = "Senkronizasyon Hatası"
                    self.alertMessage = error.localizedDescription
                    self.showAlert = true
                    SharedDataManager.shared.recordSyncResult(success: false, message: error.localizedDescription)
                } else {
                    self.alertTitle = "Başarılı"
                    self.alertMessage = "Kurallar başarıyla CallKit sistemine yüklendi. Çağrı engelleme listesi güncellendi."
                    self.showAlert = true
                    SharedDataManager.shared.recordSyncResult(success: true, message: "Başarılı")
                    self.loadSyncInfo()
                }
            }
        }
    }
    
    private func handleCallKitError(_ error: CXErrorCodeCallDirectoryManagerError) {
        self.alertTitle = "CallKit Hatası"
        
        switch error.code {
        case .entriesOutOfOrder:
            self.alertMessage = "Numaralar küçükten büyüğe sıralı değil (entriesOutOfOrder). Kod içindeki sıralama algoritması kontrol edilmelidir."
        case .duplicateEntries:
            self.alertMessage = "Listede mükerrer numaralar tespit edildi (duplicateEntries)."
        case .extensionDisabled:
            self.alertMessage = "Uygulama eklentisi iOS Ayarlar'ında kapalı! Lütfen Ayarlar > Telefon > Arama Engelleme ve No. Belirleme bölümünden izin verin."
        case .maximumEntriesExceeded:
            self.alertMessage = "İzin verilen maksimum numara sınırı aşıldı."
        case .currentlyLoading:
            self.alertMessage = "Eklenti şu anda zaten yükleniyor. Lütfen birkaç saniye sonra tekrar deneyin."
        default:
            self.alertMessage = "Hata kodu: \(error.code.rawValue) - \(error.localizedDescription)"
        }
        
        SharedDataManager.shared.recordSyncResult(success: false, message: self.alertMessage)
        self.showAlert = true
    }
}

