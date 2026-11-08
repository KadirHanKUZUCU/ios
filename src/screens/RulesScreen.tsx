import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { FilterRules } from '../types';

interface Props {
  rules: FilterRules;
  onUpdateRules: (newRules: FilterRules) => void;
}

type RuleSegment = 'blacklist' | 'prefixes' | 'whitelist';

export const RulesScreen: React.FC<Props> = ({ rules, onUpdateRules }) => {
  const [segment, setSegment] = useState<RuleSegment>('blacklist');
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const quickSuggestions: Record<RuleSegment, string[]> = {
    blacklist: ['bonus', 'freespin', 'slot', 'casino', 'bahis', 'kripto', 't.me/', 'yatirim'],
    prefixes: ['90375', '90729', '90850', '90212', '90216'],
    whitelist: ['onay kodu', 'şifre', 'transfer', 'hesap ekstreniz', 'kargo teslim', 'dekont'],
  };

  const handleAddRule = (textToAdd?: string) => {
    const raw = textToAdd || inputText;
    const trimmed = raw.trim();
    if (!trimmed) return;

    const updated = { ...rules };

    if (segment === 'blacklist') {
      const lower = trimmed.toLowerCase();
      if (updated.blacklistKeywords.includes(lower)) {
        Alert.alert('Zaten Mevcut', 'Bu kelime zaten kara listede kayıtlı.');
        return;
      }
      updated.blacklistKeywords = [lower, ...updated.blacklistKeywords];
    } else if (segment === 'prefixes') {
      const cleanNum = trimmed.replace(/[^0-9]/g, '');
      if (!cleanNum) return;
      if (updated.blockedNumberPrefixes.includes(cleanNum)) {
        Alert.alert('Zaten Mevcut', 'Bu ön ek zaten engelli listesinde.');
        return;
      }
      updated.blockedNumberPrefixes = [cleanNum, ...updated.blockedNumberPrefixes];
    } else {
      const lower = trimmed.toLowerCase();
      if (updated.whitelistKeywords.includes(lower)) {
        Alert.alert('Zaten Mevcut', 'Bu kelime zaten whitelist listesinde.');
        return;
      }
      updated.whitelistKeywords = [lower, ...updated.whitelistKeywords];
    }

    onUpdateRules(updated);
    setInputText('');
  };

  const handleDeleteItem = (item: string) => {
    const updated = { ...rules };

    if (segment === 'blacklist') {
      updated.blacklistKeywords = updated.blacklistKeywords.filter((k) => k !== item);
    } else if (segment === 'prefixes') {
      updated.blockedNumberPrefixes = updated.blockedNumberPrefixes.filter((p) => p !== item);
    } else {
      updated.whitelistKeywords = updated.whitelistKeywords.filter((w) => w !== item);
    }

    onUpdateRules(updated);
  };

  const getActiveList = (): string[] => {
    let list: string[] = [];
    if (segment === 'blacklist') list = rules.blacklistKeywords;
    else if (segment === 'prefixes') list = rules.blockedNumberPrefixes;
    else list = rules.whitelistKeywords;

    if (!searchFilter.trim()) return list;
    const q = searchFilter.toLowerCase();
    return list.filter((i) => i.toLowerCase().includes(q));
  };

  const activeList = getActiveList();

  return (
    <View style={styles.container}>
      {/* SEGMENTED SWITCHER */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, segment === 'blacklist' && styles.segmentBtnActive]}
          onPress={() => { setSegment('blacklist'); setSearchFilter(''); }}
        >
          <Text style={[styles.segmentText, segment === 'blacklist' && styles.segmentTextActive]}>
            🚫 Kara Liste ({rules.blacklistKeywords.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, segment === 'prefixes' && styles.segmentBtnActive]}
          onPress={() => { setSegment('prefixes'); setSearchFilter(''); }}
        >
          <Text style={[styles.segmentText, segment === 'prefixes' && styles.segmentTextActive]}>
            📞 Ön Ekler ({rules.blockedNumberPrefixes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, segment === 'whitelist' && styles.segmentBtnActive]}
          onPress={() => { setSegment('whitelist'); setSearchFilter(''); }}
        >
          <Text style={[styles.segmentText, segment === 'whitelist' && styles.segmentTextActive]}>
            🛡️ Whitelist ({rules.whitelistKeywords.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* EKLEME ÇUBUĞU */}
        <View style={styles.addCard}>
          <Text style={styles.addLabel}>
            {segment === 'blacklist' && 'YENİ KARA LİSTE KELİMESİ EKLE'}
            {segment === 'prefixes' && 'ENGELLENECEK TELEFON ÖN EKİ EKLE'}
            {segment === 'whitelist' && 'GÜVENLİ BANKA / KURUM KELİMESİ EKLE'}
          </Text>
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder={
                segment === 'blacklist' ? 'Örn: freespin, matadorbet, vip bonus' :
                segment === 'prefixes' ? 'Örn: 90375 veya 90850' : 'Örn: hesap ekstreniz, onay kodu'
              }
              placeholderTextColor="#64748B"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleAddRule()}
            />
            <TouchableOpacity style={styles.addBtn} onPress={() => handleAddRule()}>
              <Text style={styles.addBtnText}>+ Ekle</Text>
            </TouchableOpacity>
          </View>

          {/* HIZLI ÖNERİ ETİKETLERİ */}
          <Text style={styles.quickLabel}>Hızlı Öneriler:</Text>
          <View style={styles.quickRow}>
            {quickSuggestions[segment].map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickChip}
                onPress={() => handleAddRule(item)}
              >
                <Text style={styles.quickChipText}>+ {item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ARAMA VE LİSTE */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>
            {segment === 'blacklist' && 'TANIMLI SPAM KELİMELERİ'}
            {segment === 'prefixes' && 'ENGELLİ TELEFON BLOKLARI'}
            {segment === 'whitelist' && 'DOKUNULMAZ GÜVENLİ KELİMELER'}
          </Text>
          <Text style={styles.listCount}>{activeList.length} Öğe</Text>
        </View>

        {/* LİSTE ELEMANLARI */}
        <View style={styles.listCard}>
          {activeList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>Bu kategoride henüz kural bulunmuyor.</Text>
            </View>
          ) : (
            activeList.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.itemBadge}>
                  <Text style={styles.itemIndex}>#{index + 1}</Text>
                  <Text style={styles.itemText}>{item}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteItem(item)}
                >
                  <Text style={styles.deleteBtnText}>✕ Sil</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#121B2E',
    margin: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#1E2D4A',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  segmentTextActive: {
    color: '#38BDF8',
  },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  addCard: {
    backgroundColor: '#121B2E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    marginBottom: 20,
  },
  addLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 0.8, marginBottom: 10 },
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  addInput: {
    flex: 1,
    backgroundColor: '#0A0F1D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    color: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#090D16', fontWeight: '800', fontSize: 14 },
  quickLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', marginBottom: 8 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  quickChip: {
    backgroundColor: '#1E2D4A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quickChipText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  listHeaderTitle: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 1 },
  listCount: { fontSize: 11, fontWeight: '700', color: '#10B981' },
  listCard: {
    backgroundColor: '#121B2E',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    overflow: 'hidden',
  },
  emptyState: { padding: 30, alignItems: 'center' },
  emptyIcon: { fontSize: 28, marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  itemBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  itemIndex: { fontSize: 11, color: '#64748B', fontWeight: '700', width: 28 },
  itemText: { fontSize: 14, color: '#F1F5F9', fontWeight: '600', flex: 1 },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteBtnText: { color: '#EF4444', fontSize: 11, fontWeight: '800' },
});
