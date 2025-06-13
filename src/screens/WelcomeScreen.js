// src/screens/WelcomeScreen.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to WorkSync</Text>
      <Text style={styles.subtitle}>Please select your role</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('ManagerAuth')}
      >
        <Text style={styles.buttonText}>Manager</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('SignIn', { userType: 'employee' })}
      >
        <Text style={styles.buttonText}>Employee</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
    color: '#666',
  },
  button: {
    backgroundColor: '#1a73e8',
    padding: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
