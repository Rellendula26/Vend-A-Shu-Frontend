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
  useReturnShoe,
  getListShoesQueryKey,
} from '@workspace/api-client-react';
import type { Shoe } from '@workspace/api-client-react';

export default function ReturnShoes() {
  const colors = useColors();
  const router = useRouter();
  const insets = useScreenInsets();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Shoe | null>(null);

  const { data: shoes, isLoading } = useListShoes();
  const returnShoe = useReturnShoe();

  const vended = useMemo(
    () => (shoes ?? []).filter(s => s.status === 'vended'),
    [shoes],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vended.filter(s => s.shoeType.toLowerCase().includes(q));
  }, [vended, search]);

  const containerStyle = [
    styles.container,
    { backgroundColor: colors.background, paddingTop: insets.top },
  ];

  if (selected) {
    return (
      <View style={containerStyle}>
        <BackHeader title="Return Shoes" onBack={() => setSelected(null)} />
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
            <DetailRow
              label="Return to"
              value={`${selected.subsection} : ${selected.binCol} : ${selected.binRow}`}
            />
            <DetailRow label="Season" value={selected.season || '—'} />
            <DetailRow label="Color" value={selected.color || '—'} />
          </View>
          <OrangeButton
            title={returnShoe.isPending ? 'Returning…' : 'Return to this Bin'}
            disabled={returnShoe.isPending}
            onPress={() =>
              returnShoe.mutate(
                { data: { shoeId: selected.id } },
                {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: getListShoesQueryKey() });
                    Alert.alert(
                      'Success!',
                      `${selected.shoeType} returned to ${selected.subsection} : ${selected.binCol} : ${selected.binRow}`,
                      [{ text: 'OK', onPress: () => router.replace('/home') }],
                    );
                  },
                  onError: err =>
                    Alert.alert('Error', String((err as Error).message ?? err)),
                },
              )
            }
            testID="return-confirm"
          />
          <GhostButton title="Cancel" onPress={() => setSelected(null)} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <BackHeader title="Return Shoes" onBack={() => router.back()} />
      <View
        style={[
          styles.searchBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.navy }]}
          placeholder="Search shoe type"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          testID="return-search"
        />
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
              <Feather name="rotate-ccw" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Nothing is out of its bin. Vend a shoe first, then return it
                here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.thumb, { backgroundColor: colors.card }]}
              onPress={() => setSelected(item)}
              testID={`return-shoe-${item.id}`}
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
                {item.subsection} : {item.binRow}
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
});
