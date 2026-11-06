import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BCodeDirectory } from '../services/BCodeDirectory';

export type VaultFolder = 'BANK' | 'CARGO' | 'BETTING' | 'PROMO' | 'PHISHING';

export interface VaultMessage {
  id: string;
  sender: string;
  body: string;
  folder: VaultFolder;
  timestamp: string;
  bCode?: string;
}

const VAULT_STORAGE_KEY = '@spam_filter_vault_messages_v1';

// Varsayılan zengin örnek havuzu
const INITIAL_MESSAGES: VaultMessage[] = [
  {
    id: '1',
    sender: 'GARANTI',
    body: '849201 nolu tek kullanimlik onay kodu ile 2.500 TL transfer isleminizi onaylayabilirsiniz. Guvenliginiz icin sifrenizi kimseyle paylasmayiniz. B001',
    folder: 'BANK',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    bCode: 'B001',
  },
  {
    id: '2',
    sender: 'YURTICI-KRGO',
    body: '48291039 nolu kargonuz kurye dagitima cikmistir. Teslimat kodunuz: 7421. B002',
    folder: 'CARGO',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    bCode: 'B002',
  },
  {
    id: '3',
    sender: 'B214',
    body: 'Tebrikler! Hesabiniza 250 TL nakit bakiye ve 100 freespin tanimlandi. Hemen giris yap: https://bit.ly/matador77 B214',
    folder: 'BETTING',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    bCode: 'B214',
  },
  {
    id: '4',
    sender: 'BOYNER',
    body: 'Yeni sezon urunlerinde secili parcalarda %40 indirim firsati basladi! Detaylar magazada ve webde. B003',
    folder: 'PROMO',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    bCode: 'B003',
  },
  {
    id: '5',
    sender: 'SMS-BILGI',
    body: 'Paketiniz adres yetersizligi nedeniyle teslim edilemedi. Adresinizi dogrulamak icin tiklayin: https://t.ly/ptt-kargo B250',
    folder: 'PHISHING',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    bCode: 'B250',
  },
];

export const CategorizedVaultScreen: React.FC = () => {
  const [selectedFolder, setSelectedFolder] = useState<VaultFolder>('BETTING');
  const [messages, setMessages] = useState<VaultMessage[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const data = await AsyncStorage.getItem(VAULT_STORAGE_KEY);
      if (data) {
        setMessages(JSON.parse(data));
      } else {
        setMessages(INITIAL_MESSAGES);
        await AsyncStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(INITIAL_MESSAGES));
      }
    } catch (e) {
      setMessages(INITIAL_MESSAGES);
    }
  };

  const saveMessages = async (newMsgs: VaultMessage[]) => {
    setMessages(newMsgs);
    await AsyncStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(newMsgs));
  };

  const folders: { key: VaultFolder; label: string; icon: string; badgeColor: string }[] = [
    { key: 'BETTING', label: '🎰 Bahis / Bet', icon: '🎰', badgeColor: '#DC2626' },
    { key: 'PHISHING', label: '🎣 Oltalama / Link', icon: '🎣', badgeColor: '#EA580C' },
    { key: 'BANK', label: '🏦 Banka & Finans', icon: '🏦', badgeColor: '#16A34A' },
    { key: 'CARGO', label: '📦 Kargo & Sipariş', icon: '📦', badgeColor: '#2563EB' },
    { key: 'PROMO', label: '📢 Kampanya', icon: '📢', badgeColor: '#7C3AED' },
  ];

  const currentFolderMessages = messages.filter((m) => m.folder === selectedFolder);

  // Toplu Silme (Seçilenleri Sil)
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;

    Alert.alert(
      'Toplu Silme Onayı',
      `Seçtiğiniz ${selectedIds.length} mesajı silmek istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const remaining = messages.filter((m) => !selectedIds.includes(m.id));
            await saveMessages(remaining);
            setSelectedIds([]);
          },
        },
      ]
    );
  };

  // Bu Klasördeki Tüm Mesajları Temizle
  const handleClearCurrentFolder = () => {
    if (currentFolderMessages.length === 0) return;

    Alert.alert(
      'Klasörü Temizle',
      `Bu klasördeki ${currentFolderMessages.length} mesajın tamamı silinecektir. Emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Tümünü Temizle',
          style: 'destructive',
          onPress: async () => {
            const remaining = messages.filter((m) => m.folder !== selectedFolder);
            await saveMessages(remaining);
            setSelectedIds([]);
          },
        },
      ]
    );
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Üst Klasör Seçici Yatay Çubuk */}
      <View style={styles.folderBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={folders}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            const count = messages.filter((m) => m.folder === item.key).length;
            const isSelected = selectedFolder === item.key;
            return (
              <TouchableOpacity
                style={[styles.folderChip, isSelected && { backgroundColor: item.badgeColor }]}
                onPress={() => {
                  setSelectedFolder(item.key);
                  setSelectedIds([]);
                }}
              >
                <Text style={[styles.folderChipText, isSelected && styles.activeFolderChipText]}>
                  {item.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Toplu İşlemler Kontrol Çubuğu */}
      <View style={styles.actionToolbar}>
        <Text style={styles.folderHeaderTitle}>
          {folders.find((f) => f.key === selectedFolder)?.label} Klasörü
        </Text>

        <View style={styles.actionBtnRow}>
          {selectedIds.length > 0 && (
            <TouchableOpacity style={styles.deleteSelectedBtn} onPress={handleDeleteSelected}>
              <Text style={styles.deleteSelectedText}>Seçilenleri Sil ({selectedIds.length})</Text>
            </TouchableOpacity>
          )}

          {currentFolderMessages.length > 0 && (
            <TouchableOpacity style={styles.clearAllBtn} onPress={handleClearCurrentFolder}>
              <Text style={styles.clearAllText}>Tümünü Temizle</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mesaj Listesi */}
      <FlatList
        data={currentFolderMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item.id);
          const bCodeInfo = item.bCode ? BCodeDirectory.lookup(item.bCode) : null;

          return (
            <TouchableOpacity
              style={[styles.messageCard, isSelected && styles.messageCardSelected]}
              onPress={() => toggleSelect(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.senderContainer}>
                  <Text style={styles.checkboxIcon}>{isSelected ? '☑️' : '◻️'}</Text>
                  <Text style={styles.senderText}>{item.sender}</Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <Text style={styles.bodyText}>{item.body}</Text>

              {/* B-Kodu Taşıyıcı Bilgisi */}
              {bCodeInfo && (
                <View style={styles.bCodeBadge}>
                  <Text style={styles.bCodeBadgeText}>
                    🏢 Taşıyıcı: {bCodeInfo.code} - {bCodeInfo.operatorName}
                  </Text>
                  <Text style={styles.bCodeDescText}>• {bCodeInfo.description}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>Bu Klasör Boş</Text>
            <Text style={styles.emptySubtitle}>
              Bu kategoride filtrelenmiş herhangi bir mesaj bulunmuyor.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  folderBar: { backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  folderChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  folderChipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  activeFolderChipText: { color: '#FFF' },
  actionToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  folderHeaderTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  actionBtnRow: { flexDirection: 'row', gap: 8 },
  deleteSelectedBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  deleteSelectedText: { color: '#DC2626', fontSize: 11, fontWeight: 'bold' },
  clearAllBtn: { backgroundColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  clearAllText: { color: '#4B5563', fontSize: 11, fontWeight: '600' },
  listContent: { padding: 14, paddingBottom: 30 },
  messageCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageCardSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  senderContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkboxIcon: { fontSize: 16 },
  senderText: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  dateText: { fontSize: 11, color: '#94A3B8' },
  bodyText: { fontSize: 13, color: '#334155', lineHeight: 18 },
  bCodeBadge: { marginTop: 10, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#F1F5F9' },
  bCodeBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#0369A1' },
  bCodeDescText: { fontSize: 10, color: '#64748B', marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#475569', marginBottom: 4 },
  emptySubtitle: { fontSize: 12, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 40 },
});
