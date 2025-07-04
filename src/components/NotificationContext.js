// src/components/NotificationContext.js
import React, { createContext, useRef, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../../App';

const API_BASE = 'http://www.teamkonekt.com/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationCounts, setNotificationCounts] = useState({
    home: 0,
    tasks: 0,
    announcements: 0,
    suggestions: 0
  });
  
  const { token } = useContext(AuthContext);
  const pollingIntervalRef = useRef(null);
  
  const fetchNotificationCounts = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API_BASE}/notifications/count/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      setNotificationCounts({
        home: response.data.reports || 0,
        tasks: response.data.tasks || 0,
        announcements: response.data.announcements || 0,
        suggestions: response.data.suggestions || 0
      });
    } catch (error) {
      console.error('Failed to fetch notification counts:', error);
    }
  };

  useEffect(() => {
    if (token) {
      // Fetch immediately on token change
      fetchNotificationCounts();
      
      // Set up polling every 2 seconds
      pollingIntervalRef.current = setInterval(fetchNotificationCounts, 2000);
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [token]);

  const resetNotification = (type) => {
    setNotificationCounts(prev => ({
      ...prev,
      [type]: 0
    }));
  };

  return (
    <NotificationContext.Provider
      value={{ 
        notificationCounts, 
        resetNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);