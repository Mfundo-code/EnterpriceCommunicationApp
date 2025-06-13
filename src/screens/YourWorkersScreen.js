// src/screens/AttendanceScreen.js
import React, { useContext } from 'react';
import MainLayout from '../components/MainLayout';
import YourWorkersComponent from '../components/YourWorkersComponent';

const YourWorkersScreen = () => {
  return (
    <MainLayout>
      <YourWorkersComponent/>
    </MainLayout>
  );
};

export default YourWorkersScreen;

