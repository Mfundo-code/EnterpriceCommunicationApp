// src/components/RootComponent.js
import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import AntIcon from 'react-native-vector-icons/AntDesign';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from './NotificationContext';

const { width } = Dimensions.get('window');

const RootComponent = () => {
  const { notificationCounts } = useNotifications();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Home */}
      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <View style={styles.buttonContainer}>
          <View style={styles.iconWrapper}>
            <EntypoIcon name="home" style={styles.icon} />
            {notificationCounts.home > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCounts.home}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Tasks/Reports */}
      <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
        <View style={styles.buttonContainer}>
          <View style={styles.iconWrapper}>
            <FontAwesome5 name="tasks" style={styles.icon} solid />
            {notificationCounts.tasks > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCounts.tasks}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Announcements */}
      <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
        <View style={styles.buttonContainer}>
          <View style={styles.iconWrapper}>
            <AntIcon name="notification" style={styles.icon} />
            {notificationCounts.announcements > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCounts.announcements}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#1a73e8',
    backgroundColor: '#f2f9ff',
  },
  buttonContainer: {
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  icon: {
    color: '#1a73e8',
    fontSize: 28,
    marginBottom: 15,
  },
  label: {
    color: '#1a73e8',
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default RootComponent;