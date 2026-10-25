
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { api } from '../api/client';

const money = (value) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false);

  const imageUrl =
    typeof product.image_url === 'string' &&
    product.image_url.startsWith('http')
      ? product.image_url
      : null;

  return (
    <View style={styles.card}>
      {imageUrl && !imageError ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.productImage}
          resizeMode="cover"
          onError={(event) => {
            console.log(
              'No se pudo cargar la imagen de:',
              product.name,
              event.nativeEvent?.error
            );
            setImageError(true);
          }}
          accessibilityLabel={product.name}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageText}>ZAPO</Text>
          <Text style={styles.imageSubtext}>
            {imageUrl ? 'Imagen no disponible' : 'Sin fotografía'}
          </Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.category}>
          {product.category || 'Moda'}
        </Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{money(product.price)}</Text>

        {product.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function CatalogScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      setError('');
      setLoading(true);

      const response = await api.get('/api/products');

      if (!Array.isArray(response.data)) {
        throw new Error('La API no devolvió una lista de productos.');
      }

      setProducts(response.data);
      console.log('Productos recibidos:', response.data.length);
      console.log(
        'Imágenes recibidas:',
        response.data.map((p) => ({
          name: p.name,
          image_url: p.image_url,
        }))
      );
    } catch (e) {
      console.log('Error cargando productos:', e.message);
      setError(
        e.response?.data?.error ||
          'No fue posible cargar los productos. Verifica que el backend esté activo.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#202020" />
        <Text style={styles.statusText}>Cargando catálogo ZAPO...</Text>
      </View>
    );
  }

  if (error && products.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>No pudimos cargar el catálogo</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.button} onPress={loadProducts}>
          <Text style={styles.buttonText}>Intentar de nuevo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catálogo ZAPO</Text>
      <Text style={styles.subtitle}>
        Encuentra tu próximo favorito.
      </Text>

      {error ? <Text style={styles.warning}>{error}</Text> : null}

      <FlatList
        data={products}
        keyExtractor={(item, index) =>
          String(item.id ?? index)
        }
        renderItem={({ item }) => <ProductCard product={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadProducts}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Todavía no hay productos publicados.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  center: {
    flex: 1,
    backgroundColor: '#F7F5F2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#202020',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 5,
    marginBottom: 18,
  },
  list: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#E7E2DB',
  },
  imagePlaceholder: {
    height: 220,
    backgroundColor: '#E7E2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageText: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 5,
    color: '#202020',
  },
  imageSubtext: {
    color: '#666',
    marginTop: 8,
    fontSize: 12,
  },
  info: {
    padding: 14,
  },
  category: {
    color: '#777',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202020',
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 7,
    color: '#202020',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    lineHeight: 19,
  },
  statusText: {
    marginTop: 12,
    color: '#555',
  },
  errorTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#202020',
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  warning: {
    color: '#9B3B25',
    marginBottom: 10,
  },
  empty: {
    color: '#666',
    textAlign: 'center',
    marginTop: 30,
  },
});
