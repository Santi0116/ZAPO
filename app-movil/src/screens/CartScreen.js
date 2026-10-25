
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CartScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi carrito</Text>
      <Text>Tu carrito aparecerá aquí.</Text>
      <Text style={styles.note}>
        En el siguiente paso agregaremos productos, cantidades y total.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7F5F2' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 16 },
  note: { marginTop: 10, color: '#666', lineHeight: 22 },
});
