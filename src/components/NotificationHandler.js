import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from './NotificationContext';

const NotificationHandler = () => {
  const navigation = useNavigation();
  const { resetNotification } = useNotifications();

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      // Safely retrieve the current state
      const navState = navigation.getState();
      if (!navState || !Array.isArray(navState.routes)) return;

      const index = navState.index;
      const currentRoute = navState.routes[index]?.name;

      if (currentRoute === 'Home') {
        resetNotification('home');
      } else if (currentRoute === 'Reports') {
        resetNotification('tasks');
      } else if (currentRoute === 'Announcements') {
        resetNotification('announcements');
      } else if (currentRoute === 'SuggestionBoxScreen') {
        resetNotification('suggestions');
      }
    });

    return unsubscribe;
  }, [navigation, resetNotification]);

  return null;
};

export default NotificationHandler;
