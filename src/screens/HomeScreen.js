// src/screens/HomeScreen.js
import React, { useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import ReportsComponent from '../components/ReportsComponent';
import { useNotifications } from '../components/NotificationContext';

const HomeScreen = () => {
  const { resetNotification } = useNotifications();

  useEffect(() => {
    resetNotification('home');
  }, []);

  return (
    <MainLayout>
      <ReportsComponent />
    </MainLayout>
  );
};

export default HomeScreen;