import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../App';

const EmailConfirmationScreen = ({ route, navigation }) => {
  const { user_id } = route.params;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { setToken, setUserType, setCompanyName } = useContext(AuthContext);

  const handleConfirm = async () => {
    try {
      const response = await axios.post(
        'http://192.168.0.137:8000/api/confirm-email/',
        { user_id, code }
      );
      
      Alert.alert('Success', 'Email confirmed! Please sign in');
      navigation.navigate('SignIn');
    } catch (err) {
      setError(err.response?.data?.error || 'Confirmation failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Your Email</Text>
      <Text style={styles.subtitle}>
        We've sent a 6-digit code to your email address
      </Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TextInput
        style={styles.input}
        placeholder="Enter confirmation code"
        placeholderTextColor="#666"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
      />
      
      <TouchableOpacity style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>Confirm Email</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.linkText}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 18,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1a73e8',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  linkText: {
    color: '#1a73e8',
    textAlign: 'center',
    marginTop: 15,
  },
});

export default EmailConfirmationScreen;