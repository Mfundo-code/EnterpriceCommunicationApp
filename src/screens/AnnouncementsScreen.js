// src/screens/AnnouncementsScreen.js
import React, { useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import AnnouncementsComponent from '../components/AnnouncementsComponent';
import { useNotifications } from '../components/NotificationContext';

const AnnouncementsScreen = () => {
  const { resetNotification } = useNotifications();

  useEffect(() => {
    resetNotification('announcements');
  }, []);

  return (
    <MainLayout>
      <AnnouncementsComponent />
    </MainLayout>
  );
};

export default AnnouncementsScreen;