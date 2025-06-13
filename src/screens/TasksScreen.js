// src/screens/ReportsScreen.js
import React, { useContext, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { AuthContext } from '../../App';
import ManagerTasksComponent from '../components/ManagerComponents/ManagerTasksComponent';
import EmployeeTasksComponent from '../components/EmployeeComponent/EmployeeTasksComponent';
import { useNotifications } from '../components/NotificationContext';

const ReportsScreen = () => {
  const { userType } = useContext(AuthContext);
  const { resetNotification } = useNotifications();

  useEffect(() => {
    resetNotification('tasks');
  }, []);

  return (
    <MainLayout>
      {userType === 'manager' ? (
        <ManagerTasksComponent />
      ) : (
        <EmployeeTasksComponent />
      )}
    </MainLayout>
  );
};

export default ReportsScreen;