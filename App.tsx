import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FilterRules, DEFAULT_RULES } from './src/types';
import { RuleStorage } from './src/services/RuleStorage';
import { CategorizedVaultScreen } from './src/screens/CategorizedVaultScreen';
import { KeywordsScreen } from './src/screens/KeywordsScreen';
import { PhoneNumbersScreen } from './src/screens/PhoneNumbersScreen';
import { ReportSpamScreen } from './src/screens/ReportSpamScreen';
import { SimulatorScreen } from './src/screens/SimulatorScreen';
import { SyncScreen } from './src/screens/SyncScreen';

type Tab = 'vault' | 'keywords' | 'phones' | 'report' | 'simulator' | 'sync';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('vault');
  const [rules, setRules] = useState<FilterRules>(DEFAULT_RULES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const loaded = await RuleStorage.loadRules();
      setRules(loaded);
      setIsLoading(false);
    })();
  }, []);

  const handleUpdateRules = async (newRules: FilterRules) => {
    setRules(newRules);
    await RuleStorage.saveRules(newRules);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Üst Başlık */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛡️ SpamFilter</Text>
        <Text style={styles.headerSubtitle}>Akıllı Klasörler & İstenmeyen SMS/Çağrı Kalkanı</Text>
      </View>

      {/* Ekran İçeriği */}
      <View style={styles.screenContainer}>
        {activeTab === 'vault' && <CategorizedVaultScreen />}
        {activeTab === 'keywords' && (
          <KeywordsScreen rules={rules} onUpdateRules={handleUpdateRules} />
        )}
        {activeTab === 'phones' && (
          <PhoneNumbersScreen rules={rules} onUpdateRules={handleUpdateRules} />
        )}
        {activeTab === 'report' && (
          <ReportSpamScreen rules={rules} onUpdateRules={handleUpdateRules} />
        )}
        {activeTab === 'simulator' && <SimulatorScreen rules={rules} />}
        {activeTab === 'sync' && (
          <SyncScreen rules={rules} onUpdateRules={handleUpdateRules} />
        )}
      </View>

      {/* Alt Gezinme Çubuğu (Bottom Navigation) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'vault' && styles.activeNavItem]}
          onPress={() => setActiveTab('vault')}
        >
          <Text style={styles.navIcon}>🛡️</Text>
          <Text style={[styles.navText, activeTab === 'vault' && styles.activeNavTextBlue]}>
            Kalkan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'keywords' && styles.activeNavItem]}
          onPress={() => setActiveTab('keywords')}
        >
          <Text style={styles.navIcon}>💬</Text>
          <Text style={[styles.navText, activeTab === 'keywords' && styles.activeNavText]}>
            Kelimeler
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'phones' && styles.activeNavItem]}
          onPress={() => setActiveTab('phones')}
        >
          <Text style={styles.navIcon}>📞</Text>
          <Text style={[styles.navText, activeTab === 'phones' && styles.activeNavText]}>
            Numaralar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'report' && styles.activeNavItem]}
          onPress={() => setActiveTab('report')}
        >
          <Text style={styles.navIcon}>🚨</Text>
          <Text style={[styles.navText, activeTab === 'report' && styles.activeNavTextRed]}>
            Spam Bildir
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'simulator' && styles.activeNavItem]}
          onPress={() => setActiveTab('simulator')}
        >
          <Text style={styles.navIcon}>🧪</Text>
          <Text style={[styles.navText, activeTab === 'simulator' && styles.activeNavText]}>
            Test Lab
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'sync' && styles.activeNavItem]}
          onPress={() => setActiveTab('sync')}
        >
          <Text style={styles.navIcon}>🔄</Text>
          <Text style={[styles.navText, activeTab === 'sync' && styles.activeNavText]}>
            Senkron
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111' },
  headerSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  screenContainer: { flex: 1, backgroundColor: '#F2F2F7' },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingBottom: 16,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeNavItem: {},
  navIcon: { fontSize: 17, marginBottom: 2 },
  navText: { fontSize: 9, color: '#8E8E93', fontWeight: '500' },
  activeNavText: { color: '#2563EB', fontWeight: '700' },
  activeNavTextBlue: { color: '#0284C7', fontWeight: '700' },
  activeNavTextRed: { color: '#DC2626', fontWeight: '700' },
});
