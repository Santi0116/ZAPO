
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [message, setMessage] = useState('Buscando ubicación...');

  useEffect(() => {
    let active = true;

    async function loadLocation() {
      try {
        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          if (active) {
            setMessage('Debes permitir el acceso a la ubicación.');
          }
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (active) {
          setLocation({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          });
          setMessage('Tu ubicación actual');
        }
      } catch {
        if (active) {
          setMessage('No fue posible obtener la ubicación.');
        }
      }
    }

    loadLocation();

    return () => {
      active = false;
    };
  }, []);

  if (!location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>{message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={
          Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined
        }
        initialRegion={{
          ...location,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker
          coordinate={location}
          title="Estás aquí"
          description="Tu ubicación actual"
        />
      </MapView>
      <View style={styles.banner}>
        <Text>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    marginTop: 12,
    textAlign: 'center',
  },
  banner: {
    padding: 12,
    backgroundColor: 'white',
  },
});
