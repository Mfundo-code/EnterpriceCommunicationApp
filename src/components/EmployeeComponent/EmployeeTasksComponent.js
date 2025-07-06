import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../../App';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/MaterialIcons';

const API_BASE = 'http://www.teamkonekt.com/api';

const EmployeeTasksComponent = () => {
  const { token } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [selectedView, setSelectedView] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const url = `${API_BASE}/employee-tasks/`;
      const params = {};
      
      if (selectedView !== 'all') {
        params.status = selectedView;
      }

      const response = await axios.get(url, {
        params,
        headers: { Authorization: `Token ${token}` },
      });
      const data = response.data;

      if (Array.isArray(data)) {
        setTasks(data);
      } else if (Array.isArray(data?.results)) {
        setTasks(data.results);
      } else {
        console.warn('⚠️ Unexpected response shape', data);
        setTasks([]);
      }
      setError('');
    } catch (err) {
      console.error('Task load error:', err.response?.data || err.message);
      setError('Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.patch(
        `${API_BASE}/tasks/${taskId}/`,
        { status: newStatus },
        { headers: { Authorization: `Token ${token}` } }
      );
      
      // Refetch tasks to ensure UI consistency
      fetchTasks();
    } catch (err) {
      console.error('Status change error:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedView, token]);

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <View style={styles.taskStatusContainer}>
          <Text
            style={[
              styles.statusBadge,
              item.status === 'COMPLETED' && styles.completedStatus,
              item.status === 'IN_PROGRESS' && styles.inProgressStatus,
            ]}
          >
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <Text style={styles.taskDescription}>{item.description}</Text>

      <View style={styles.taskDetails}>
        <Text style={styles.detailText}>
          <Text style={styles.detailLabel}>Due: </Text>
          {dayjs(item.due_date).format('MMM D, YYYY')}
        </Text>
      </View>

      <View style={styles.actionContainer}>
        {/* If not completed, allow marking complete */}
        {item.status !== 'COMPLETED' && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleStatusChange(item.id, 'COMPLETED')}
          >
            <Text style={styles.completeText}>Mark Complete</Text>
          </TouchableOpacity>
        )}

        {/* If still pending, allow starting */}
        {item.status === 'PENDING' && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => handleStatusChange(item.id, 'IN_PROGRESS')}
          >
            <Text style={styles.startText}>Start Task</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ─── HORIZONTAL FILTER BAR ─── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.viewSelectorWrapper}
        contentContainerStyle={styles.viewSelector}
      >
        {['all', 'pending', 'completed'].map((view) => (
          <TouchableOpacity
            key={view}
            style={[
              styles.viewButton,
              selectedView === view && styles.activeViewButton,
            ]}
            onPress={() => setSelectedView(view)}
          >
            <Text
              style={[
                styles.viewButtonText,
                selectedView === view && styles.activeViewButtonText,
              ]}
            >
              {view === 'all'
                ? 'All Tasks'
                : view.charAt(0).toUpperCase() + view.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="check-circle" size={50} color="#ddd" />
          <Text style={styles.emptyText}>No tasks found</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.taskList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#1a73e8']}
              tintColor={'#1a73e8'}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 2,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── LIMIT THE HEIGHT OF THE SCROLLVIEW ───
  viewSelectorWrapper: {
    maxHeight: 60, // keep it from growing taller than ~50px
    marginBottom: 15,
  },
  viewSelector: {
    paddingVertical: 10,
    paddingLeft: 45
  },
  viewButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#e8f0fe',
    borderWidth: 1,
    borderColor: '#d2e3fc',
  },
  activeViewButton: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  viewButtonText: {
    color: '#1a73e8',
    fontWeight: '500',
  },
  activeViewButtonText: {
    color: 'white',
  },

  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1a237e',
    flexShrink: 1,
  },
  taskStatusContainer: {
    marginLeft: 10,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#f1f3f4',
    color: '#5f6368',
  },
  completedStatus: {
    backgroundColor: '#e6f4ea',
    color: '#137333',
  },
  inProgressStatus: {
    backgroundColor: '#e8f0fe',
    color: '#1a73e8',
  },
  taskDescription: {
    color: '#3c4043', 
    marginBottom: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  taskDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#202124',
  },
  detailText: {
    color: '#5f6368',
    fontSize: 14,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  completeButton: {
    backgroundColor: '#34a853',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  completeText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  startButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  startText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#80868b',
  },
  error: {
    color: '#d93025',
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  taskList: {
    paddingBottom: 20,
  },
});

export default EmployeeTasksComponent;