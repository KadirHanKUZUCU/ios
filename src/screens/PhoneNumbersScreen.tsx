import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { FilterRules } from '../types';

interface Props {
  rules: FilterRules;
  onUpdateRules: (newRules: FilterRules) => void;
}

export const PhoneNumbersScreen: React.FC<Props> = ({ rules, onUpdateRules }) => {
  const [activeTab, setActiveTab] = useState<'prefixes' | 'custom'>('prefixes');
  const [inputText, setInputText] = useState('');

  const sanitizeNumber = (input: string): string => {
    let cleaned = input.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '9' + cleaned;
    }
    return cleaned;
  };

  const handleAdd = () => {
    const sanitized = sanitizeNumber(inputText);
    if (!sanitized) return;

    if (activeTab === 'prefixes') {
      if (rules.blockedNumberPrefixes.includes(sanitized)) {
        Alert.alert('Uyarı', 'Bu ön ek zaten listede mevcut.');
        return;
      }
      const updated = {
        ...rules,
        blockedNumberPrefixes: [sanitized, ...rules.blockedNumberPrefixes],
      };
      onUpdateRules(updated);
    } else {
      if (rules.customBlockedNumbers.includes(sanitized)) {
        Alert.alert('Uyarı', 'Bu numara zaten listede mevcut.');
        return;
      }
      const updated = {
        ...rules,
        customBlockedNumbers: [sanitized, ...rules.customBlockedNumbers],
      };
      onUpdateRules(updated);
    }

    setInputText('');
  };

  const handleDelete = (item: string) => {
    if (activeTab === 'prefixes') {
      const updated = {
        ...rules,
        blockedNumberPrefixes: rules.blockedNumberPrefixes.filter(p => p !== item),
      };
      onUpdateRules(updated);
    } else {
      const updated = {
        ...rules,
        customBlockedNumbers: rules.customBlockedNumbers.filter(n => n !== item),
      };
      onUpdateRules(updated);
    }
  };

  const currentList = activeTab === 'prefixes' ? rules.blockedNumberPrefixes : rules.customBlockedNumbers;

  return (
    <View style={styles.container}>
      {/* Sekmeler */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'prefixes' && styles.activeTab]}
          onPress={() => setActiveTab('prefixes')}
        >
          <Text style={[styles.tabText, activeTab === 'prefixes' && styles.activeTabText]}>
            Ön Ek Blokları ({rules.blockedNumberPrefixes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'custom' && styles.activeTab]}
          onPress={() => setActiveTab('custom')}
        >
          <Text style={[styles.tabText, activeTab === 'custom' && styles.activeTabText]}>
            Özel Numaralar ({rules.customBlockedNumbers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Giriş Alanı */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {activeTab === 'prefixes' ? 'Yeni Numara Ön Eki Ekle' : 'Engellenecek Numara Ekle'}
        </Text>
        <Text style={styles.cardSubtitle}>
          {activeTab === 'prefixes'
            ? 'Örn: 90375 veya 90729 gibi sanal santral aralıkları'
            : 'Örn: 05321234567 veya +905321234567'}
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={activeTab === 'prefixes' ? 'Örn: 90375, 90729' : 'Örn: 0532...'}
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={[styles.addButton, !inputText.trim() && styles.disabledBtn]}
            onPress={handleAdd}
            disabled={!inputText.trim()}
          >
            <Text style={styles.addButtonText}>Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bilgi Notu */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>
          ℹ️ CallKit (iOS) ve CallScreening (Android) bu numaraları sistem düzeyinde doğrudan meşgule atar veya uyarır.
        </Text>
      </View>

      {/* Liste */}
      <FlatList
        data={currentList}
        keyExtractor={(item, index) => item + index}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemIcon}>📞</Text>
            <Text style={styles.itemNumber}>
              +{item} {activeTab === 'prefixes' ? ' (Tüm Blok)' : ''}
            </Text>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>Sil</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', padding: 16 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 10, padding: 4, marginBottom: 12 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#EA580C' },
  tabText: { fontWeight: '600', color: '#666', fontSize: 13 },
  activeTabText: { color: '#FFF' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: '#666', marginBottom: 10 },
  inputRow: { flexDirection: 'row' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000',
  },
  addButton: {
    marginLeft: 8,
    backgroundColor: '#EA580C',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  disabledBtn: { opacity: 0.5 },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  infoBanner: { backgroundColor: '#EFF6FF', padding: 10, borderRadius: 8, marginBottom: 12 },
  infoBannerText: { color: '#1E40AF', fontSize: 12 },
  listContent: { paddingBottom: 20 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  itemIcon: { fontSize: 18, marginRight: 10 },
  itemNumber: { flex: 1, fontFamily: 'Courier', fontSize: 14, fontWeight: '600', color: '#1E293B' },
  deleteBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FEE2E2', borderRadius: 6 },
  deleteBtnText: { color: '#DC2626', fontWeight: '600', fontSize: 12 },
});

