// src/components/MoreComponent.js
import React, { useContext } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Alert 
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Add Ionicons for lock icon
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from "../../App";
import { useNotifications } from './NotificationContext';

const MoreComponent = ({ 
  visible, 
  onClose,
  onSuggestionBoxPress,
  onYourWorkersPress,
  onChangePasswordPress // Add this prop
}) => {
  const { setToken, userType } = useContext(AuthContext);
  const { notificationCounts } = useNotifications();

  if (!visible) return null;

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      setToken(null);
      onClose();
      Alert.alert('Logged Out', 'You have been logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert(
        'Logout Error',
        'There was an error logging out. Please try again.'
      );
    }
  };

  return (
    <View style={styles.more}>
      {/* Your Workers Option - only for manager */}
      {userType === 'manager' && (
        <TouchableOpacity 
          style={styles.moreItem}
          onPress={() => {
            onYourWorkersPress && onYourWorkersPress();
            onClose();
          }}
        >
          <MaterialCommunityIcons name="account-group" size={20} color="#139beb" />
          <Text style={styles.moreText}>Your Workers</Text>
        </TouchableOpacity>
      )}

      {/* Suggestion Box Option */}
      <TouchableOpacity 
        style={styles.moreItem}
        onPress={() => {
          onSuggestionBoxPress && onSuggestionBoxPress();
            onClose();
          }}
        >
          <View style={styles.suggestionBoxContainer}>
            <MaterialCommunityIcons name="package-variant" size={20} color="#139beb" />
            <Text style={styles.moreText}>Suggestion Box</Text>
            {notificationCounts.suggestions > 0 && (
              <View style={styles.suggestionBadge}>
                <Text style={styles.suggestionBadgeText}>
                  {notificationCounts.suggestions}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

      {/* Change Password Option */}
      <TouchableOpacity 
        style={styles.moreItem}
        onPress={() => {
          onChangePasswordPress && onChangePasswordPress();
          onClose();
        }}
      >
        <Ionicons name="lock-closed" size={20} color="#139beb" />
        <Text style={styles.moreText}>Change Password</Text>
      </TouchableOpacity>

      {/* Logout Option */}
      <TouchableOpacity 
        style={styles.moreItem}
        onPress={handleLogout}
      >
        <MaterialCommunityIcons name="logout" size={20} color="#139beb" />
        <Text style={styles.moreText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  more: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  moreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  moreText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#139beb',
  },
  suggestionBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionBadge: {
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  suggestionBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MoreComponent;