import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Clipboard,  // Added
  Alert       // Added
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../App';

const API_BASE = 'http://www.teamkonekt.com/api/employees/';

const EmployeesComponent = () => {
  const { token } = useContext(AuthContext);
  const [viewMode, setViewMode] = useState('list');
  const [employees, setEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState('');
  const [newEmployee, setNewEmployee] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    phone_number: ''
  });
  const [removeId, setRemoveId] = useState(null);

  const fetchEmployees = async (page = 1) => {
    try {
      page === 1 ? setLoading(true) : setIsLoadingMore(true);
      setError('');
      const resp = await axios.get(`${API_BASE}?page=${page}`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      setEmployees(prev => 
        page === 1 ? resp.data.results : [...prev, ...resp.data.results]
      );
      setTotalPages(resp.data.total_pages);
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (token && viewMode === 'list') {
      fetchEmployees(currentPage);
    }
    // Whenever you switch away from “add,” clear out any previous credentials and messages:
    if (viewMode !== 'add') {
      setCreatedCredentials('');
      setSuccess('');
      setError('');
      setNewEmployee({ first_name: '', last_name: '', email: '', role: '', phone_number: '' });
    }
  }, [token, viewMode, currentPage]);

  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleAddEmployee = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setCreatedCredentials('');
      
      const resp = await axios.post(API_BASE, newEmployee, {
        headers: { Authorization: `Token ${token}` }
      });
      
      const data = resp.data;
      const credentialsText = 
        `Employee Login Details:\nEmail: ${data.email}\nPassword: ${data.temporary_password}`;
      
      setCreatedCredentials(credentialsText);
      setSuccess('Employee created successfully! Below are the login details:');
      setNewEmployee({ first_name: '', last_name: '', email: '', role: '', phone_number: '' });
    } catch (err) {
      setError('Failed to add employee: ' + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Copy credentials to clipboard
  const copyToClipboard = () => {
    Clipboard.setString(createdCredentials);
    Alert.alert('Copied!', 'Login details copied to clipboard');
  };

  // Once the manager has copied the credentials, they press this to go back to the list:
  const handleBackToList = () => {
    setViewMode('list');
    fetchEmployees(1);
  };

  const handleRemoveEmployee = async () => {
    if (!removeId) {
      setError('Please select an employee to remove');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await axios.delete(`${API_BASE}${removeId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setSuccess('Employee removed successfully!');
      setRemoveId(null);
      setTimeout(() => setSuccess(''), 3000);
      
      if (employees.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        fetchEmployees(currentPage);
      }
    } catch (err) {
      setError('Failed to remove employee: ' + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {['list', 'add', 'remove'].map(mode => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.modeButton,
            viewMode === mode && styles.activeButton
          ]}
          onPress={() => setViewMode(mode)}
        >
          <Text style={styles.buttonText}>
            {mode === 'list' ? 'List' : mode === 'add' ? 'Add' : 'Remove'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAddForm = () => (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.formTitle}>Add New Employee</Text>
      {Object.keys(newEmployee).map(field => (
        <TextInput
          key={field}
          style={styles.input}
          placeholder={field.replace('_', ' ').toUpperCase()}
          placeholderTextColor="#888"
          value={newEmployee[field]}
          onChangeText={text => setNewEmployee({ ...newEmployee, [field]: text })}
          keyboardType={
            field === 'email' ? 'email-address' :
            field === 'phone_number' ? 'phone-pad' : 'default'
          }
        />
      ))}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleAddEmployee}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Create Employee</Text>
        )}
      </TouchableOpacity>

      {createdCredentials ? (
        <>
          <Text style={styles.success}>{success}</Text>

          <TextInput
            style={styles.credentialsBox}
            value={createdCredentials}
            multiline
            editable={false}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.copyButton, styles.button]}
              onPress={copyToClipboard}
            >
              <Text style={styles.buttonText}>Copy Credentials</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, styles.button]}
              onPress={handleBackToList}
            >
              <Text style={styles.buttonText}>Back to List</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );

  const renderRemoveForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Remove Employee</Text>
      <FlatList
        data={employees}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.employeeItem,
              removeId === item.id && styles.selectedEmployee
            ]}
            onPress={() => setRemoveId(item.id)}
          >
            <Text style={styles.employeeName}>
              {item.first_name} {item.last_name}
            </Text>
            <Text style={styles.employeeRole}>{item.role}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={[styles.submitButton, !removeId && styles.disabledButton]}
        onPress={handleRemoveEmployee}
        disabled={!removeId || loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Confirm Removal</Text>
        )}
      </TouchableOpacity>
      {success ? <Text style={styles.success}>{success}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );

  const renderList = () => (
    <FlatList
      data={employees}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>
            {item.first_name} {item.last_name}
          </Text>
          {item.role && <Text style={styles.detail}>{item.role}</Text>}
          {item.email && <Text style={styles.detail}>{item.email}</Text>}
          {item.phone_number && <Text style={styles.detail}>{item.phone_number}</Text>}
        </View>
      )}
      ListEmptyComponent={
        !loading && <Text style={styles.empty}>No employees found.</Text>
      }
      ListFooterComponent={() => isLoadingMore && <ActivityIndicator style={{ marginVertical: 20 }} />}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {viewMode === 'add' && renderAddForm()}
      {viewMode === 'remove' && renderRemoveForm()}
      {viewMode === 'list' && renderList()}

      {loading && viewMode === 'list' && (
        <ActivityIndicator size="large" style={styles.overlayLoader} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: 'white' },
  error: { color: '#dc3545', textAlign: 'center', marginBottom: 12 },
  success: { color: '#28a745', textAlign: 'center', marginBottom: 12 },
  empty: { textAlign: 'center', color: '#666', marginTop: 20 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    marginBottom: 20
  },
  modeButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#1a73e8',
  },
  activeButton: {
    backgroundColor: '#1557b0',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  formContainer: {
    flexGrow: 1,
    width: '100%',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  submitButton: {
    backgroundColor: '#1a73e8',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  credentialsBox: {
    borderColor: '#bbb',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginTop: 12,
    backgroundColor: '#f8f9fa',
    color: '#333'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  copyButton: {
    backgroundColor: '#4CAF50',
  },
  employeeItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  selectedEmployee: {
    backgroundColor: '#e3f2fd',
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  employeeRole: {
    color: '#666',
  },
  card: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    elevation: 2
  },
  name: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  detail: { 
    fontSize: 14, 
    color: '#444' 
  },
  overlayLoader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)'
  }
});

export default EmployeesComponent;
