// src/components/SignOutComponent.js

import React, { useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../App';

const SignOutComponent = () => {
  const navigation = useNavigation();
  const { setToken } = useContext(AuthContext);

  useEffect(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { 
          text: 'Cancel', 
          onPress: () => navigation.replace('Home'), 
          style: 'cancel' 
        },
        { 
          text: 'Yes', 
          onPress: async () => {
            // Remove token from storage
            await AsyncStorage.removeItem('authToken');
            // Update context
            setToken(null);
            // The stack navigator will now show SignInScreen
          } 
        }
      ],
      { cancelable: false }
    );
  }, []);

  // Nothing to render underneath the alert
  return null;
};

export default SignOutComponent;
