// src/screens/SuggestionBoxScreen.js
import React, { useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import SuggestionBoxComponent from '../components/SuggestionBoxComponent';
import { useNotifications } from '../components/NotificationContext';

const SuggestionBoxScreen = () => {
  const { resetNotification } = useNotifications();

  useEffect(() => {
    resetNotification('suggestions');
  }, []);

  return (
    <MainLayout>
      <SuggestionBoxComponent />
    </MainLayout>
  );
};

export default SuggestionBoxScreen;