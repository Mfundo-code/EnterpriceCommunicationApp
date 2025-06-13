// src/components/TopBar.js
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const TopBar = ({
  onMenuPress = () => {},
  isPressable = true,
  companyName = 'MyCompany',
}) => {
  return (
    <SafeAreaView>
      <View style={styles.container}>
        <Text style={styles.companyName}>
          {companyName.toUpperCase()}
        </Text>

        {isPressable && (
          <View style={styles.iconsContainer}>
            <TouchableOpacity
              style={styles.iconWrapper}
              onPress={onMenuPress}
            >
              <FontAwesome name="navicon" style={styles.icon} />
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
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#d1e8ff',
    backgroundColor: '#f2f9ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#139beb',
    textTransform: 'uppercase',
  },
  iconsContainer: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  iconWrapper: {
    padding: 6,
    marginLeft: 20,
  },
  icon: {
    color: '#139beb',
    fontSize: 24,
  },
});

export default TopBar;
