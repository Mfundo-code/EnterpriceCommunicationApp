import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationCounts, setNotificationCounts] = useState({
    home: 0,
    tasks: 0,
    announcements: 0,
    suggestions: 0
  });

  const incrementNotification = (type) => {
    setNotificationCounts(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
  };

  const resetNotification = (type) => {
    setNotificationCounts(prev => ({
      ...prev,
      [type]: 0
    }));
  };

  return (
    <NotificationContext.Provider
      value={{ notificationCounts, incrementNotification, resetNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
