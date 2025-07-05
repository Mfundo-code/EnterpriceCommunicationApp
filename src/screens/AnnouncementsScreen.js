import React from 'react';
import MainLayout from '../components/MainLayout';
import AnnouncementsComponent from '../components/AnnouncementsComponent';
import { useNotifications } from '../components/NotificationContext';
import { useFocusEffect } from '@react-navigation/native';

const AnnouncementsScreen = () => {
  const { resetNotification } = useNotifications();

  useFocusEffect(
    React.useCallback(() => {
      resetNotification('announcements');
      return () => {}; // Optional cleanup function
    }, [resetNotification])
  );

  return (
    <MainLayout>
      <AnnouncementsComponent />
    </MainLayout>
  );
};

export default AnnouncementsScreen;