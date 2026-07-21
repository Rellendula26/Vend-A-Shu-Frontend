import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import {
  BackHeader,
  DetailRow,
  GhostButton,
  OrangeButton,
  shoeEmoji,
  ShoeImage,
  useScreenInsets,
} from '@/components/vas';
import {
  useListShoes,
  useVendShoe,
  useVendDone,
  useRemoveShoe,
  getListShoesQueryKey,
  getListAvailableBinsQueryKey,
  getListBinsQueryKey,
} from '@workspace/api-client-react';
import type { Shoe, VendResult } from '@workspace/api-client-react';

const FILTERS = ['Season', 'Color', 'Brand', 'Material'] as const;
const LOCATION_LABELS: Record<string, string> = {
  LF: 'Left Front',
  R: 'Rear',
  RF: 'Right Front',
  FB: 'Full Bin',
};

export default function VendShoes() {
  const colors = useColors();
  const router = useRouter();
  const insets = useScreenInsets();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('');
  const [selected, setSelected] = useState<Shoe | null>(null);
  const [step, setStep] = useState(1);
  const [vendInfo, setVendInfo] = useState<VendResult | null>(null);

  const { data: shoes, isLoading } = useListShoes();
  const vendShoe = useVendShoe();
  const vendDone = useVendDone();
  const removeShoe = useRemoveShoe();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListShoesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListAvailableBinsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListBinsQueryKey() });
  };

  const stored = useMemo(
    () => (shoes ?? []).filter(s => s.status === 'stored'),
    [shoes],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return stored.filter(
      s =>
        s.shoeType.toLowerCase().includes(q) ||
        (s.color ?? '').toLowerCase().includes(q) ||
        (s.designer ?? '').toLowerCase().includes(q),
    );
  }, [stored, search]);

  const containerStyle = [
    styles.container,
    { backgroundColor: colors.background, paddingTop: insets.top },
  ];

  // Step 3 — bin ejected
  if (step === 3 && selected && vendInfo) {
    return (
      <View style={containerStyle}>
        <View style={styles.successContainer}>
          <View style={[styles.vendCard, { backgroundColor: colors.card }]}>
            <View style={[styles.ledDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.vendTitle, { color: colors.navy }]}>
              Bin ejected — the LED is on. Open the indicated bin, remove the
              selected item, then close the bin.
            </Text>
            <Text style={[styles.vendBin, { color: colors.primary }]}>
              {vendInfo.subsection} : {vendInfo.binCol} : {vendInfo.binRow} :{' '}
              {LOCATION_LABELS[vendInfo.binLocation] ?? vendInfo.binLocation}
            </Text>
          </View>
          <View style={{ width: '100%' }}>
            <OrangeButton
              title={vendDone.isPending ? 'Closing bin…' : 'Done'}
              disabled={vendDone.isPending}
              onPress={() =>
                vendDone.mutate(
                  { data: { shoeId: selected.id, permanent: false } },
                  {
                    onSuccess: () => {
                      invalidate();
                      router.replace('/home');
                    },
                    onError: err =>
                      Alert.alert('Error', String((err as Error).message ?? err)),
                  },
                )
              }
              testID="vend-done"
            />
          </View>
        </View>
      </View>
    );
  }

  // Step 2 — confirm
  if (step === 2 && selected) {
    return (
      <View style={containerStyle}>
        <BackHeader title="Vend Shoes" onBack={() => setStep(1)} />
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >
          <ShoeImage
            shoe={selected}
            imageStyle={styles.confirmPhoto}
            emojiStyle={styles.confirmEmoji}
          />
          <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
            <DetailRow label="Shoe Type" value={selected.shoeType} />
            <DetailRow label="Construction" value={selected.construction || '—'} />
            <DetailRow label="Season of Wear" value={selected.season || '—'} />
            <DetailRow label="Shoe Color" value={selected.color || '—'} />
            <DetailRow label="Designer" value={selected.designer || '—'} />
            <DetailRow
              label="Location"
              value={`${selected.subsection} : ${selected.binCol} : ${selected.binRow} : ${
                LOCATION_LABELS[selected.binLocation] ?? selected.binLocation
              }`}
            />
          </View>
          <OrangeButton
            title={vendShoe.isPending ? 'Ejecting bin…' : 'Vend Shoes'}
            disabled={vendShoe.isPending}
            onPress={() =>
              vendShoe.mutate(
                { data: { shoeId: selected.id } },
                {
                  onSuccess: data => {
                    setVendInfo(data);
                    invalidate();
                    setStep(3);
                  },
                  onError: err =>
                    Alert.alert('Error', String((err as Error).message ?? err)),
                },
              )
            }
            testID="vend-confirm"
          />
          <GhostButton
            title="Permanently Remove"
            onPress={() =>
              Alert.alert(
                'Permanently Remove',
                `Remove ${selected.shoeType} permanently? This frees the bin.`,
                [
                  { text: 'Cancel' },
                  {
                    text: 'Yes, Remove',
                    style: 'destructive',
                    onPress: () =>
                      removeShoe.mutate(
                        { id: selected.id },
                        {
                          onSuccess: () => {
                            invalidate();
                            router.replace('/home');
                          },
                          onError: err =>
                            Alert.alert('Error', String((err as Error).message ?? err)),
                        },
                      ),
                  },
                ],
              )
            }
            testID="permanently-remove"
          />
          <GhostButton title="Cancel" onPress={() => setStep(1)} />
        </ScrollView>
      </View>
    );
  }

  // Step 1 — browse
  return (
    <View style={containerStyle}>
      <BackHeader title="Vend Shoes" onBack={() => router.back()} />
      <View
        style={[
          styles.searchBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.navy }]}
          placeholder="Search type, color or designer"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          testID="vend-search"
        />
      </View>
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f ? colors.navy : colors.card,
                borderColor: filter === f ? colors.navy : colors.border,
              },
            ]}
            onPress={() => setFilter(filter === f ? '' : f)}
          >
            <Text
              style={{
                color: filter === f ? '#FFF' : colors.mutedForeground,
                fontSize: 13,
                fontFamily: 'Inter_500Medium',
              }}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          numColumns={3}
          scrollEnabled={filtered.length > 0}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 16 }]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="package" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No stored shoes match. Add shoes from the home screen.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.thumb, { backgroundColor: colors.card }]}
              onPress={() => {
                setSelected(item);
                setStep(2);
              }}
              testID={`shoe-${item.id}`}
            >
              <ShoeImage
                shoe={item}
                imageStyle={styles.thumbPhoto}
                emojiStyle={styles.thumbEmoji}
              />
              <Text style={[styles.thumbLabel, { color: colors.navy }]} numberOfLines={1}>
                {item.shoeType}
              </Text>
              <Text style={[styles.thumbSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                {item.designer || item.color || item.subsection}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  filterChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  grid: { padding: 12 },
  thumb: {
    flex: 1,
    margin: 4,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    aspectRatio: 0.9,
    justifyContent: 'center',
  },
  thumbEmoji: { fontSize: 34, marginBottom: 4 },
  thumbPhoto: { width: 64, height: 64, borderRadius: 8, marginBottom: 4 },
  confirmPhoto: {
    width: 160,
    height: 160,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 20,
  },
  thumbLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  thumbSub: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  empty: { alignItems: 'center', marginTop: 60, gap: 12, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', fontSize: 14, fontFamily: 'Inter_400Regular' },
  confirmEmoji: { fontSize: 80, textAlign: 'center', marginBottom: 20 },
  detailCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  vendCard: { borderRadius: 16, padding: 24, marginBottom: 24, alignItems: 'center', width: '100%' },
  ledDot: { width: 14, height: 14, borderRadius: 7, marginBottom: 12 },
  vendTitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
    fontFamily: 'Inter_500Medium',
  },
  vendBin: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});
