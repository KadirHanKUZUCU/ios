import SwiftUI

/// Canlı SMS Test Laboratuvarı: Gerçek SMS gelmeden kuralları ve leetspeak motorunu test etmeyi sağlar
struct SMSSimulatorView: View {
    @Binding var rules: FilterRules
    
    @State private var senderInput: String = "B214"
    @State private var bodyInput: String = "Tebrikler! 100 TL n4kit b4kiye ve 50 f-r-e-e-s-p-i-n hesabınıza eklendi: https://bit.ly/bonus777"
    
    @State private var simulationRun: Bool = false
    @State private var isJunk: Bool = false
    @State private var reasonString: String = ""
    @State private var normalizedResult: String = ""
    
    // Hızlı Test Şablonları
    private let sampleScenarios: [(title: String, sender: String, text: String)] = [
        (
            "🎰 Leetspeak & Bahis",
            "B214",
            "Tebrikler! 100 TL n4kit b4kiye ve 50 f-r-e-e-s-p-i-n hesabınıza eklendi: https://bit.ly/bonus777"
        ),
        (
            "🏦 Banka Doğrulama (Whitelist)",
            "GARANTI",
            "Degerli musterimiz, 123456 nolu onay kodu ile transfer isleminizi tamamlayabilirsiniz. Guvenlik kodunuzu paylasmayiniz."
        ),
        (
            "🔗 Kısaltılmış URL & Telegram",
            "+905320000000",
            "Guncel giris adresimiz degisti! Hemen tikla t.me/norabahis veya https://t.ly/matador"
        ),
        (
            "👤 Normal Arkadaş Mesajı",
            "+905421112233",
            "Selam kanka, aksam halı saha maci saat 20:00'de, gec kalma!"
        ),
        (
            "🛡️ Gizli Ayraçlı Spam",
            "SMS-INFO",
            "Hemen c.a.s.i.n.o oyna, d-i-s-c-o-u-n-t firsatini kacirma!"
        )
    ]
    
    var body: some View {
        NavigationStack {
            Form {
                // MARK: - Hazır Test Şablonları
                Section(header: Text("Hızlı Test Şablonları")) {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(sampleScenarios, id: \.title) { scenario in
                                Button(action: {
                                    senderInput = scenario.sender
                                    bodyInput = scenario.text
                                    runSimulation()
                                }) {
                                    Text(scenario.title)
                                        .font(.caption)
                                        .fontWeight(.medium)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 6)
                                        .background(Color.blue.opacity(0.12))
                                        .foregroundColor(.blue)
                                        .cornerRadius(8)
                                }
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
                
                // MARK: - Mesaj Girişi
                Section(header: Text("Simüle Edilecek Mesaj")) {
                    HStack {
                        Text("Gönderen:")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        TextField("Banka adı veya numara", text: $senderInput)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("SMS Metni:")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        TextEditor(text: $bodyInput)
                            .frame(minHeight: 80)
                            .font(.body)
                    }
                    
                    Button(action: runSimulation) {
                        HStack {
                            Spacer()
                            Image(systemName: "play.circle.fill")
                            Text("Simülasyonu Çalıştır")
                                .fontWeight(.bold)
                            Spacer()
                        }
                        .padding(.vertical, 8)
                        .foregroundColor(.white)
                        .background(Color.indigo)
                        .cornerRadius(8)
                    }
                }
                
                // MARK: - Analiz Sonucu
                if simulationRun {
                    Section(header: Text("Sistem Kararı (IdentityLookup)")) {
                        HStack(spacing: 12) {
                            Image(systemName: isJunk ? "exclamationmark.octagon.fill" : "checkmark.seal.fill")
                                .font(.system(size: 36))
                                .foregroundColor(isJunk ? .red : .green)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(isJunk ? "JUNK (İstenmeyen SMS)" : "NONE / ALLOW (Gelen Kutusu)")
                                    .font(.headline)
                                    .foregroundColor(isJunk ? .red : .green)
                                
                                Text(reasonString)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 6)
                    }
                    
                    Section(header: Text("Metin Normalizasyonu Detayı")) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Leetspeak & Karakter Temizliği:")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(normalizedResult)
                                .font(.system(.footnote, design: .monospaced))
                                .padding(8)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color(.tertiarySystemFill))
                                .cornerRadius(6)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
            .navigationTitle("SMS Test Laboratuvarı")
            .onAppear {
                runSimulation()
            }
        }
    }
    
    // MARK: - Simülasyon Çalıştırma
    private func runSimulation() {
        let verdict = SpamRuleEngine.evaluate(
            sender: senderInput,
            messageBody: bodyInput,
            rules: rules
        )
        
        normalizedResult = MessageNormalizer.normalize(bodyInput)
        
        switch verdict {
        case .junk(let reason):
            isJunk = true
            reasonString = reason
        case .allow(let reason):
            isJunk = false
            reasonString = reason
        }
        
        simulationRun = true
    }
}

