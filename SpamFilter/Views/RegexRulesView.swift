import SwiftUI

struct RegexRulesView: View {
    @Binding var rules: FilterRules
    let onSave: () -> Void
    
    @State private var newPattern: String = ""
    @State private var patternValidationError: String? = nil
    
    // Canlı Regex Test Alanı
    @State private var testText: String = ""
    @State private var testMatchResult: String? = nil
    
    var body: some View {
        NavigationStack {
            List {
                Section(
                    header: Text("Yeni Regex Kalıbı Ekle"),
                    footer: Text(patternValidationError ?? "Kısaltılmış linkler (bit.ly, t.ly vb.) veya B-kodu kalıpları için düzenli ifadeler ekleyin.")
                        .foregroundColor(patternValidationError == nil ? .secondary : .red)
                ) {
                    HStack {
                        TextField(#"Örn: https?:\/\/(t\.ly|bit\.ly)\/\S+"#, text: $newPattern)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                            .font(.system(.body, design: .monospaced))
                            .onChange(of: newPattern) { _ in
                                validateCurrentInput()
                            }
                        
                        Button(action: addPattern) {
                            Image(systemName: "plus.circle.fill")
                                .font(.title2)
                                .foregroundColor(.blue)
                        }
                        .disabled(newPattern.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || patternValidationError != nil)
                    }
                }
                
                Section(header: Text("Kayıtlı Regex Desenleri")) {
                    if rules.regexPatterns.isEmpty {
                        Text("Henüz regex deseni eklenmedi.")
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(rules.regexPatterns, id: \.self) { pattern in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(pattern)
                                    .font(.system(.subheadline, design: .monospaced))
                                    .foregroundColor(.primary)
                            }
                            .padding(.vertical, 2)
                        }
                        .onDelete(perform: deletePattern)
                    }
                }
                
                Section(header: Text("Canlı Regex Test Aracı")) {
                    TextField("Test edilecek örnek SMS metnini buraya yapıştırın...", text: $testText)
                        .onChange(of: testText) { _ in
                            runLiveTest()
                        }
                    
                    if let result = testMatchResult {
                        HStack {
                            Image(systemName: result.starts(with: "Eşleşti") ? "exclamationmark.triangle.fill" : "checkmark.seal.fill")
                                .foregroundColor(result.starts(with: "Eşleşti") ? .red : .green)
                            Text(result)
                                .font(.footnote)
                                .foregroundColor(result.starts(with: "Eşleşti") ? .red : .green)
                        }
                    }
                }
            }
            .navigationTitle("Regex Kalıpları")
            .background(Color(.systemGroupedBackground))
        }
    }
    
    // MARK: - Doğrulama ve Aksiyonlar
    
    private func validateCurrentInput() {
        let trimmed = newPattern.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            patternValidationError = nil
            return
        }
        
        do {
            _ = try NSRegularExpression(pattern: trimmed)
            patternValidationError = nil
        } catch {
            patternValidationError = "Geçersiz Regex sözdizimi: \(error.localizedDescription)"
        }
    }
    
    private func addPattern() {
        let trimmed = newPattern.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !rules.regexPatterns.contains(trimmed) else { return }
        guard (try? NSRegularExpression(pattern: trimmed)) != nil else { return }
        
        rules.regexPatterns.append(trimmed)
        newPattern = ""
        patternValidationError = nil
        onSave()
        runLiveTest()
    }
    
    private func deletePattern(at offsets: IndexSet) {
        rules.regexPatterns.remove(atOffsets: offsets)
        onSave()
        runLiveTest()
    }
    
    private func runLiveTest() {
        guard !testText.isEmpty else {
            testMatchResult = nil
            return
        }
        
        for pattern in rules.regexPatterns {
            if let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) {
                let range = NSRange(testText.startIndex..<testText.endIndex, in: testText)
                if regex.firstMatch(in: testText, options: [], range: range) != nil {
                    testMatchResult = "Eşleşti! Kural: \(pattern)"
                    return
                }
            }
        }
        testMatchResult = "Temiz: Hiçbir regex ile eşleşmedi."
    }
}

