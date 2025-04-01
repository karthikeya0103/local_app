import 'react-native-gesture-handler'; // This must be the first import
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Image } from 'react-native';
import JobsScreen from './.expo/screens/JobsScreen';
import BookmarksScreen from './.expo/screens/BookmarksScreen';
import JobDetailsScreen from './.expo/screens/JobDetailsScreen';
import { JobProvider } from './.expo/context/JobContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function JobsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerTitle: () => (
          <Image
            source={require('./logo.png')}
            style={{ width: 120, height: 40, resizeMode: 'contain' }}
          />
        ),
      }}
    >
      <Stack.Screen name="JobsList" component={JobsScreen} options={{ title: 'Jobs' }} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} options={{ title: 'Job Details' }} />
    </Stack.Navigator>
  );
}

function BookmarksStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerTitle: () => (
          <Image
            source={require('./logo.png')}
            style={{ width: 120, height: 40, resizeMode: 'contain' }}
          />
        ),
      }}
    >
      <Stack.Screen name="BookmarksList" component={BookmarksScreen} options={{ title: 'Bookmarks' }} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} options={{ title: 'Job Details' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <JobProvider>
          <NavigationContainer>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName;
                  if (route.name === 'Jobs') {
                    iconName = focused ? 'briefcase' : 'briefcase-outline';
                  } else if (route.name === 'Bookmarks') {
                    iconName = focused ? 'bookmark' : 'bookmark-outline';
                  }
                  return <Ionicons name={iconName} size={size} color={color} />;
                },
              })}
            >
              <Tab.Screen name="Jobs" component={JobsStack} />
              <Tab.Screen name="Bookmarks" component={BookmarksStack} />
            </Tab.Navigator>
          </NavigationContainer>
        </JobProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
