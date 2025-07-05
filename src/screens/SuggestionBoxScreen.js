import React from 'react';
import MainLayout from '../components/MainLayout';
import SuggestionBoxComponent from '../components/SuggestionBoxComponent';
import { useNotifications } from '../components/NotificationContext';
import { useFocusEffect } from '@react-navigation/native';

const SuggestionBoxScreen = () => {
  const { resetNotification } = useNotifications();

  useFocusEffect(
    React.useCallback(() => {
      resetNotification('suggestions');
      return () => {}; // Optional cleanup function
    }, [resetNotification])
  );

  return (
    <MainLayout>
      <SuggestionBoxComponent />
    </MainLayout>
  );
};

export default SuggestionBoxScreen;