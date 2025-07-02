import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SignUpScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    // Client-side validation
    if (!username || !email || !companyName || !phoneNumber || !password) {
      setError('All fields are required.');
      return;
    }

    try {
      const response = await axios.post('http://www.teamkonekt.com/api/signup/', {
        username,
        email,
        password,
        company_name: companyName,
        phone_number: phoneNumber,
      });

      navigation.navigate('EmailConfirmation', {
        user_id: response.data.user_id
      });
      setError('');
    } catch (err) {
      let errorMessage = 'An error occurred. Please try again.';
      const data = err.response?.data;

      if (data) {
        if (typeof data === 'object' && !data.detail) {
          const messages = Object
            .values(data)
            .flat()
            .map(msg => msg.toString());
          if (messages.length) {
            errorMessage = messages.join(' ');
          }
        }
        else if (data.detail) {
          errorMessage = data.detail;
        }
      }

      setError(errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#666"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Company Name"
        placeholderTextColor="#666"
        value={companyName}
        onChangeText={setCompanyName}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        placeholderTextColor="#666"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
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
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <Text style={styles.toggleText}>
        Already have an account?{' '}
        <Text
          style={styles.toggleLink}
          onPress={() => navigation.navigate('SignIn')}
        >
          Sign In
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

export default SignUpScreen;