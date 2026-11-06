import SwiftUI

struct ContentView: View {
    @State private var rules: FilterRules = SharedDataManager.shared.loadRules()
    
    var body: some View {
        TabView {
            KeywordRulesView(rules: $rules, onSave: saveRules)
                .tabItem {
                    Label("Kelimeler", systemImage: "text.bubble.fill")
                }
            
            RegexRulesView(rules: $rules, onSave: saveRules)
                .tabItem {
                    Label("Regex", systemImage: "curlybraces")
                }
            
            PhoneRulesView(rules: $rules, onSave: saveRules)
                .tabItem {
                    Label("Numaralar", systemImage: "phone.down.fill")
                }
            
            SMSSimulatorView(rules: $rules)
                .tabItem {
                    Label("Test Lab", systemImage: "bolt.shield.fill")
                }
            
            SyncStatusView(rules: $rules)
                .tabItem {
                    Label("Senkronizasyon", systemImage: "arrow.triangle.2.circlepath")
                }
        }
        .onAppear {
            rules = SharedDataManager.shared.loadRules()
        }
    }
    
    private func saveRules() {
        SharedDataManager.shared.saveRules(rules)
    }
}
