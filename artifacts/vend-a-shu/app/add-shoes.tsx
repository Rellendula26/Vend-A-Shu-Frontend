import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import {
  BackHeader,
  Dropdown,
  GhostButton,
  OrangeButton,
  useScreenInsets,
} from '@/components/vas';
import {
  useAddShoe,
  useListAvailableBins,
  getListShoesQueryKey,
  getListAvailableBinsQueryKey,
  getListBinsQueryKey,
} from '@workspace/api-client-react';
import type { Bin } from '@workspace/api-client-react';

const SEASONS = ['Winter', 'Summer', 'Spring', 'Fall', 'All'] as const;
const SUBSECTIONS = ['SS-A', 'SS-B', 'SS-C', 'SS-D', 'SS-E', 'SS-F'] as const;
const ROWS = ['R1', 'R2', 'R3', 'R4'] as const;
const LOCATIONS = ['LF', 'R', 'RF', 'FB'] as const;
const LOCATION_LABELS: Record<string, string> = {
  LF: 'Left Front',
  R: 'Rear',
  RF: 'Right Front',
  FB: 'Full Bin',
};

export default function AddShoes() {
  const colors = useColors();
  const router = useRouter();
  const insets = useScreenInsets();
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [shoeType, setShoeType] = useState('');
  const [construction, setConstruction] = useState('');
  const [season, setSeason] = useState<(typeof SEASONS)[number] | ''>('');
  const [color, setColor] = useState('');
  const [designer, setDesigner] = useState('');
  const [subsection, setSubsection] = useState<(typeof SUBSECTIONS)[number] | ''>('');
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [placed, setPlaced] = useState<Bin | null>(null);

  const isBoots = /boot/i.test(shoeType);

  const { data: availableBins, isLoading: binsLoading } = useListAvailableBins({
    query: { enabled: step === 3, queryKey: getListAvailableBinsQueryKey() },
  });

  const addShoe = useAddShoe();

  const binsInSubsection = useMemo(() => {
    const list = (availableBins ?? []).filter(
      b => b.subsection === subsection,
    );
    return list;
  }, [availableBins, subsection]);

  const eligible = (b: Bin) =>
    isBoots ? b.binLocation === 'FB' : b.binLocation !== 'FB';

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const submit = () => {
    if (!currentUser || !selectedBin) return;
    addShoe.mutate(
      {
        data: {
          userId: currentUser.id,
          shoeType,
          construction,
          season: season || '',
          color,
          designer,
          subsection: selectedBin.subsection,
          binCol: selectedBin.binCol,
          binRow: selectedBin.binRow,
          binLocation: selectedBin.binLocation,
        },
      },
      {
        onSuccess: () => {
          setPlaced(selectedBin);
          queryClient.invalidateQueries({ queryKey: getListShoesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListAvailableBinsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListBinsQueryKey() });
          setStep(4);
        },
        onError: err => {
          Alert.alert('Could not add shoes', String((err as Error).message ?? err));
        },
      },
    );
  };

  const containerStyle = [
    styles.container,
    { backgroundColor: colors.background, paddingTop: insets.top },
  ];

  // Step 4 — success
  if (step === 4 && placed) {
    return (
      <View style={containerStyle}>
        <View style={styles.successContainer}>
          <View style={[styles.successCircle, { backgroundColor: colors.success }]}>
            <Feather name="check" size={40} color="#FFF" />
          </View>
          <Text style={[styles.successTitle, { color: colors.navy }]}>
            Shoes Added!
          </Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
            {placed.subsection} : {placed.binCol} : {placed.binRow} :{' '}
            {LOCATION_LABELS[placed.binLocation] ?? placed.binLocation}
          </Text>
          <View style={{ marginTop: 40, width: '100%' }}>
            <OrangeButton
              title="Go to Home"
              onPress={() => router.replace('/home')}
              testID="go-home"
            />
          </View>
        </View>
      </View>
    );
  }

  // Step 3 — pick bin
  if (step === 3) {
    return (
      <View style={containerStyle}>
        <BackHeader onBack={() => setStep(2)} />
        <KeyboardAwareScrollViewCompat
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >
          <Text style={[styles.cursiveTitle, { color: colors.navy }]}>
            Select location to place the shoes
          </Text>
          <Dropdown
            value={subsection}
            placeholder="Select VAS Subsection"
            options={SUBSECTIONS}
            onSelect={v => {
              setSubsection(v);
              setSelectedBin(null);
            }}
            testID="subsection-dropdown"
          />
          {subsection !== '' &&
            (binsLoading ? (
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>
                Loading bins…
              </Text>
            ) : (
              <View style={styles.binTable}>
                {ROWS.map(row => (
                  <View key={row} style={styles.binRow}>
                    <Text style={[styles.binRowLabel, { color: colors.mutedForeground }]}>
                      {row}
                    </Text>
                    {LOCATIONS.map(loc => {
                      const bin = binsInSubsection.find(
                        b => b.binRow === row && b.binLocation === loc,
                      );
                      const available = !!bin && eligible(bin);
                      const isSel = !!bin && selectedBin?.id === bin.id;
                      return (
                        <TouchableOpacity
                          key={loc}
                          disabled={!available}
                          onPress={() => bin && setSelectedBin(bin)}
                          style={[
                            styles.binCell,
                            {
                              backgroundColor: isSel
                                ? colors.primary
                                : available
                                  ? colors.navySoft
                                  : colors.border,
                            },
                          ]}
                          testID={`bin-${row}-${loc}`}
                        >
                          <Text style={styles.binCellText}>{loc}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            ))}
          <View style={[styles.helpBox, { backgroundColor: colors.peach }]}>
            <Text style={[styles.helpTitle, { color: colors.navy }]}>
              How to select the storage location?
            </Text>
            <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
              {isBoots
                ? 'Boots need a Full Bin (FB). Only full-bin slots are selectable.'
                : 'Pick an open slot: Left Front (LF), Rear (R), or Right Front (RF). Grey slots are occupied.'}
            </Text>
          </View>
          <OrangeButton
            title={addShoe.isPending ? 'Reserving…' : 'Use Selected Bin'}
            onPress={submit}
            disabled={!selectedBin || addShoe.isPending}
            testID="use-selected-bin"
          />
        </KeyboardAwareScrollViewCompat>
      </View>
    );
  }

  // Step 2 — details form
  if (step === 2) {
    return (
      <View style={containerStyle}>
        <BackHeader onBack={() => setStep(1)} />
        <KeyboardAwareScrollViewCompat
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.cursiveTitle, { color: colors.navy }]}>
            Add Shoes or Other Items
          </Text>
          <TouchableOpacity
            style={[styles.uploadBox, { borderColor: colors.border }]}
            onPress={pickImage}
            testID="upload-image"
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.uploadPreview} />
            ) : (
              <>
                <Feather name="upload" size={28} color={colors.primary} />
                <Text style={[styles.uploadText, { color: colors.primary }]}>
                  Tap to add a photo
                </Text>
                <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>
                  Optional — from your library
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.navy }]}
            placeholder="Shoe Type (e.g. Sneakers, Heels, Boots)"
            placeholderTextColor={colors.mutedForeground}
            value={shoeType}
            onChangeText={setShoeType}
            testID="input-shoe-type"
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.navy }]}
            placeholder="Construction of Shoes"
            placeholderTextColor={colors.mutedForeground}
            value={construction}
            onChangeText={setConstruction}
            testID="input-construction"
          />
          <Dropdown
            value={season}
            placeholder="Season of Wear"
            options={SEASONS}
            onSelect={setSeason}
            testID="season-dropdown"
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.navy }]}
              placeholder="Shoes Color"
              placeholderTextColor={colors.mutedForeground}
              value={color}
              onChangeText={setColor}
              testID="input-color"
            />
            <TextInput
              style={[styles.input, styles.rowInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.navy }]}
              placeholder="Shoes Designer"
              placeholderTextColor={colors.mutedForeground}
              value={designer}
              onChangeText={setDesigner}
              testID="input-designer"
            />
          </View>
          {isBoots && (
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 8, fontFamily: 'Inter_400Regular' }}>
              Boots take a full bin — you'll pick a Full Bin slot next.
            </Text>
          )}
          <OrangeButton
            title="Reserve Bin"
            onPress={() => {
              if (shoeType.trim()) setStep(3);
              else Alert.alert('Please enter shoe type');
            }}
            testID="reserve-bin"
          />
        </KeyboardAwareScrollViewCompat>
      </View>
    );
  }

  // Step 1 — photo studio
  return (
    <View style={containerStyle}>
      <BackHeader onBack={() => router.back()} />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      >
        <Text style={[styles.cursiveTitle, { color: colors.navy }]}>
          Photo Studio
        </Text>
        <View style={[styles.studioBox, { backgroundColor: colors.card }]}>
          <View style={[styles.studioIcon, { backgroundColor: colors.accent }]}>
            <Feather name="camera" size={44} color={colors.navy} />
          </View>
          <Text style={[styles.studioText, { color: colors.mutedForeground }]}>
            Open the top-center bin, set up the screen and selfie-stick, and
            place the item to be photographed on the platform, as shown.
          </Text>
        </View>
        <OrangeButton title="Continue" onPress={() => setStep(2)} testID="continue-to-form" />
        <GhostButton title="Cancel" onPress={() => router.back()} />
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  cursiveTitle: {
    fontSize: 26,
    fontStyle: 'italic',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 20,
  },
  studioBox: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  studioIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  studioText: { textAlign: 'center', lineHeight: 22, fontFamily: 'Inter_400Regular' },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  uploadPreview: { width: 140, height: 140, borderRadius: 8 },
  uploadText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  uploadSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  row: { flexDirection: 'row', gap: 8 },
  rowInput: { flex: 1 },
  binTable: { marginVertical: 12, gap: 8 },
  binRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  binRowLabel: { width: 26, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  binCell: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  binCellText: { color: '#FFF', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  helpBox: { borderRadius: 12, padding: 16, marginVertical: 16 },
  helpTitle: { fontFamily: 'Inter_700Bold', marginBottom: 4 },
  helpText: { fontSize: 13, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  successSub: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
