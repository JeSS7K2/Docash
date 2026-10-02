import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type Category from '../../db/models/Category';
import { useTranslation, type TranslationKey } from '../../i18n';
import { usePalette, useThemedStyles } from '../../theme';
import { CategoryIcon } from '../icons';
import { makeStyles } from './CategoryGrid.styles';

interface CategoryGridProps {
  categories: Category[];
  onSelect: (categoryId: string) => void;
}

export default function CategoryGrid({ categories, onSelect }: CategoryGridProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();
  return (
    <View style={styles.grid}>
      {categories.map(cat => {
        const key = `category.${cat.id}` as TranslationKey;
        const translated = t(key);
        const label = translated === key ? cat.name : translated;
        return (
          <Pressable
            key={cat.id}
            testID={`cat-${cat.id}`}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={styles.cell}
            onPress={() => onSelect(cat.id)}>
            <CategoryIcon id={cat.id} color={palette.ink} size={26} />
            <Text style={styles.name} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
