import React, { useState, useEffect, createContext } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from './src/screens/HomeScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ReportsScreen from './src/screens/TasksScreen';
import AnnouncementsScreen from './src/screens/AnnouncementsScreen';
import YourWorkersScreen from './src/screens/YourWorkersScreen';
import SuggestionBoxScreen from './src/screens/SuggestionBoxScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';


import { NotificationProvider } from './src/components/NotificationContext';
import NotificationHandler from './src/components/NotificationHandler';
import EmailConfirmationScreen from './src/screens/EmailConfirmationScreen';

export const AuthContext = createContext();

const Stack = createStackNavigator();

const App = () => {
  const [token, setToken] = useState(null);
  const [userType, setUserType] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUserType = await AsyncStorage.getItem('userType');
        const storedCompanyName = await AsyncStorage.getItem('companyName');
        if (storedToken) {
          setToken(storedToken);
          setUserType(storedUserType);
          setCompanyName(storedCompanyName || '');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      token, 
      setToken, 
      userType, 
      setUserType,
      companyName,
      setCompanyName 
    }}>
      <NavigationContainer>
        <NotificationProvider>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {token ? (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Reports" component={ReportsScreen} />
                <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
                <Stack.Screen name="YourWorkers" component={YourWorkersScreen} />
                <Stack.Screen name="SuggestionBoxScreen" component={SuggestionBoxScreen} />
                <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="SignIn" component={SignInScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="EmailConfirmation" component={EmailConfirmationScreen}/>
              </>
            )}
          </Stack.Navigator>
          <NotificationHandler />
        </NotificationProvider>
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

export default App;