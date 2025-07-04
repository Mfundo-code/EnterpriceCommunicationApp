// src/components/TopBar.js
import React, { useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { AuthContext } from '../../App';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from './NotificationContext';

const TopBar = ({ onMenuPress = () => {}, isPressable = true }) => {
  const { companyName } = useContext(AuthContext);
  const navigation = useNavigation();
  const { notificationCounts } = useNotifications();

  // Get current route name to conditionally show back arrow
  const state = navigation.getState();
  const currentRoute = state.routes[state.index];
  const currentRouteName = currentRoute.name;
  const showBackArrow = currentRouteName !== 'Home';

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          {showBackArrow && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={styles.backButton}
            >
              <FontAwesome name="arrow-left" style={styles.backIcon} />
            </TouchableOpacity>
          )}
          <Text style={styles.companyName}>
            {companyName ? companyName.toUpperCase() : 'COMPANY'}
          </Text>
        </View>

        {isPressable && (
          <View style={styles.iconsContainer}>
            <TouchableOpacity
              style={styles.iconWrapper}
              onPress={onMenuPress}
            >
              <View>
                <FontAwesome name="navicon" style={styles.icon} />
                {notificationCounts.suggestions > 0 && (
                  <View style={styles.suggestionBadge}>
                    <Text style={styles.suggestionBadgeText}>
                      {notificationCounts.suggestions}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#d1e8ff',
    backgroundColor: '#f2f9ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  backIcon: {
    color: '#139beb',
    fontSize: 20,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#139beb',
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  iconsContainer: {
    flexDirection: 'row',
  },
  iconWrapper: {
    padding: 6,
    marginLeft: 20,
  },
  icon: {
    color: '#139beb',
    fontSize: 24,
  },
  suggestionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  suggestionBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default TopBar;
