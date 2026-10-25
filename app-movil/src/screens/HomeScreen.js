
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { api, comprobarBackend } from '../api/client';

const money = (value) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

export default function HomeScreen({ navigation }) {
  const [apiStatus, setApiStatus] = useState('Comprobando conexión...');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    comprobarBackend()
      .then((data) => {
        setApiStatus(`Backend conectado: ${data.status}`);
      })
      .catch((error) => {
        console.log('Error comprobando backend:', error.message);
        setApiStatus('No fue posible conectar con el backend.');
      });

    api.get('/api/products')
      .then((response) => {
        setProducts(
          Array.isArray(response.data) ? response.data.slice(0, 4) : []
        );
      })
      .catch((error) => {
        console.log('Error cargando productos del inicio:', error.message);
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brandRow}>
        <View>
          <Text style={styles.brand}>ZAPO</Text>
          <Text style={styles.subtitle}>Tu estilo, tu forma.</Text>
        </View>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>Z</Text>
        </View>
      </View>

      <Text style={styles.apiStatus}>{apiStatus}</Text>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>NUEVA TEMPORADA · ZAPO</Text>
        <Text style={styles.heroTitle}>Viste como te sientes.</Text>
        <Text style={styles.heroText}>
          Descubre prendas para cada ocasión y encuentra tu próximo favorito.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('Catálogo')}
        >
          <Text style={styles.buttonText}>Explorar catálogo</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Prendas destacadas</Text>
        <Pressable onPress={() => navigation.navigate('Catálogo')}>
          <Text style={styles.link}>Ver todas</Text>
        </Pressable>
      </View>

      {loadingProducts ? (
        <ActivityIndicator
          size="large"
          color="#202020"
          style={styles.loader}
        />
      ) : products.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productRow}
        >
          {products.map((product) => (
            <View key={String(product.id)} style={styles.productCard}>
              {product.image_url ? (
                <Image
                  source={{ uri: product.image_url }}
                  style={styles.productImage}
                  resizeMode="cover"
                  onError={() =>
                    console.log(
                      'No se pudo cargar la imagen:',
                      product.image_url
                    )
                  }
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.placeholderLogo}>ZAPO</Text>
                </View>
              )}

              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={styles.productPrice}>
                {money(product.price)}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.description}>
          No hay productos disponibles. Comprueba la conexión con la API.
        </Text>
      )}

      <Text style={styles.sectionTitle}>Compra con confianza</Text>
      <Text style={styles.description}>
        Consulta tus pedidos y mantente informado sobre el estado de tus
        entregas desde la aplicación.
      </Text>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('Mapa')}
      >
        <Text style={styles.secondaryText}>Ver mapa y ubicación</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#202020',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  brandMark: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: '#202020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    fontSize: 29,
    fontWeight: '900',
    color: '#202020',
  },
  apiStatus: {
    marginTop: 12,
    color: '#555',
    fontSize: 12,
  },
  hero: {
    backgroundColor: '#202020',
    padding: 24,
    borderRadius: 18,
    marginTop: 24,
  },
  eyebrow: {
    color: '#D8CFC4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 12,
  },
  heroText: {
    color: '#DDD',
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 10,
    marginTop: 22,
    alignItems: 'center',
  },
  buttonText: {
    color: '#111',
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#202020',
    marginTop: 28,
  },
  link: {
    color: '#202020',
    fontWeight: '700',
  },
  loader: {
    marginVertical: 24,
  },
  productRow: {
    paddingBottom: 4,
  },
  productCard: {
    width: 170,
    marginRight: 14,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    paddingBottom: 12,
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#E7E2DB',
  },
  imagePlaceholder: {
    height: 160,
    backgroundColor: '#E7E2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLogo: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#202020',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 10,
    marginTop: 10,
    color: '#202020',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: 10,
    marginTop: 5,
    color: '#202020',
  },
  description: {
    fontSize: 15,
    color: '#555',
    marginTop: 10,
    lineHeight: 23,
  },
  secondaryButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  secondaryText: {
    fontWeight: '600',
    color: '#202020',
  },
});
