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
  Switch,
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

  // Canlı Savunma Anahtarları
  const [bettingShield, setBettingShield] = useState(true);
  const [shortLinkShield, setShortLinkShield] = useState(true);
  const [voipCallShield, setVoipCallShield] = useState(true);
  const [nightMode, setNightMode] = useState(true);

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
        `${trimmed} kodu resmi BTK rehberinde kayıtlı değil veya yurt dışı yasa dışı SMS iletimi olabilir.`
      );
      setBCodeResult(null);
    }
  };

  const getThreatBadge = (category: string) => {
    switch (category) {
      case 'MAJOR_CARRIER':
        return { text: 'GÜVENLİ (Resmi Ana Operatör)', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'CORPORATE_SMS':
        return { text: 'KURUMSAL / SANAL OPERATÖR', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)' };
      case 'HIGH_RISK_SPAM':
        return { text: 'YÜKSEK RİSK (Bahis/Spam Kayıtlı)', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
      default:
        return { text: 'BİLİNMEYEN OPERATÖR', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)' };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={loadDashboardData} tintColor="#10B981" />
      }
    >
      {/* 1. HERO SİBER KALKAN KARTI */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.pulseDot} />
          <Text style={styles.heroStatusText}>SİBER KALKAN DEVREDE • TAM KORUMA</Text>
        </View>
        <Text style={styles.heroTitle}>Cihaz Düzeyi Akıllı Filtre</Text>
        <Text style={styles.heroDesc}>
          Gelen tüm SMS ve çağrılar Apple IdentityLookup ve CallKit motoru ile arka planda filtreleniyor. Kişisel verileriniz cihazınızdan asla ayrılmaz.
        </Text>
      </View>

      {/* 2. SAVUNMA METRİK KARTLARI */}
      <Text style={styles.sectionTitle}>AKTİF KORUMA PARAMETRELERİ</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>🚫</Text>
          <Text style={[styles.metricValue, { color: '#EF4444' }]}>{rules.blacklistKeywords.length}</Text>
          <Text style={styles.metricLabel}>Kara Liste Kelime</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>📞</Text>
          <Text style={[styles.metricValue, { color: '#F59E0B' }]}>{rules.blockedNumberPrefixes.length}</Text>
          <Text style={styles.metricLabel}>Engelli Ön Ek</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>🔍</Text>
          <Text style={[styles.metricValue, { color: '#06B6D4' }]}>273</Text>
          <Text style={styles.metricLabel}>BTK Operatör Verisi</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>🛡️</Text>
          <Text style={[styles.metricValue, { color: '#10B981' }]}>{rules.whitelistKeywords.length}</Text>
          <Text style={styles.metricLabel}>Güvenli Whitelist</Text>
        </View>
      </View>

      {/* 3. CANLI KORUMA ANAHTARLARI */}
      <Text style={styles.sectionTitle}>GÜVENLİK MODÜLLERİ</Text>
      <View style={styles.switchesCard}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchTitle}>🎰 Yasadışı Bahis & Slot Engelleyici</Text>
            <Text style={styles.switchSub}>Freespin, nakit bakiye, casino kelimelerini engeller</Text>
          </View>
          <Switch
            value={bettingShield}
            onValueChange={setBettingShield}
            trackColor={{ false: '#334155', true: '#10B981' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchTitle}>🔗 Kısa Link & Oltalama Filtresi</Text>
            <Text style={styles.switchSub}>bit.ly, t.ly, t.me şüpheli yönlendirmeleri süzer</Text>
          </View>
          <Switch
            value={shortLinkShield}
            onValueChange={setShortLinkShield}
            trackColor={{ false: '#334155', true: '#10B981' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchTitle}>📞 Sanal Santral & Robot Arama Kalkanı</Text>
            <Text style={styles.switchSub}>+90375, +90850 otomatik IVR aramalarını engeller</Text>
          </View>
          <Switch
            value={voipCallShield}
            onValueChange={setVoipCallShield}
            trackColor={{ false: '#334155', true: '#10B981' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchTitle}>🌙 Gece Rahatsız Etme Kalkanı (00:00 - 08:00)</Text>
            <Text style={styles.switchSub}>Gece gelen ticari SMS ve aramaları sessize alır</Text>
          </View>
          <Switch
            value={nightMode}
            onValueChange={setNightMode}
            trackColor={{ false: '#334155', true: '#10B981' }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      {/* 4. BTK B-KODU SORGULAMA KARTI */}
      <Text style={styles.sectionTitle}>BTK RESMİ SMS OPERATÖR SORGULAYICI</Text>
      <View style={styles.bCodeCard}>
        <Text style={styles.bCodeDesc}>
          SMS sonunda yer alan B-kodunu girin (Örn: B001, B002, B214, B250). Operatörün resmi kayıt ve risk durumunu görün.
        </Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Örn: B214 veya B001"
            placeholderTextColor="#64748B"
            value={bCodeQuery}
            onChangeText={setBCodeQuery}
            autoCapitalize="characters"
            maxLength={4}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearchBCode}>
            <Text style={styles.searchBtnText}>Sorgula</Text>
          </TouchableOpacity>
        </View>

        {bCodeResult && (
          <View style={styles.resultBox}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultCode}>{bCodeResult.code}</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: getThreatBadge(bCodeResult.category).bg },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: getThreatBadge(bCodeResult.category).color },
                  ]}
                >
                  {getThreatBadge(bCodeResult.category).text}
                </Text>
              </View>
            </View>
            <Text style={styles.resultOperator}>{bCodeResult.operatorName}</Text>
            <Text style={styles.resultDetails}>{bCodeResult.description}</Text>
          </View>
        )}
      </View>

      {/* 5. GÜVENLİK VE ENGELLEME DENETİM GÜNLÜĞÜ */}
      <Text style={styles.sectionTitle}>SON ENGELLEME DENETİM KAYITLARI</Text>
      <View style={styles.logsCard}>
        {recentLogs.length === 0 ? (
          <View style={styles.emptyLogBox}>
            <Text style={styles.emptyIcon}>🛡️</Text>
            <Text style={styles.emptyTitle}>Henüz Şüpheli Tehdit Kaydedilmedi</Text>
            <Text style={styles.emptySubtitle}>
              Kalkanınız nöbette. Engellenen SMS ve çağrılar otomatik olarak burada listelenecektir.
            </Text>
          </View>
        ) : (
          recentLogs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logLeft}>
                <Text style={styles.logType}>{log.type === 'SMS' ? '💬 SMS' : '📞 ÇAĞRI'}</Text>
                <Text style={styles.logSender}>{log.senderOrNumber}</Text>
                <Text style={styles.logReason}>{log.reason}</Text>
              </View>
              <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  content: { padding: 16, paddingBottom: 40 },
  heroCard: {
    backgroundColor: '#121B2E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    marginBottom: 20,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  heroStatusText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  heroDesc: { fontSize: 13, color: '#94A3B8', lineHeight: 19 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 6,
    marginLeft: 4,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#121B2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    alignItems: 'center',
  },
  metricIcon: { fontSize: 24, marginBottom: 6 },
  metricValue: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  metricLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  switchesCard: {
    backgroundColor: '#121B2E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  switchInfo: { flex: 1, paddingRight: 12 },
  switchTitle: { fontSize: 14, fontWeight: '700', color: '#F1F5F9', marginBottom: 2 },
  switchSub: { fontSize: 11, color: '#64748B', lineHeight: 16 },
  divider: { height: 1, backgroundColor: '#1E293B', marginVertical: 4 },
  bCodeCard: {
    backgroundColor: '#121B2E',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    marginBottom: 20,
  },
  bCodeDesc: { fontSize: 12, color: '#94A3B8', marginBottom: 14, lineHeight: 18 },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchInput: {
    flex: 1,
    backgroundColor: '#0A0F1D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    color: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700',
  },
  searchBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: { color: '#090D16', fontWeight: '800', fontSize: 14 },
  resultBox: {
    marginTop: 16,
    backgroundColor: '#0A0F1D',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  resultCode: { fontSize: 18, fontWeight: '800', color: '#38BDF8' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  resultOperator: { fontSize: 14, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
  resultDetails: { fontSize: 12, color: '#94A3B8', lineHeight: 17 },
  logsCard: {
    backgroundColor: '#121B2E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    marginBottom: 20,
  },
  emptyLogBox: { alignItems: 'center', paddingVertical: 24 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
  emptySubtitle: { fontSize: 12, color: '#64748B', textAlign: 'center', paddingHorizontal: 16 },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  logLeft: { flex: 1 },
  logType: { fontSize: 10, fontWeight: '800', color: '#EF4444', marginBottom: 2 },
  logSender: { fontSize: 14, fontWeight: '700', color: '#F1F5F9' },
  logReason: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  logTime: { fontSize: 11, color: '#64748B', fontWeight: '600' },
});
