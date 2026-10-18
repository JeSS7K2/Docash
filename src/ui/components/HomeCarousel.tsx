import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { usePalette } from '../../theme';

export interface CarouselSlide {
  key: string;
  node: React.ReactNode;
}

interface HomeCarouselProps {
  slides: CarouselSlide[];
  width: number;
  height: number;
  intervalMs?: number;
}

/** Carrusel de slides del Home: swipe + auto-avance + indicadores. */
export default function HomeCarousel({ slides, width, height, intervalMs = 10000 }: HomeCarouselProps) {
  const palette = usePalette();
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }
    const id = setInterval(() => {
      const next = (indexRef.current + 1) % slides.length;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      indexRef.current = next;
      setIndex(next);
    }, intervalMs);
    return () => clearInterval(id);
  }, [slides.length, width, intervalMs]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(slides.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
    if (i !== indexRef.current) {
      indexRef.current = i;
      setIndex(i);
    }
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}>
        {slides.map(slide => (
          <View key={slide.key} style={{ width, height }}>
            {slide.node}
          </View>
        ))}
      </ScrollView>
      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <View
              key={slide.key}
              style={[
                styles.dot,
                { backgroundColor: i === index ? palette.primary : palette.track },
                i === index && styles.dotActive,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 14 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 18 },
});
