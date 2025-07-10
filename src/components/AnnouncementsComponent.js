import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../App';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNotifications } from './NotificationContext';

const API_BASE = 'https://www.teamkonekt.com';

const AnnouncementsComponent = () => {
  const { token } = useContext(AuthContext);
  const { incrementNotification } = useNotifications();

  const [announcements, setAnnouncements] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [employeeProfileId, setEmployeeProfileId] = useState(null);
  const [lastChecked, setLastChecked] = useState(new Date());

  const [formData, setFormData] = useState({ title: '', content: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const userRes = await axios.get(`${API_BASE}/auth/user/`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        setIsManager(userRes.data.is_manager);
        if (userRes.data.employee_profile_id) {
          setEmployeeProfileId(userRes.data.employee_profile_id);
        }

        const annRes = await axios.get(`${API_BASE}/announcements/?page=${currentPage}`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        setAnnouncements(prev => 
          currentPage === 1 ? annRes.data.results : [...prev, ...annRes.data.results]
        );
        setTotalPages(annRes.data.total_pages);
        setError('');

        // Check for new announcements since last checked
        if (currentPage === 1) {
          const newAnnouncements = annRes.data.results.filter(ann => 
            new Date(ann.created_at) > new Date(lastChecked)
          );
          if (newAnnouncements.length > 0) {
            incrementNotification('announcements');
          }
          setLastChecked(new Date());
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load announcements');
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    };

    fetchData();
  }, [token, currentPage]);

  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      setCurrentPage(prev => prev + 1);
      setIsLoadingMore(true);
    }
  };

  const reloadAnnouncements = async () => {
    try {
      setCurrentPage(1);
      const annRes = await axios.get(`${API_BASE}/announcements/?page=1`, {
        headers: { Authorization: `Token ${token}` }
      });
      setAnnouncements(annRes.data.results);
      setTotalPages(annRes.data.total_pages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      Alert.alert('Validation', 'Please fill in both title and content.');
      return;
    }
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Token ${token}` } };

      if (isEditing && editId) {
        await axios.put(`${API_BASE}/announcements/${editId}/`, formData, config);
      } else {
        await axios.post(`${API_BASE}/announcements/`, formData, config);
      }

      setFormData({ title: '', content: '' });
      setIsEditing(false);
      setEditId(null);
      setShowForm(false);
      await reloadAnnouncements();
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ann) => {
    setFormData({ title: ann.title, content: ann.content });
    setIsEditing(true);
    setEditId(ann.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/announcements/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setAnnouncements(anns => anns.filter(a => a.id !== id));
      if (announcements.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to delete announcement');
    } finally {
      setLoading(false);
    }
  };

  const markAsNoted = async (announcementId) => {
    try {
      await axios.post(
        `${API_BASE}/announcements/${announcementId}/mark_noted/`,
        { employee_id: employeeProfileId },
        { headers: { Authorization: `Token ${token}` } }
      );
      
      setAnnouncements(prev => prev.map(ann => {
        if (ann.id === announcementId) {
          const alreadyNoted = ann.noted_by?.includes(employeeProfileId);
          if (!alreadyNoted) {
            return {
              ...ann,
              noted_by: [...(ann.noted_by || []), employeeProfileId],
              noted_count: (ann.noted_count || 0) + 1
            };
          }
        }
        return ann;
      }));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to mark as noted');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.cardContent}>{item.content}</Text>
      
      <View style={styles.cardFooter}>
        {!isManager && employeeProfileId && (
          <View style={styles.notedStatusContainer}>
            {item.noted_by?.includes(employeeProfileId) ? (
              <View style={styles.notedStatus}>
                <Icon name="check-circle" size={20} color="#4caf50" />
                <Text style={styles.notedStatusText}>Noted</Text>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => markAsNoted(item.id)}
                style={styles.notedButton}
              >
                <Icon name="radio-button-unchecked" size={20} color="#fff" />
                <Text style={styles.notedButtonText}>Mark as Noted</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <View style={styles.notedCountContainer}>
          <Icon name="people" size={18} color="#666" />
          <Text style={styles.notedCountText}>
            {item.noted_count || 0} noted
          </Text>
        </View>
      </View>
      
      {isManager && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
            <Icon name="edit" size={20} color="#1a73e8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
            <Icon name="delete" size={20} color="#c62828" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" style={{ marginVertical: 20 }} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isManager && (
        <>
          {!isEditing && !showForm && (
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              style={styles.newButton}
            >
              <Icon name="add" size={24} color="white" />
              <Text style={styles.newButtonText}>New Announcement</Text>
            </TouchableOpacity>
          )}

          {(isEditing || showForm) && (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor="#999"
                value={formData.title}
                onChangeText={t => setFormData(fd => ({ ...fd, title: t }))}
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Content"
                placeholderTextColor="#999"
                multiline
                value={formData.content}
                onChangeText={t => setFormData(fd => ({ ...fd, content: t }))}
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setIsEditing(false);
                    setEditId(null);
                    setFormData({ title: '', content: '' });
                    setShowForm(false);
                  }}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
                  <Text style={styles.submitText}>
                    {isEditing ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      <FlatList
        data={announcements}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={!loading && (
          <View style={styles.emptyContainer}>
            <Icon name="announcement" size={60} color="#ddd" />
            <Text style={styles.emptyText}>No announcements yet</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => 
          isLoadingMore && <ActivityIndicator size="small" style={{ marginVertical: 10 }} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 2, backgroundColor: '#f8f9fa' },
  error: { 
    color: '#c62828', 
    textAlign: 'center', 
    marginBottom: 12,
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 6
  },
  form: { 
    marginBottom: 20, 
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 12,
    elevation: 2
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: '#333',
    fontSize: 16,
    backgroundColor: 'white'
  },
  textarea: { 
    height: 120, 
    textAlignVertical: 'top' 
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  submitBtn: { 
    backgroundColor: '#1a73e8', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center',
    minWidth: 100
  },
  submitText: { 
    color: 'white', 
    fontWeight: 'bold',
    fontSize: 16
  },
  cancelBtn: { 
    backgroundColor: '#f5f5f5', 
    padding: 12, 
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center' 
  },
  cancelText: { 
    color: '#666',
    fontSize: 16
  },
  newButton: {
    backgroundColor: '#1a73e8',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  newButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10
  },
  card: { 
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 16, 
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center'
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1a237e',
    flex: 1
  },
  cardDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10
  },
  cardContent: { 
    color: '#3c4043', 
    marginBottom: 16,
    fontSize: 28,
    lineHeight: 35,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8
  },
  notedStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  notedStatus: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  notedStatusText: {
    color: '#4caf50',
    marginLeft: 6,
    fontWeight: '500'
  },
  notedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  notedButtonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '500'
  },
  notedCountContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  notedCountText: {
    color: '#666',
    marginLeft: 5
  },
  actions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10
  },
  editBtn: { 
    marginRight: 20,
    padding: 5
  },
  deleteBtn: { 
    padding: 5
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 10, 
    color: '#666',
    fontSize: 16
  }
});

export default AnnouncementsComponent;