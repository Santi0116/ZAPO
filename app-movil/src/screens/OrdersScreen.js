
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis pedidos</Text>
      <Text>Aquí podrás consultar tus compras y sus estados.</Text>
      <Text style={styles.note}>
        La información real aparecerá cuando conectemos los pedidos
        con el backend.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7F5F2' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 16 },
  note: { marginTop: 10, color: '#666', lineHeight: 22 },
});
