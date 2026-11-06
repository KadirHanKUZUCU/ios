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

export const KeywordsScreen: React.FC<Props> = ({ rules, onUpdateRules }) => {
  const [activeTab, setActiveTab] = useState<'blacklist' | 'whitelist'>('blacklist');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const currentList = activeTab === 'blacklist' ? rules.blacklistKeywords : rules.whitelistKeywords;

  const filteredList = currentList.filter(item =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    const trimmed = inputText.trim().toLowerCase();
    if (!trimmed) return;

    if (activeTab === 'blacklist') {
      if (rules.blacklistKeywords.includes(trimmed)) {
        Alert.alert('Uyarı', 'Bu kelime zaten kara listede mevcut.');
        return;
      }
      const updated = { ...rules, blacklistKeywords: [trimmed, ...rules.blacklistKeywords] };
      onUpdateRules(updated);
    } else {
      if (rules.whitelistKeywords.includes(trimmed)) {
        Alert.alert('Uyarı', 'Bu kelime zaten güvenli listede mevcut.');
        return;
      }
      const updated = { ...rules, whitelistKeywords: [trimmed, ...rules.whitelistKeywords] };
      onUpdateRules(updated);
    }

    setInputText('');
  };

  const handleDelete = (item: string) => {
    if (activeTab === 'blacklist') {
      const updated = {
        ...rules,
        blacklistKeywords: rules.blacklistKeywords.filter(k => k !== item),
      };
      onUpdateRules(updated);
    } else {
      const updated = {
        ...rules,
        whitelistKeywords: rules.whitelistKeywords.filter(k => k !== item),
      };
      onUpdateRules(updated);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sekmeler */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'blacklist' && styles.activeTabBlacklist]}
          onPress={() => setActiveTab('blacklist')}
        >
          <Text style={[styles.tabText, activeTab === 'blacklist' && styles.activeTabText]}>
            Kara Liste ({rules.blacklistKeywords.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'whitelist' && styles.activeTabWhitelist]}
          onPress={() => setActiveTab('whitelist')}
        >
          <Text style={[styles.tabText, activeTab === 'whitelist' && styles.activeTabText]}>
            Güvenli Liste ({rules.whitelistKeywords.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Yeni Ekleme Girişi */}
      <View style={styles.inputCard}>
        <TextInput
          style={styles.input}
          placeholder={
            activeTab === 'blacklist'
              ? 'Örn: freespin, matadorbet, casino...'
              : 'Örn: onay kodu, şifre, transfer...'
          }
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            activeTab === 'blacklist' ? styles.addBtnRed : styles.addBtnGreen,
            !inputText.trim() && styles.disabledBtn,
          ]}
          onPress={handleAdd}
          disabled={!inputText.trim()}
        >
          <Text style={styles.addButtonText}>Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Arama Alanı */}
      <View style={styles.searchCard}>
        <TextInput
          style={styles.searchInput}
          placeholder="Listede ara..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {/* Kelime Listesi */}
      <FlatList
        data={filteredList}
        keyExtractor={(item, index) => item + index}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={styles.itemBadge}>
              <Text style={styles.itemBadgeText}>
                {activeTab === 'blacklist' ? '🚫' : '🛡️'}
              </Text>
            </View>
            <Text style={styles.itemText}>{item}</Text>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>Sil</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Bu listede henüz kelime bulunmuyor.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', paddingHorizontal: 16, paddingTop: 16 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 10, padding: 4, marginBottom: 12 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTabBlacklist: { backgroundColor: '#DC2626' },
  activeTabWhitelist: { backgroundColor: '#16A34A' },
  tabText: { fontWeight: '600', color: '#666', fontSize: 13 },
  activeTabText: { color: '#FFF' },
  inputCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 8, marginBottom: 10 },
  input: { flex: 1, paddingHorizontal: 12, fontSize: 15, color: '#000' },
  addButton: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, justifyContent: 'center' },
  addBtnRed: { backgroundColor: '#DC2626' },
  addBtnGreen: { backgroundColor: '#16A34A' },
  disabledBtn: { opacity: 0.5 },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  searchCard: { backgroundColor: '#FFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  searchInput: { fontSize: 14, color: '#000' },
  listContent: { paddingBottom: 20 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  itemBadge: { marginRight: 10 },
  itemBadgeText: { fontSize: 18 },
  itemText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#111' },
  deleteBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FEE2E2', borderRadius: 6 },
  deleteBtnText: { color: '#DC2626', fontWeight: '600', fontSize: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#888', fontSize: 14 },
});

