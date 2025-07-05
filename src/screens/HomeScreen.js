import React from 'react';
import MainLayout from '../components/MainLayout';
import ReportsComponent from '../components/ReportsComponent';
import { useNotifications } from '../components/NotificationContext';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = () => {
  const { resetNotification } = useNotifications();

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      
      const resetNotifications = async () => {
        try {
          // Reset notifications and wait for completion
          await resetNotification('home');
          
          // Add small delay to ensure backend processes the reset
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error('Failed to reset notifications:', error);
        }
      };
      
      if (isActive) {
        resetNotifications();
      }
      
      return () => {
        isActive = false;
      };
    }, [resetNotification])
  );

  return (
    <MainLayout>
      <ReportsComponent />
    </MainLayout>
  );
};

export default HomeScreen;