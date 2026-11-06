import SwiftUI

struct KeywordRulesView: View {
    @Binding var rules: FilterRules
    let onSave: () -> Void
    
    @State private var newKeyword: String = ""
    @State private var newWhitelistWord: String = ""
    @State private var selectedTab: Int = 0 // 0: Kara Liste, 1: Güvenli Liste
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Liste Türü", selection: $selectedTab) {
                    Text("Kara Liste (\(rules.blacklistKeywords.count))").tag(0)
                    Text("Güvenli Liste (\(rules.whitelistKeywords.count))").tag(1)
                }
                .pickerStyle(.segmented)
                .padding()
                
                if selectedTab == 0 {
                    blacklistSection
                } else {
                    whitelistSection
                }
            }
            .navigationTitle("Kelime Kuralları")
            .background(Color(.systemGroupedBackground))
        }
    }
    
    // MARK: - Kara Liste Bölümü
    private var blacklistSection: some View {
        List {
            Section(header: Text("Yeni Kelime Ekle"), footer: Text("Mesajda bu kelimeler (veya leetspeak varyasyonları: b0nus, c4sino vb.) geçtiğinde SMS 'İstenmeyen' olarak işaretlenir.")) {
                HStack {
                    TextField("Örn: matadorbet, freespin...", text: $newKeyword)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                    
                    Button(action: addKeyword) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundColor(.red)
                    }
                    .disabled(newKeyword.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            
            Section(header: Text("Engellenen Kelimeler")) {
                if rules.blacklistKeywords.isEmpty {
                    Text("Henüz kara liste kelimesi eklenmedi.")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(rules.blacklistKeywords, id: \.self) { word in
                        HStack {
                            Image(systemName: "slash.circle.fill")
                                .foregroundColor(.red)
                            Text(word)
                                .font(.body)
                        }
                    }
                    .onDelete(perform: deleteKeyword)
                }
            }
        }
    }
    
    // MARK: - Güvenli Liste (Whitelist) Bölümü
    private var whitelistSection: some View {
        List {
            Section(header: Text("Güvenli Kelime Ekle"), footer: Text("Bu kelimeleri içeren SMS'ler (banka şifresi, hesap ekstresi vb.) asla engellenmez.")) {
                HStack {
                    TextField("Örn: onay kodu, şifre, transfer...", text: $newWhitelistWord)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                    
                    Button(action: addWhitelistWord) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.title2)
                            .foregroundColor(.green)
                    }
                    .disabled(newWhitelistWord.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            
            Section(header: Text("İstisna Kelimeler")) {
                if rules.whitelistKeywords.isEmpty {
                    Text("Henüz istisna kelimesi eklenmedi.")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(rules.whitelistKeywords, id: \.self) { word in
                        HStack {
                            Image(systemName: "shield.checkmark.fill")
                                .foregroundColor(.green)
                            Text(word)
                                .font(.body)
                        }
                    }
                    .onDelete(perform: deleteWhitelistWord)
                }
            }
        }
    }
    
    // MARK: - Aksiyonlar
    private func addKeyword() {
        let trimmed = newKeyword.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !trimmed.isEmpty, !rules.blacklistKeywords.contains(trimmed) else { return }
        rules.blacklistKeywords.append(trimmed)
        newKeyword = ""
        onSave()
    }
    
    private func deleteKeyword(at offsets: IndexSet) {
        rules.blacklistKeywords.remove(atOffsets: offsets)
        onSave()
    }
    
    private func addWhitelistWord() {
        let trimmed = newWhitelistWord.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !trimmed.isEmpty, !rules.whitelistKeywords.contains(trimmed) else { return }
        rules.whitelistKeywords.append(trimmed)
        newWhitelistWord = ""
        onSave()
    }
    
    private func deleteWhitelistWord(at offsets: IndexSet) {
        rules.whitelistKeywords.remove(atOffsets: offsets)
        onSave()
    }
}

