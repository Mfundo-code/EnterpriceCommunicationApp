import React, { useContext } from 'react';
import MainLayout from '../components/MainLayout';
import { AuthContext } from '../../App';
import ManagerTasksComponent from '../components/ManagerComponents/ManagerTasksComponent';
import EmployeeTasksComponent from '../components/EmployeeComponent/EmployeeTasksComponent';
import { useNotifications } from '../components/NotificationContext';
import { useFocusEffect } from '@react-navigation/native';

const ReportsScreen = () => {
  const { userType } = useContext(AuthContext);
  const { resetNotification } = useNotifications();

  useFocusEffect(
    React.useCallback(() => {
      resetNotification('tasks');
      return () => {}; // Optional cleanup function
    }, [resetNotification])
  );

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