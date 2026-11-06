import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { QuietHoursSettings, QuietHoursService } from '../services/QuietHoursService';

interface Props {
  visible: boolean;
  settings: QuietHoursSettings;
  onClose: () => void;
  onSave: (newSettings: QuietHoursSettings) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export const QuietHoursModal: React.FC<Props> = ({
  visible,
  settings,
  onClose,
  onSave,
}) => {
  const [isEnabled, setIsEnabled] = useState(settings.isEnabled);
  const [startHour, setStartHour] = useState(settings.startTime.split(':')[0] || '22');
  const [startMinute, setStartMinute] = useState(settings.startTime.split(':')[1] || '00');
  const [endHour, setEndHour] = useState(settings.endTime.split(':')[0] || '08');
  const [endMinute, setEndMinute] = useState(settings.endTime.split(':')[1] || '00');
  const [blockCorporate, setBlockCorporate] = useState(settings.blockAllUnknownCorporate);

  const presets = [
    { label: '22:00 - 08:00 (Varsayılan)', sH: '22', sM: '00', eH: '08', eM: '00' },
    { label: '23:00 - 07:00 (Geç Gece)', sH: '23', sM: '00', eH: '07', eM: '00' },
    { label: '21:00 - 09:00 (Genişletilmiş)', sH: '21', sM: '00', eH: '09', eM: '00' },
    { label: '00:00 - 08:30 (Derin Uyku)', sH: '00', sM: '00', eH: '08', eM: '30' },
  ];

  const handleApplyPreset = (sH: string, sM: string, eH: string, eM: string) => {
    setStartHour(sH);
    setStartMinute(sM);
    setEndHour(eH);
    setEndMinute(eM);
  };

  const handleSave = () => {
    const updated: QuietHoursSettings = {
      isEnabled,
      startTime: `${startHour}:${startMinute}`,
      endTime: `${endHour}:${endMinute}`,
      blockAllUnknownCorporate: blockCorporate,
    };
    onSave(updated);
    onClose();
  };

  const currentSettingsPreview: QuietHoursSettings = {
    isEnabled,
    startTime: `${startHour}:${startMinute}`,
    endTime: `${endHour}:${endMinute}`,
    blockAllUnknownCorporate: blockCorporate,
  };
  const isCurrentlyActive = QuietHoursService.isCurrentlyQuietHours(currentSettingsPreview);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Başlık */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>🌙 Gece Sessizliği Saatleri</Text>
              <Text style={styles.subtitle}>
                Belirlediğiniz saat aralığında 0850 ve kurumsal santraller otomatik meşgule atılır.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Ana Aç/Kapa Anahtarı */}
            <View style={styles.switchCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Gece Koruma Modunu Etkinleştir</Text>
                <Text style={styles.switchDesc}>
                  Rehberinizde kayıtlı olmayan kurumsal santral çağrılarını engeller.
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={setIsEnabled}
                trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
              />
            </View>

            {/* Anlık Durum Rozeti */}
            <View style={[styles.statusBanner, isCurrentlyActive ? styles.activeBanner : styles.idleBanner]}>
              <Text style={styles.statusBannerText}>
                {isCurrentlyActive
                  ? '🟢 ŞU ANDA AKTİF: Kurumsal santral aramaları sessizce engelleniyor.'
                  : `⏳ BEKLEMEDE: Gece ${startHour}:${startMinute}'de devreye girecek.`}
              </Text>
            </View>

            {/* Hızlı Şablonlar */}
            <Text style={styles.sectionHeading}>Hızlı Saat Şablonları</Text>
            <View style={styles.presetGrid}>
              {presets.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset(p.sH, p.sM, p.eH, p.eM)}
                >
                  <Text style={styles.presetText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Manuel Saat Seçimi */}
            <Text style={styles.sectionHeading}>Manuel Saat Seçimi</Text>
            <View style={styles.timeSelectRow}>
              {/* Başlangıç Saati */}
              <View style={styles.timeBox}>
                <Text style={styles.timeBoxLabel}>Başlangıç Saati</Text>
                <View style={styles.selectorsRow}>
                  {/* Saat */}
                  <ScrollView style={styles.pickerColumn} nestedScrollEnabled>
                    {HOURS.map((h) => (
                      <TouchableOpacity
                        key={h}
                        style={[styles.pickerItem, startHour === h && styles.pickerItemSelected]}
                        onPress={() => setStartHour(h)}
                      >
                        <Text style={[styles.pickerText, startHour === h && styles.pickerTextSelected]}>
                          {h}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.colon}>:</Text>

                  {/* Dakika */}
                  <ScrollView style={styles.pickerColumn} nestedScrollEnabled>
                    {MINUTES.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.pickerItem, startMinute === m && styles.pickerItemSelected]}
                        onPress={() => setStartMinute(m)}
                      >
                        <Text style={[styles.pickerText, startMinute === m && styles.pickerTextSelected]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Bitiş Saati */}
              <View style={styles.timeBox}>
                <Text style={styles.timeBoxLabel}>Bitiş Saati (Sabah)</Text>
                <View style={styles.selectorsRow}>
                  {/* Saat */}
                  <ScrollView style={styles.pickerColumn} nestedScrollEnabled>
                    {HOURS.map((h) => (
                      <TouchableOpacity
                        key={h}
                        style={[styles.pickerItem, endHour === h && styles.pickerItemSelected]}
                        onPress={() => setEndHour(h)}
                      >
                        <Text style={[styles.pickerText, endHour === h && styles.pickerTextSelected]}>
                          {h}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.colon}>:</Text>

                  {/* Dakika */}
                  <ScrollView style={styles.pickerColumn} nestedScrollEnabled>
                    {MINUTES.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.pickerItem, endMinute === m && styles.pickerItemSelected]}
                        onPress={() => setEndMinute(m)}
                      >
                        <Text style={[styles.pickerText, endMinute === m && styles.pickerTextSelected]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* Koruma Kapsamı Onayı */}
            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>0850 ve Sanal Santralleri Kapsa</Text>
                <Text style={styles.optionDesc}>
                  0850, 0375, 0729 ve 0212/0216 otomatik arama robotlarını gece sessize al.
                </Text>
              </View>
              <Switch
                value={blockCorporate}
                onValueChange={setBlockCorporate}
                trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
              />
            </View>
          </ScrollView>

          {/* Kaydet Butonu */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>
              💾 Saatleri Kaydet ({startHour}:{startMinute} - {endHour}:{endMinute})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 2, maxWidth: 280 },
  closeBtn: {
    backgroundColor: '#F3F4F6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  switchDesc: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statusBanner: { padding: 10, borderRadius: 8, marginBottom: 14 },
  activeBanner: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC' },
  idleBanner: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' },
  statusBannerText: { fontSize: 12, fontWeight: '600', color: '#166534' },
  sectionHeading: { fontSize: 13, fontWeight: 'bold', color: '#374151', marginBottom: 8, marginTop: 4 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  presetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  timeSelectRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  timeBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  timeBoxLabel: { fontSize: 11, fontWeight: 'bold', color: '#4F46E5', marginBottom: 8 },
  selectorsRow: { flexDirection: 'row', alignItems: 'center' },
  pickerColumn: { height: 110, width: 44 },
  colon: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 4, color: '#64748B' },
  pickerItem: { paddingVertical: 6, alignItems: 'center', borderRadius: 4 },
  pickerItemSelected: { backgroundColor: '#4F46E5' },
  pickerText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  pickerTextSelected: { color: '#FFF', fontWeight: 'bold' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  optionTitle: { fontSize: 12, fontWeight: 'bold', color: '#1F2937' },
  optionDesc: { fontSize: 10, color: '#6B7280', marginTop: 1 },
  saveBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});
