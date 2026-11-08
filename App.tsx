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
import { RulesScreen } from './src/screens/RulesScreen';
import { SimulatorScreen } from './src/screens/SimulatorScreen';
import { SyncScreen } from './src/screens/SyncScreen';

type Tab = 'vault' | 'rules' | 'simulator' | 'sync';

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
      <StatusBar style="light" />

      {/* Modern Cyber Obsidian Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoBadge}>🛡️ SPAMFILTER</Text>
          <Text style={styles.headerSubtitle}>Siber Kalkan & İstenmeyen İleti Filtresi</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>AKTİF</Text>
        </View>
      </View>

      {/* Screen Content */}
      <View style={styles.screenContainer}>
        {activeTab === 'vault' && <CategorizedVaultScreen />}
        {activeTab === 'rules' && (
          <RulesScreen rules={rules} onUpdateRules={handleUpdateRules} />
        )}
        {activeTab === 'simulator' && <SimulatorScreen rules={rules} />}
        {activeTab === 'sync' && (
          <SyncScreen rules={rules} onUpdateRules={handleUpdateRules} />
        )}
      </View>

      {/* Ultra-Modern iOS Cyber Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'vault' && styles.activeNavItem]}
          onPress={() => setActiveTab('vault')}
        >
          <Text style={styles.navIcon}>🛡️</Text>
          <Text style={[styles.navText, activeTab === 'vault' && styles.activeNavTextEmerald]}>
            Kalkan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'rules' && styles.activeNavItem]}
          onPress={() => setActiveTab('rules')}
        >
          <Text style={styles.navIcon}>⚡</Text>
          <Text style={[styles.navText, activeTab === 'rules' && styles.activeNavTextCyan]}>
            Kurallar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'simulator' && styles.activeNavItem]}
          onPress={() => setActiveTab('simulator')}
        >
          <Text style={styles.navIcon}>🔬</Text>
          <Text style={[styles.navText, activeTab === 'simulator' && styles.activeNavTextCyan]}>
            Canlı Test
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'sync' && styles.activeNavItem]}
          onPress={() => setActiveTab('sync')}
        >
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={[styles.navText, activeTab === 'sync' && styles.activeNavTextEmerald]}>
            Kurulum
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#162035',
    backgroundColor: '#090D16',
  },
  headerLeft: { flex: 1 },
  logoBadge: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  screenContainer: { flex: 1, backgroundColor: '#090D16' },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#162035',
    backgroundColor: '#0C1220',
    paddingVertical: 10,
    paddingBottom: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNavItem: {},
  navIcon: { fontSize: 18, marginBottom: 3 },
  navText: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  activeNavTextEmerald: { color: '#10B981', fontWeight: '800' },
  activeNavTextCyan: { color: '#38BDF8', fontWeight: '800' },
});
