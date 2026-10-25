
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi perfil</Text>
      <Text>Inicia sesión para consultar tus datos personales.</Text>
      <Text style={styles.note}>
        La autenticación y los permisos por rol se configurarán
        antes de habilitar funciones privadas.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7F5F2' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 16 },
  note: { marginTop: 10, color: '#666', lineHeight: 22 },
});
