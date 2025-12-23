import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabNavigator from './TabNavigator';
import QRScannerScreen from '../screens/QRScannerScreen';
import DiscountDetailsScreen from '../screens/DiscountDetailsScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import DealsListScreen from '../screens/DealsListScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import RedemptionScreen from '../screens/RedemptionScreen';
import BusinessOffersScreen from '../screens/BusinessOffersScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  QRScanner: undefined;
  DiscountDetails: { offerId: string };
  BusinessOffers: { businessId: string };
  SignIn: undefined;
  SignUp: undefined;
  DealsList: { type: 'nearby' | 'trending' | 'expiring' | 'all' };
  NotificationSettings: undefined;
  Favorites: undefined;
  EditProfile: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  Redemption: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ['popupreach://', 'https://popupreach.com'] as string[],
  config: {
    screens: {
      MainTabs: 'tabs',
      DiscountDetails: 'offer/:offerId',
      BusinessOffers: 'business/:businessId',
      SignIn: 'signin',
      SignUp: 'signup',
    },
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: true,
          headerTintColor: '#e94e1b',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="QRScanner"
          component={QRScannerScreen}
          options={{
            title: 'Scan QR Code',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="DiscountDetails"
          component={DiscountDetailsScreen}
          options={{
            title: 'Discount Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="BusinessOffers"
          component={BusinessOffersScreen}
          options={{
            title: 'Business Offers',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{
            title: 'Sign In',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{
            title: 'Sign Up',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="DealsList"
          component={DealsListScreen}
          options={({ route }) => ({
            title: route.params.type === 'nearby' ? 'Deals Near You' :
                   route.params.type === 'all' ? 'All Deals' :
                   route.params.type === 'trending' ? 'Trending Deals' :
                   'Expiring Soon',
            headerBackTitle: 'Back',
          })}
        />
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
          options={{
            title: 'Notification Settings',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{
            title: 'Favorites',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{
            title: 'Edit Profile',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="TermsOfService"
          component={TermsOfServiceScreen}
          options={{
            title: 'Terms of Service',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{
            title: 'Privacy Policy',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Redemption"
          component={RedemptionScreen}
          options={{
            title: 'Redeem Offer',
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
