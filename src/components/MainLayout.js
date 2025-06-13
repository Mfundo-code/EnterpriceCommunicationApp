// src/components/MainLayout.js
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TopBar from './TopBar';
import MoreComponent from './MoreComponent';
import RootComponent from './RootComponent';

const MainLayout = ({ children }) => {
  const [isMoreDrawerVisible, setMoreDrawerVisible] = useState(false);
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TopBar
        onChatPress={() => navigation.navigate('ChatScreen')}
        onMenuPress={() => setMoreDrawerVisible(prev => !prev)}
      />

      {isMoreDrawerVisible && (
        <MoreComponent
          visible={isMoreDrawerVisible}
          onClose={() => setMoreDrawerVisible(false)}
          onTrainingPress={() => navigation.navigate('TrainingScreen')}
          onSuggestionBoxPress={() => navigation.navigate('SuggestionBoxScreen')}
          onYourWorkersPress={() => navigation.navigate('YourWorkers')} // Added this
        />
      )}

      <View style={styles.content}>
        {children}
      </View>
      <RootComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
});

export default MainLayout;
