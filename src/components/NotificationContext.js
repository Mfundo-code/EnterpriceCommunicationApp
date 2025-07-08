import React, { createContext, useRef, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../../App';

const API_BASE = 'https://www.teamkonekt.com/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationCounts, setNotificationCounts] = useState({
    home: 0,
    tasks: 0,
    announcements: 0,
    suggestions: 0,
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
        suggestions: response.data.suggestions || 0,
      });
    } catch (error) {
      console.error('Failed to fetch notification counts:', error);
    }
  };

  const incrementNotification = (type, amount = 1) => {
    setNotificationCounts(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + amount),
    }));
  };

  const resetNotification = useCallback(async (type) => {
    try {
      // Optimistically update the UI
      setNotificationCounts(prev => ({
        ...prev,
        [type]: 0,
      }));
      
      // Call backend to reset the notification count
      await axios.post(
        `${API_BASE}/notifications/reset-count/`,
        { type },
        { headers: { Authorization: `Token ${token}` } }
      );
      
      // Refresh counts to ensure consistency
      fetchNotificationCounts();
    } catch (error) {
      console.error('Failed to reset notification count:', error);
      // Revert optimistic update on failure
      fetchNotificationCounts();
    }
  }, [token]);

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

  return (
    <NotificationContext.Provider
      value={{ 
        notificationCounts, 
        resetNotification,
        incrementNotification, 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);