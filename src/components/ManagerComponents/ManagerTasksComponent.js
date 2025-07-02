
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import dayjs from 'dayjs';
import { AuthContext } from '../../../App';
import Icon from 'react-native-vector-icons/MaterialIcons';

const API_BASE = 'http://www.teamkonekt.com/api/';

const SendToDropdown = ({
  selectedEmployeeId,
  setSelectedEmployeeId,
  employees,
  onEndReached,
  loadingEmployees,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleDropdown = () => setIsOpen(prev => !prev);
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const buttonText = selectedEmployee
    ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
    : 'Select Employee';

  const handleScroll = ({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (isCloseToBottom) onEndReached();
  };

  return (
    <View style={styles.sendToContainer}>
      <View style={styles.sendToRow}>
        <Text style={styles.label}>Send to:</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={toggleDropdown}>
          <Text style={styles.dropdownButtonText}>{buttonText}</Text>
          <Icon name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {isOpen && (
        <View style={styles.dropdownOptions}>
          <ScrollView onScroll={handleScroll} scrollEventThrottle={400}>
            {employees.map(emp => (
              <TouchableOpacity
                key={emp.id}
                onPress={() => {
                  setSelectedEmployeeId(emp.id);
                  setIsOpen(false);
                }}
              >
                <Text style={styles.option}>
                  {emp.first_name} {emp.last_name}
                </Text>
              </TouchableOpacity>
            ))}
            {loadingEmployees && <ActivityIndicator size="small" />}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const ManagerTasksComponent = () => {
  const { token } = useContext(AuthContext);

  // Task states
  const [tasks, setTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Employee states
  const [employees, setEmployees] = useState([]);
  const [employeePage, setEmployeePage] = useState(1);
  const [totalEmployeePages, setTotalEmployeePages] = useState(1);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Other states
  const [selectedView, setSelectedView] = useState('list');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: null,
    due_date: dayjs(),
  });
  const [dueDateText, setDueDateText] = useState(newTask.due_date.format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Task status change handler
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.patch(
        `${API_BASE}/tasks/${taskId}/`,
        { status: newStatus },
        { headers: { Authorization: `Token ${token}` } }
      );
      setTasks(tasks.map(t => (t.id === taskId ? { ...t, status: newStatus } : t)));
    } catch {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  // Send reminder handler
  const handleSendReminder = async (taskId) => {
    try {
      await axios.post(
        `${API_BASE}/tasks/${taskId}/remind/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      Alert.alert('Success', 'Reminder sent to employee');
    } catch {
      Alert.alert('Error', 'Failed to send reminder');
    }
  };

  // Delete task handler
  const handleDeleteTask = (taskId) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE}/tasks/${taskId}/`, {
                headers: { Authorization: `Token ${token}` },
              });
              setTasks(tasks.filter(t => t.id !== taskId));
            } catch {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  // Create task handler
  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.description || !newTask.assigned_to) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        `${API_BASE}/tasks/`,
        {
          title: newTask.title,
          description: newTask.description,
          due_date: newTask.due_date.format('YYYY-MM-DD'),
          assigned_to: [newTask.assigned_to],
        },
        { headers: { Authorization: `Token ${token}` } }
      );
      setNewTask({ title: '', description: '', assigned_to: null, due_date: dayjs() });
      setDueDateText(dayjs().format('YYYY-MM-DD'));
      setSelectedView('list');
      setError('');
    } catch (err) {
      console.error('Create task error:', err.response?.data);
      setError('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  // Task pagination
  const fetchTasks = async (page = 1) => {
    try {
      page === 1 ? setLoading(true) : setIsLoadingMore(true);
      let url = `${API_BASE}/tasks/`;
      if (selectedView === 'completed') url = `${API_BASE}/tasks/completed/`;
      if (selectedView === 'pending') url = `${API_BASE}/tasks/pending/`;
      if (selectedView === 'overdue') url = `${API_BASE}/tasks/overdue/`;

      const { data } = await axios.get(`${url}?page=${page}`, {
        headers: { Authorization: `Token ${token}` },
      });

      setTasks(prev => (page === 1 ? data.results : [...prev, ...data.results]));
      setTotalPages(data.total_pages);
      setError('');
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchTasks(nextPage);
    }
  };

  // Employee pagination
  const fetchEmployees = async (page = 1) => {
    try {
      setLoadingEmployees(true);
      const { data } = await axios.get(`${API_BASE}/employees/?page=${page}`, {
        headers: { Authorization: `Token ${token}` },
      });
      setEmployees(prev => (page === 1 ? data.results : [...prev, ...data.results]));
      setTotalEmployeePages(data.total_pages);
    } catch {
      setError('Failed to load employees');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleEmployeeEndReached = () => {
    if (employeePage < totalEmployeePages) {
      const nextPage = employeePage + 1;
      setEmployeePage(nextPage);
      fetchEmployees(nextPage);
    }
  };

  useEffect(() => {
    if (selectedView !== 'create') {
      setCurrentPage(1);
      fetchTasks(1);
    }
  }, [selectedView, token]);

  useEffect(() => {
    fetchEmployees(1);
  }, [token]);

  // ───── Render each task ─────
  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <View style={styles.taskActions}>
          {item.status === 'COMPLETED' ? (
            // If status is COMPLETED, show a "Completed" label
            <Text style={styles.completedText}>Completed</Text>
          ) : (
            // Otherwise (PENDING or OVERDUE), show "Remind" button
            <TouchableOpacity
              style={styles.remindButton}
              onPress={() => handleSendReminder(item.id)}
            >
              <Text style={styles.remindText}>Remind</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleDeleteTask(item.id)}
            style={styles.deleteButton}
          >
            <Icon name="delete" size={20} color="#1a73e8" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.taskDescription}>{item.description}</Text>

      <View style={styles.taskDetails}>
        <Text>
          <Text style={styles.detailLabel}>Assigned to:</Text> {item.employee_name}
        </Text>
        <Text>
          <Text style={styles.detailLabel}>Due:</Text>{' '}
          {dayjs(item.due_date).format('DD/MM/YYYY')}
        </Text>
        <Picker
          selectedValue={item.status}
          style={styles.statusPicker}
          onValueChange={(val) => handleStatusChange(item.id, val)}
        >
          <Picker.Item label="Pending" value="PENDING" />
          <Picker.Item label="In Progress" value="IN_PROGRESS" />
          <Picker.Item label="Completed" value="COMPLETED" />
        </Picker>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView horizontal contentContainerStyle={styles.header}>
        {['list', 'completed', 'pending', 'overdue', 'create'].map((view) => (
          <TouchableOpacity
            key={view}
            style={[styles.viewButton, selectedView === view && styles.activeButton]}
            onPress={() => setSelectedView(view)}
          >
            <Text style={[styles.viewText, selectedView === view && styles.activeText]}>
              {view === 'list'
                ? 'All'
                : view === 'create'
                ? '+ New'
                : view.charAt(0).toUpperCase() + view.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error !== '' && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator size="large" />
      ) : selectedView === 'create' ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Title"
            placeholderTextColor="#666"
            value={newTask.title}
            onChangeText={(t) => setNewTask({ ...newTask, title: t })}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Description"
            placeholderTextColor="#666"
            multiline
            value={newTask.description}
            onChangeText={(t) => setNewTask({ ...newTask, description: t })}
          />

          <Text style={styles.label}>Due Date (YYYY-MM-DD):</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2025-05-23"
            value={dueDateText}
            onChangeText={(txt) => setDueDateText(txt)}
            onBlur={() => {
              const parsed = dayjs(dueDateText, 'YYYY-MM-DD', true);
              if (!parsed.isValid()) {
                Alert.alert('Error', 'Please enter a valid due date (YYYY-MM-DD)');
                setDueDateText(newTask.due_date.format('YYYY-MM-DD'));
              } else {
                setNewTask({ ...newTask, due_date: parsed });
              }
            }}
          />

          <SendToDropdown
            selectedEmployeeId={newTask.assigned_to}
            setSelectedEmployeeId={(id) => setNewTask({ ...newTask, assigned_to: id })}
            employees={employees}
            onEndReached={handleEmployeeEndReached}
            loadingEmployees={loadingEmployees}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleCreateTask}>
            <Text style={styles.submitText}>Create Task</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTask}
          contentContainerStyle={styles.taskList}
          ListEmptyComponent={<Text style={{ textAlign: 'center' }}>No tasks found.</Text>}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => isLoadingMore && <ActivityIndicator size="small" />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  header: { paddingVertical: 5 },
  viewButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1a73e8',
    borderRadius: 4,
  },
  activeButton: { backgroundColor: '#1a73e8' },
  viewText: { color: '#1a73e8' },
  activeText: { color: 'white' },
  error: { color: '#dc3545', marginVertical: 8 },
  form: { marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontWeight: 'bold',
  },
  sendToContainer: {
    backgroundColor: '#d0ecff',
    padding: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  sendToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButton: {
    backgroundColor: '#007BFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dropdownButtonText: { color: '#fff', fontSize: 16, marginRight: 4 },
  dropdownOptions: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    elevation: 2,
    maxHeight: 200,
  },
  option: { paddingVertical: 6, fontSize: 15, color: '#333' },
  submitButton: {
    backgroundColor: '#1a73e8',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  submitText: { color: 'white', fontWeight: 'bold' },
  taskList: { paddingTop: 12 },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 6,
    marginBottom: 12,
    elevation: 2,
    padding: 10,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  taskActions: { flexDirection: 'row', alignItems: 'center' },
  remindButton: {
    backgroundColor: '#ffd700',
    padding: 4,
    borderRadius: 4,
  },
  remindText: { fontSize: 12, color: '#333' },
  deleteButton: { marginLeft: 8, padding: 4 },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#353636', },
  taskDescription: { marginBottom: 8 },
  taskDetails: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  detailLabel: { fontWeight: 'bold', color: '#353636', },
  statusPicker: { height: 30, width: 130 },
  
  completedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#137333',
    marginRight: 8,
  },
});

export default ManagerTasksComponent;
