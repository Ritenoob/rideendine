/**
 * Root Navigator - Main navigation structure
 */
import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store';
import { RootStackParamList } from './types';

// Auth Screens
import WelcomeScreen from '@/screens/auth/WelcomeScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';

// Main Tab Navigator
import MainTabNavigator from './MainTabNavigator';

// Detail Screens
import ChefDetailScreen from '@/screens/chef/ChefDetailScreen';
import MenuItemScreen from '@/screens/chef/MenuItemScreen';
import CartScreen from '@/screens/order/CartScreen';
import CheckoutScreen from '@/screens/order/CheckoutScreen';
import OrderConfirmationScreen from '@/screens/order/OrderConfirmationScreen';
import OrderTrackingScreen from '@/screens/order/OrderTrackingScreen';
import OrderDetailScreen from '@/screens/order/OrderDetailScreen';
import ReviewScreen from '@/screens/order/ReviewScreen';

// Profile Screens
import EditProfileScreen from '@/screens/profile/EditProfileScreen';
import SettingsScreen from '@/screens/profile/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isLoading, loadStoredAuth } = useAuthStore();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  if (isLoading) {
    return null; // Or a splash screen
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f7f4ee' },
      }}
    >
      {!isAuthenticated ? (
        // Auth screens
        <Stack.Group>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      ) : (
        // Main app screens
        <Stack.Group>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen
            name="ChefDetail"
            component={ChefDetailScreen}
            options={{ headerShown: true, headerTitle: '' }}
          />
          <Stack.Screen
            name="MenuItem"
            component={MenuItemScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: '',
            }}
          />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{
              headerShown: true,
              headerTitle: 'Your Cart',
            }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{
              headerShown: true,
              headerTitle: 'Checkout',
            }}
          />
          <Stack.Screen
            name="OrderConfirmation"
            component={OrderConfirmationScreen}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="OrderTracking"
            component={OrderTrackingScreen}
            options={{
              headerShown: true,
              headerTitle: 'Track Order',
            }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{
              headerShown: true,
              headerTitle: 'Order Details',
            }}
          />
          <Stack.Screen
            name="Review"
            component={ReviewScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Leave a Review',
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              headerShown: true,
              headerTitle: 'Edit Profile',
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: true,
              headerTitle: 'Settings',
            }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
