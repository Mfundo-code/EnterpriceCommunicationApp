import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  Linking
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../App';
import dayjs from 'dayjs';

const API_BASE = 'http://www.teamkonekt.com/api';

const ReportsComponent = () => {
  const { token } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [selectedView, setSelectedView] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Modal & new-report state
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [newReport, setNewReport] = useState('');

  // Calculate badge counts
  const pendingCount = reports.filter(r => r.status === 'PENDING').length;
  const attendedCount = reports.filter(r => r.status === 'ATTENDED').length;

  // Fetch current user
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_BASE}/auth/user/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const userData = response.data;
        setCurrentUser(userData);
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    if (token) fetchUserData();
  }, [token]);

  // Fetch reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_BASE}/reports/`, {
        params: { extended: true },
        headers: { Authorization: `Token ${token}` },
      });
      const data = response.data.results || response.data;
      if (!Array.isArray(data)) throw new Error('Unexpected API response format');
      setReports(data);
    } catch (err) {
      console.error('Fetch reports error:', err);
      setError(err.response?.data?.detail || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchReports();
  }, [token]);

  // Open modal
  const handleAddReport = () => setIsFormVisible(true);

  // Submit new report
  const submitNewReport = async () => {
    if (!newReport.trim()) {
      Alert.alert('Error', 'Please enter a report message');
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.post(
        `${API_BASE}/reports/`,
        { message: newReport },
        { headers: { Authorization: `Token ${token}` } }
      );
      setReports(prev => [data, ...prev]);
      setNewReport('');
      setIsFormVisible(false);
    } catch (err) {
      // Handle the case where only employees can create reports
      if (!err.response?.data?.message?.[0]?.includes('only employees can create reports')) {
        Alert.alert(
          'Error',
          `Failed to submit report: ${
            err.response?.data?.message?.[0] || 'Only employees can send reports!'
          }`
        );
      }
    } finally {
      setLoading(false);
      setIsFormVisible(false);
    }
  };

  // Attend report
  const handleAttendReport = async (id) => {
    try {
      const { data } = await axios.post(
        `${API_BASE}/reports/${id}/attend/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      setReports(prev => prev.map(r => (r.id === id ? data : r)));
    } catch {
      Alert.alert('Error', 'Failed to attend report');
    }
  };

  // Resolve report
  const handleCompleteReport = async (id) => {
    try {
      const { data } = await axios.post(
        `${API_BASE}/reports/${id}/resolve/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      setReports(prev => prev.map(r => (r.id === id ? data : r)));
    } catch {
      Alert.alert('Error', 'Failed to mark report as resolved');
    }
  };

  // Handle phone dialing
  const handleDial = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'No phone number available');
      return;
    }
    
    Linking.openURL(`tel:${phoneNumber}`)
      .catch(() => Alert.alert('Error', 'Could not open dialer'));
  };

  // Filter logic
  const filterReports = () => {
    switch (selectedView) {
      case 'pending':
        return reports.filter(r => r.status === 'PENDING');
      case 'attended':
        return reports.filter(r => r.status === 'ATTENDED');
      case 'resolved':
        return reports.filter(r => r.status === 'RESOLVED');
      default:
        return reports;
    }
  };

  // Status badge info
  const getStatusInfo = status => {
    switch (status) {
      case 'PENDING':
        return { color: '#fbbc04', icon: 'schedule', text: 'Pending' };
      case 'ATTENDED':
        return { color: '#1a73e8', icon: 'person', text: 'Attended' };
      case 'RESOLVED':
        return { color: '#34a853', icon: 'check-circle', text: 'Resolved' };
      default:
        return { color: '#5f6368', icon: 'info', text: 'Unknown' };
    }
  };

  // Render each report card
  const renderReportItem = ({ item }) => {
    const { color, icon, text } = getStatusInfo(item.status);
    const createdAt = dayjs(item.created_at);
    const resolvedAt = item.resolved_at ? dayjs(item.resolved_at) : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.senderInfo}>
            <Icon name="person" size={20} color="#4e4f52" />
            <Text style={styles.senderName}>
              {item.employee_name}
            </Text>
            {item.employee_phone && (
              <TouchableOpacity 
                onPress={() => handleDial(item.employee_phone)}
                style={styles.dialButton}
              >
                <Icon name="phone" size={20} color="#4e4f52" />
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${color}22` }]}>
            <Icon name={icon} size={16} color={color} />
            <Text style={[styles.statusText, { color }]}>{text}</Text>
          </View>
        </View>

        <Text style={styles.message}>{item.message}</Text>

        <View style={styles.timestampsContainer}>
          <View style={styles.timestampRow}>
            <Icon name="schedule" size={14} color="#5f6368" />
            <Text style={styles.timestampText}>
              Reported at: {createdAt.format('MMM D, YYYY h:mm A')}
            </Text>
          </View>

          {item.attended_by_name && (
            <View style={styles.timestampRow}>
              <Icon name="person-pin" size={14} color="#1a73e8" />
              <Text style={styles.timestampText}>
                Attended by {item.attended_by_name}
              </Text>
            </View>
          )}

          {item.status === 'RESOLVED' && (
            <View style={styles.timestampRow}>
              <Icon name="check-circle" size={14} color="#34a853" />
              <Text style={styles.timestampText}>
                Resolved at:{' '}
                {resolvedAt?.format('MMM D, YYYY h:mm A') ||
                  dayjs(item.updated_at).format('MMM D, YYYY h:mm A')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.actions}>
            {item.status === 'PENDING' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAttendReport(item.id)}
              >
                <Text style={styles.actionText}>Attend</Text>
              </TouchableOpacity>
            )}
            {item.status === 'ATTENDED' &&
              item.attended_by === currentUser?.id &&  (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#34a853' }]}
                  onPress={() => handleCompleteReport(item.id)}
                >
                  <Text style={styles.actionText}>Mark Complete</Text>
                </TouchableOpacity>
              )}
          </View>
        </View>
      </View>
    );
  };

  const filtered = filterReports();
  const displayName =
    selectedView.charAt(0).toUpperCase() + selectedView.slice(1);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterWrapper}
        contentContainerStyle={styles.filterContainer}
      >
        {['all', 'pending', 'attended', 'resolved'].map(view => (
          <TouchableOpacity
            key={view}
            style={[
              styles.filterButton,
              selectedView === view && styles.activeFilterButton,
            ]}
            onPress={() => setSelectedView(view)}
          >
            <View style={styles.buttonContent}>
              <Text
                style={[
                  styles.filterButtonText,
                  selectedView === view && styles.activeFilterButtonText,
                ]}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </Text>
              
              {/* Badge for pending button */}
              {view === 'pending' && pendingCount > 0 && (
                <View style={[styles.countBadge, { backgroundColor: '#fbbc04' }]}>
                  <Text style={styles.countText}>{pendingCount}</Text>
                </View>
              )}
              
              {/* Badge for attended button */}
              {view === 'attended' && attendedCount > 0 && (
                <View style={[styles.countBadge, { backgroundColor: '#1a73e8' }]}>
                  <Text style={styles.countText}>{attendedCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={handleAddReport}>
          <Icon name="add" size={20} color="#1a73e8" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content area */}
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Icon name="error" size={24} color="#ea4335" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="info" size={48} color="#80868b" />
            <Text style={styles.emptyText}>
              {displayName === 'All'
                ? 'No reports found'
                : `No ${displayName.toLowerCase()} reports found`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id.toString()}
            renderItem={renderReportItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* New-report modal */}
      <Modal
        visible={isFormVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsFormVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Report Something:</Text>
            <TextInput
              style={styles.reportInput}
              multiline
              numberOfLines={5}
              placeholder="Describe your issue or report..."
              placeholderTextColor="#888"
              value={newReport}
              onChangeText={setNewReport}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsFormVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitNewReport}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterWrapper: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#dadce0',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterButton: {
    height: 38,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 11,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f1f3f4',
  },
  activeFilterButton: {
    backgroundColor: '#1a73e8',
  },
  filterButtonText: {
    color: '#5f6368',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  addButton: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 16,
    backgroundColor: '#f1f3f4',
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#1a73e8',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 3,
    padding: 10,
    paddingHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  senderName: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4e4f52',
  },
  dialButton: {
    marginLeft: 8,
    padding: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  statusText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  message: {
    fontSize: 28,
    color: '#3c4043',
    lineHeight: 35,
    marginBottom: 12,
  },
  timestampsContainer: {
    padding: 5,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timestampText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#5f6368',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    paddingTop: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginLeft: 8,
    color: '#ea4335',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#80868b',
  },
  listContent: {
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#8e9294',
  },
  submitButton: {
    backgroundColor: '#1a73e8',
  },
  buttonText: {
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    borderRadius: 10,
    height: 20,
    minWidth: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  countText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
});

export default ReportsComponent;