import React, { useState, useContext } from 'react';
import { 
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SignInScreen = ({ navigation }) => {
  const [username, setUsername]             = useState('');
  const [password, setPassword]             = useState('');
  const [error, setError]                   = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const { setToken, setUserType, setCompanyName } = useContext(AuthContext);

  useFocusEffect(
    React.useCallback(() => {
      setUsername('');
      setPassword('');
      setError('');
    }, [])
  );

  const handleSubmit = async () => {
    try {
      const { data } = await axios.post('https://www.teamkonekt.com/login/', {
        email: username,
        password,
      });

      if (data.token) {
        const trimmedToken = data.token.trim();
        await AsyncStorage.setItem('authToken', trimmedToken);
        await AsyncStorage.setItem('userType', data.user_type);
        await AsyncStorage.setItem('companyName', data.company_name);
        setToken(trimmedToken);
        setUserType(data.user_type);
        setCompanyName(data.company_name);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || 'An error occurred. Please try again.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(prev => !prev)}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <Text style={styles.toggleText}>
        Don't have an account?{' '}
        <Text
          style={styles.toggleLink}
          onPress={() => navigation.navigate('SignUp')}
        >
          Sign Up
        </Text>
      </Text>
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
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 12,
    paddingHorizontal: 10,
    color: '#000',
    backgroundColor: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 12,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
    marginBottom: 0,
    paddingVertical: 8,
  },
  eyeIcon: {
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#1a73e8',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  toggleText: {
    marginTop: 15,
    textAlign: 'center',
    color: '#333',
  },
  toggleLink: {
    color: '#1a73e8',
    fontWeight: 'bold',
  },
});

export default SignInScreen;