import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import NearbyScreen from '../screens/NearbyScreen';
import ClaimsScreen from '../screens/ClaimsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// Custom header component
interface TabHeaderProps {
  title: string;
  showSearch?: boolean;
  onSearchPress?: () => void;
}

function TabHeader({ title, showSearch, onSearchPress }: TabHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>PopupReach</Text>
        {showSearch && (
          <TouchableOpacity style={styles.searchButton} onPress={onSearchPress}>
            <Ionicons name="search-outline" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function TabNavigator() {
  const handleSearchPress = () => {
    // TODO: Navigate to search screen or open search modal
    console.log('Search pressed');
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#e94e1b',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: true,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={26}
              color={color}
            />
          ),
          header: () => <TabHeader title="PopupReach" showSearch onSearchPress={handleSearchPress} />,
        }}
      />
      <Tab.Screen
        name="NearbyTab"
        component={NearbyScreen}
        options={{
          tabBarLabel: 'Nearby',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'location' : 'location-outline'}
              size={26}
              color={color}
            />
          ),
          header: () => <TabHeader title="PopupReach" showSearch onSearchPress={handleSearchPress} />,
        }}
      />
      <Tab.Screen
        name="ClaimsTab"
        component={ClaimsScreen}
        options={{
          tabBarLabel: 'Claims',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={26}
              color={color}
            />
          ),
          header: () => <TabHeader title="PopupReach" showSearch onSearchPress={handleSearchPress} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={26}
              color={color}
            />
          ),
          header: () => <TabHeader title="PopupReach" />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e94e1b',
  },
  searchButton: {
    padding: 8,
    borderRadius: 8,
  },
  tabBar: {
    height: 85,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
  },
});
