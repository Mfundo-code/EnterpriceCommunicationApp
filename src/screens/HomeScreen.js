import React from 'react';
import MainLayout from '../components/MainLayout';
import ReportsComponent from '../components/ReportsComponent';
import { useNotifications } from '../components/NotificationContext';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = () => {
  const { resetNotification } = useNotifications();

  useFocusEffect(
    React.useCallback(() => {
      resetNotification('home');
      return () => {}; // Optional cleanup function
    }, [resetNotification])
  );

  return (
    <MainLayout>
      <ReportsComponent />
    </MainLayout>
  );
};

export default HomeScreen;