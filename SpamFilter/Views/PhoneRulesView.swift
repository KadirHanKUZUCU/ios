import SwiftUI

struct PhoneRulesView: View {
    @Binding var rules: FilterRules
    let onSave: () -> Void
    
    @State private var newPrefix: String = ""
    @State private var newNumber: String = ""
    @State private var selectedTab: Int = 0 // 0: Ön Ekler, 1: Özel Numaralar
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Kategori", selection: $selectedTab) {
                    Text("Ön Ekler (\(rules.blockedNumberPrefixes.count))").tag(0)
                    Text("Özel Numaralar (\(rules.customBlockedNumbers.count))").tag(1)
                }
                .pickerStyle(.segmented)
                .padding()
                
                if selectedTab == 0 {
                    prefixesSection
                } else {
                    customNumbersSection
                }
            }
            .navigationTitle("Numara Engelleme")
            .background(Color(.systemGroupedBackground))
        }
    }
    
    // MARK: - Ön Ekler Bölümü
    private var prefixesSection: some View {
        List {
            Section(
                header: Text("Engellenecek Numara Ön Eki"),
                footer: Text("Örn: 90375, 90729 veya 90850 gibi sanal santral ve istenmeyen arama kodlarını ekleyin.")
            ) {
                HStack {
                    TextField("Örn: 90375 veya +90 729...", text: $newPrefix)
                        .keyboardType(.phonePad)
                    
                    Button(action: addPrefix) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundColor(.orange)
                    }
                    .disabled(newPrefix.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            
            Section(header: Text("Kayıtlı Ön Ek Blokları")) {
                if rules.blockedNumberPrefixes.isEmpty {
                    Text("Henüz engellenen ön ek eklenmedi.")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(rules.blockedNumberPrefixes, id: \.self) { prefix in
                        HStack {
                            Image(systemName: "phone.down.circle.fill")
                                .foregroundColor(.orange)
                            Text("+\(prefix) *")
                                .font(.system(.body, design: .monospaced))
                        }
                    }
                    .onDelete(perform: deletePrefix)
                }
            }
        }
    }
    
    // MARK: - Özel Numaralar Bölümü
    private var customNumbersSection: some View {
        List {
            Section(
                header: Text("Bireysel Numara Ekle"),
                footer: Text("Belirli bir telefon numarasını doğrudan arama kara listesine ekler.")
            ) {
                HStack {
                    TextField("Örn: 05321234567 veya +90532...", text: $newNumber)
                        .keyboardType(.phonePad)
                    
                    Button(action: addCustomNumber) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundColor(.red)
                    }
                    .disabled(newNumber.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            
            Section(header: Text("Engellenen Özel Numaralar")) {
                if rules.customBlockedNumbers.isEmpty {
                    Text("Henüz özel numara eklenmedi.")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(rules.customBlockedNumbers, id: \.self) { number in
                        HStack {
                            Image(systemName: "hand.raised.fill")
                                .foregroundColor(.red)
                            Text("+\(number)")
                                .font(.system(.body, design: .monospaced))
                        }
                    }
                    .onDelete(perform: deleteCustomNumber)
                }
            }
        }
    }
    
    // MARK: - Aksiyonlar
    private func addPrefix() {
        let sanitized = SharedDataManager.shared.sanitizePhoneNumber(newPrefix)
        guard !sanitized.isEmpty, !rules.blockedNumberPrefixes.contains(sanitized) else { return }
        rules.blockedNumberPrefixes.append(sanitized)
        newPrefix = ""
        onSave()
    }
    
    private func deletePrefix(at offsets: IndexSet) {
        rules.blockedNumberPrefixes.remove(atOffsets: offsets)
        onSave()
    }
    
    private func addCustomNumber() {
        let sanitized = SharedDataManager.shared.sanitizePhoneNumber(newNumber)
        guard !sanitized.isEmpty, !rules.customBlockedNumbers.contains(sanitized) else { return }
        rules.customBlockedNumbers.append(sanitized)
        newNumber = ""
        onSave()
    }
    
    private func deleteCustomNumber(at offsets: IndexSet) {
        rules.customBlockedNumbers.remove(atOffsets: offsets)
        onSave()
    }
}

