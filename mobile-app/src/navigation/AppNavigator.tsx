import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabNavigator from './TabNavigator';
import QRScannerScreen from '../screens/QRScannerScreen';
import DiscountDetailsScreen from '../screens/DiscountDetailsScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import DealsListScreen from '../screens/DealsListScreen';

export type RootStackParamList = {
  MainTabs: undefined;
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
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#e94e1b',
          headerTitleStyle: {
            fontWeight: 'bold',
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
                   route.params.type === 'trending' ? 'Trending Deals' :
                   'Expiring Soon',
            headerBackTitle: 'Back',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
