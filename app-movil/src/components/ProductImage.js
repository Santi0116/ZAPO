
import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ProductImage({
  imageUrl,
  productName = 'Producto ZAPO',
  style,
}) {
  const [imageError, setImageError] = useState(false);

  const validUrl =
    typeof imageUrl === 'string' &&
    /^https?:\/\//i.test(imageUrl.trim());

  if (!validUrl || imageError) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.logo}>ZAPO</Text>
        <Text style={styles.label}>{productName}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl.trim() }}
      style={[styles.image, style]}
      resizeMode="cover"
      onError={(event) => {
        console.log(
          'Error al cargar imagen:',
          imageUrl,
          event.nativeEvent?.error
        );
        setImageError(true);
      }}
      accessibilityLabel={productName}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#f1f1f1',
  },
  placeholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: 3,
  },
  label: {
    marginTop: 8,
    color: '#666666',
    fontSize: 12,
  },
});
