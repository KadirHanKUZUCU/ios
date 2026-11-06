import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { BCodeDirectory, BCodeInfo } from '../services/BCodeDirectory';
import { AuditLogger, AuditLogEntry } from '../services/AuditLogger';
import { RuleStorage } from '../services/RuleStorage';
import { FilterRules, DEFAULT_RULES } from '../types';

export const CategorizedVaultScreen: React.FC = () => {
  const [rules, setRules] = useState<FilterRules>(DEFAULT_RULES);
  const [bCodeQuery, setBCodeQuery] = useState('');
  const [bCodeResult, setBCodeResult] = useState<BCodeInfo | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const loadedRules = await RuleStorage.loadRules();
      setRules(loadedRules);

      const logs = await AuditLogger.getLogs();
      setRecentLogs(logs.slice(0, 10));
    } catch (e) {
      console.error('Dashboard yüklenirken hata:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearchBCode = () => {
    const trimmed = bCodeQuery.trim().toUpperCase();
    if (!trimmed) {
      setBCodeResult(null);
      return;
    }
    const result = BCodeDirectory.lookup(trimmed);
    if (result) {
      setBCodeResult(result);
    } else {
      Alert.alert(
        'Kod Bulunamadı',
        `${trimmed} kodu resmi BTK rehberinde kayıtlı değil veya yasa dışı yurt dışı iletimi olabilir.`
      );
      setBCodeResult(null);
    }
  };

  const getThreatBadge = (category: string) => {
    switch (category) {
      case 'MAJOR_CARRIER':
        return { text: 'GÜVENLİ (Resmi Ana Operatör)', color: '#2ecc71', bg: '#e8f8f0' };
      case 'CORPORATE_SMS':
        return { text: 'KURUMSAL / SANAL OPERATÖR', color: '#3498db', bg: '#ebf5fb' };
      case 'HIGH_RISK_SPAM':
        return { text: 'YÜKSEK RİSK (Bahis/Spam Raporlu)', color: '#e74c3c', bg: '#fdedec' };
      default:
        return { text: 'BİLİNMEYEN OPERATÖR', color: '#95a5a6', bg: '#f2f4f4' };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={loadDashboardData} />
      }
    >
      {/* 1. Kalkan Ana Durum Kartı */}
      <View style={styles.shieldCard}>
        <View style={styles.shieldHeader}>
          <Text style={styles.shieldIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <View style={styles.statusPill}>
              <View style={styles.greenDot} />
              <Text style={styles.statusPillText}>KALKAN DEVREDE</Text>
            </View>
            <Text style={styles.shieldTitle}>Sistem Koruması Aktif</Text>
            <Text style={styles.shieldSubtitle}>
              iOS Mesajlar (IdentityLookup) ve Telefon (CallKit) koruma motoru aktif olarak çalışıyor.
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Aktif Güvenlik İstatistikleri */}
      <Text style={styles.sectionHeader}>📊 Aktif Koruma Özeti</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{rules.blacklistKeywords.length}</Text>
          <Text style={styles.statLabel}>Kara Liste Kelimesi</Text>
          <Text style={styles.statSub}>Bahis, Casino, vb.</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{rules.whitelistKeywords.length}</Text>
          <Text style={styles.statLabel}>Güvenli Şablon</Text>
          <Text style={styles.statSub}>Banka OTP, Kargo</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{rules.blockedNumberPrefixes.length}</Text>
          <Text style={styles.statLabel}>Numara Ön Eki</Text>
          <Text style={styles.statSub}>+850, +90375 vb.</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>273</Text>
          <Text style={styles.statLabel}>BTK Operatör Kodu</Text>
          <Text style={styles.statSub}>B001 - B273 Kayıtlı</Text>
        </View>
      </View>

      {/* 3. BTK B-Kodu Hızlı Sorgulama */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔍 BTK Operatör B-Kodu Doğrulama</Text>
        <Text style={styles.cardDesc}>
          Gelen SMS'lerin en sonundaki "B001", "B002", "B214" gibi kodları sorgulayıp mesajın hangi operatörden çıktığını öğrenin.
        </Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Örn: B001, B002, B214..."
            placeholderTextColor="#999"
            value={bCodeQuery}
            onChangeText={setBCodeQuery}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchBCode}>
            <Text style={styles.searchButtonText}>Sorgula</Text>
          </TouchableOpacity>
        </View>

        {bCodeResult && (
          <View style={styles.resultBox}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultCode}>{bCodeResult.code}</Text>
              <View
                style={[
                  styles.threatBadge,
                  { backgroundColor: getThreatBadge(bCodeResult.category).bg },
                ]}
              >
                <Text
                  style={[
                    styles.threatBadgeText,
                    { color: getThreatBadge(bCodeResult.category).color },
                  ]}
                >
                  {getThreatBadge(bCodeResult.category).text}
                </Text>
              </View>
            </View>

            <Text style={styles.resultOperator}>{bCodeResult.operatorName}</Text>
            <Text style={styles.resultDesc}>{bCodeResult.description}</Text>
          </View>
        )}
      </View>

      {/* 4. Son Güvenlik & Denetim Aktivitesi */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>📜 Son Güvenlik Aktiviteleri</Text>
          <TouchableOpacity onPress={loadDashboardData}>
            <Text style={styles.refreshLink}>Yenile</Text>
          </TouchableOpacity>
        </View>

        {recentLogs.length === 0 ? (
          <View style={styles.emptyLogs}>
            <Text style={styles.emptyIcon}>🛡️</Text>
            <Text style={styles.emptyTitle}>Sistem Güvende</Text>
            <Text style={styles.emptyDesc}>
              Kalkanınız tüm gelen mesajları arka planda otomatik denetliyor.
              Şüpheli bir mesaj test ettiğinizde veya kural değiştirdiğinizde kayıtlar burada görünür.
            </Text>
          </View>
        ) : (
          recentLogs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logTop}>
                <Text
                  style={[
                    styles.logActionBadge,
                    log.action.includes('ENGEL') ? styles.logBlocked : styles.logUpdated,
                  ]}
                >
                  {log.action}
                </Text>
                <Text style={styles.logDate}>
                  {new Date(log.timestamp).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={styles.logDetails}>{log.senderOrNumber}: {log.reason}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  shieldCard: {
    backgroundColor: '#0c1021',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  shieldHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  shieldIcon: {
    fontSize: 42,
    marginRight: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ecc71',
    marginRight: 6,
  },
  statusPillText: {
    color: '#2ecc71',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  shieldTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  shieldSubtitle: {
    fontSize: 13,
    color: '#b0b8c9',
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8edf3',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a365d',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3748',
  },
  statSub: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8edf3',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#718096',
    lineHeight: 16,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2d3748',
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#2b6cb0',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  resultBox: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultCode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2b6cb0',
  },
  threatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  threatBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  resultOperator: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 4,
  },
  resultDesc: {
    fontSize: 12,
    color: '#4a5568',
    lineHeight: 16,
  },
  refreshLink: {
    fontSize: 13,
    color: '#2b6cb0',
    fontWeight: '600',
  },
  emptyLogs: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 20,
  },
  logItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
    paddingVertical: 10,
  },
  logTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logActionBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logBlocked: {
    backgroundColor: '#fed7d7',
    color: '#c53030',
  },
  logUpdated: {
    backgroundColor: '#bee3f8',
    color: '#2b6cb0',
  },
  logDate: {
    fontSize: 11,
    color: '#a0aec0',
  },
  logDetails: {
    fontSize: 12,
    color: '#4a5568',
  },
});
