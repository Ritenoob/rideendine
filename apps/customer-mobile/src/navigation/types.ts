/**
 * Navigation Types
 */
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ChefDetail: { chefId: string };
  MenuItem: { item: MenuItemParam; chef: ChefParam };
  Cart: undefined;
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  OrderTracking: { orderId: string };
  OrderHistory: undefined;
  OrderDetail: { orderId: string };
  Review: { orderId: string };
  EditProfile: undefined;
  Addresses: undefined;
  PaymentMethods: undefined;
  Settings: undefined;
};

// Auth Stack Navigator
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type MenuItemParam = {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  preparationTime?: number;
  isAvailable?: boolean;
  allergens?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spiceLevel?: number;
};

export type ChefParam = {
  id: string;
  businessName: string;
  profileImageUrl?: string;
  address?: string;
  city?: string;
  deliveryRadius?: number;
  minimumOrder?: number;
  averagePrepTime?: number;
};

// Screen props types
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare module '@react-navigation/native' {
  export interface RootParamList extends RootStackParamList {}
}
