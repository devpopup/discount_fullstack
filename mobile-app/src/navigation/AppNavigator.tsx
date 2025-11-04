import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import DiscountDetailsScreen from '../screens/DiscountDetailsScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import DealsListScreen from '../screens/DealsListScreen';

export type RootStackParamList = {
  Home: undefined;
  QRScanner: undefined;
  DiscountDetails: { offerId: string };
  SignIn: undefined;
  SignUp: undefined;
  DealsList: { type: 'nearby' | 'trending' | 'expiring' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
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
          options={{ title: 'Discount Details' }}
        />
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{ title: 'Sign In' }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ title: 'Sign Up' }}
        />
        <Stack.Screen
          name="DealsList"
          component={DealsListScreen}
          options={({ route }) => ({
            title: route.params.type === 'nearby' ? 'Deals Near You' :
                   route.params.type === 'trending' ? 'Trending Deals' :
                   'Expiring Soon'
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
