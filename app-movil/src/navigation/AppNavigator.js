
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import CatalogScreen from '../screens/CatalogScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MapScreen from '../screens/MapScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#202020' },
        headerTintColor: '#FFFFFF',
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: '#777777',
        tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 5 },
      }}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Catálogo" component={CatalogScreen} />
      <Tab.Screen name="Carrito" component={CartScreen} />
      <Tab.Screen name="Pedidos" component={OrdersScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Tienda"
          component={Tabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Mapa"
          component={MapScreen}
          options={{ title: 'Mapa y ubicación' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
