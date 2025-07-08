import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../App';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNotifications } from './NotificationContext';

const API_BASE = 'https://www.teamkonekt.com/api/suggestions/';

const STATUS_STYLES = {
  UNREAD:   { text: '#c62828', bg: '#ffebee' },
  READ:     { text: '#1a73e8', bg: '#e3f2fd' },
  ARCHIVED: { text: '#6c757d', bg: '#e2e3e5' },
};

const SuggestionBoxComponent = () => {
  const { token, userType } = useContext(AuthContext);
  const { incrementNotification } = useNotifications();
  const [suggestions, setSuggestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchSuggestions = async (page = 1) => {
    try {
      page === 1 ? setLoading(true) : setIsLoadingMore(true);
      setError('');
      
      let url = `${API_BASE}?page=${page}`;
      
      if (userType === 'employee') {
        url += '&my_suggestions=true';
      }
      
      const resp = await axios.get(url, {
        headers: { Authorization: `Token ${token}` }
      });
      
      setSuggestions(prev => 
        page === 1 ? resp.data.results : [...prev, ...resp.data.results]
      );
      setTotalPages(resp.data.total_pages);

      // Update notifications if there are new unread suggestions
      if (userType === 'manager' && page === 1) {
        const unreadCount = resp.data.results.filter(
          s => s.status === 'UNREAD'
        ).length;
        if (unreadCount > 0) {
          incrementNotification('suggestions', unreadCount);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchSuggestions(currentPage);
  }, [token, currentPage]);

  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await fetchSuggestions(1);
    setRefreshing(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(
        `${API_BASE}${id}/`,
        { status: newStatus },
        { headers: { Authorization: `Token ${token}` } }
      );
      
      // Update local state immediately
      setSuggestions(s =>
        s.map(item =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not update status.');
    }
  };

  const submitSuggestion = async () => {
    if (!newSuggestion.trim()) {
      Alert.alert('Validation', 'Suggestion cannot be empty');
      return;
    }
    
    try {
      await axios.post(
        API_BASE,
        { message: newSuggestion },
        { headers: { Authorization: `Token ${token}` } }
      );
      
      setNewSuggestion('');
      setShowForm(false);
      Keyboard.dismiss();
      Alert.alert('Success', 'Suggestion submitted!');
      
      setCurrentPage(1);
      await fetchSuggestions(1);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to submit suggestion');
    }
  };

  const renderItem = ({ item }) => {
    const st = STATUS_STYLES[item.status] || {};
    const date = new Date(item.created_at);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: st.text }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.text }]}>{item.status}</Text>
          </View>
          <Text style={styles.dateText}>{`${dateStr} ${timeStr}`}</Text>
        </View>
        
        <Text style={styles.messageText}>{item.message}</Text>
        
        {userType === 'manager' && item.status === 'UNREAD' && (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.statusButton, styles.activeStatusButton]} 
              onPress={() => handleStatusChange(item.id, 'READ')}
            >
              <Text style={styles.activeStatusButtonText}>Mark as Read</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return <ActivityIndicator size="small" style={{ marginVertical: 10 }} />;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <FlatList
        data={suggestions}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={
          <>
            {loading && <ActivityIndicator size="large" style={{ marginVertical: 20 }} />}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {userType === 'employee' && (
              <>
                {!showForm && (
                  <TouchableOpacity
                    onPress={() => setShowForm(true)}
                    style={styles.newButton}
                  >
                    <Icon name="add" size={24} color="white" />
                    <Text style={styles.newButtonText}>New Suggestion</Text>
                  </TouchableOpacity>
                )}

                {showForm && (
                  <View style={styles.form}>
                    <TextInput
                      style={[styles.input, styles.textarea]}
                      placeholder="Share your suggestion..."
                      placeholderTextColor="#999"
                      multiline
                      value={newSuggestion}
                      onChangeText={setNewSuggestion}
                      numberOfLines={4}
                    />
                    <View style={styles.formButtons}>
                      <TouchableOpacity
                        onPress={() => {
                          setShowForm(false);
                          Keyboard.dismiss();
                        }}
                        style={styles.cancelBtn}
                      >
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={submitSuggestion} style={styles.submitBtn}>
                        <Text style={styles.submitText}>Submit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        }
        ListEmptyComponent={!loading && (
          <View style={styles.emptyContainer}>
            <Icon name="lightbulb-outline" size={60} color="#ddd" />
            <Text style={styles.emptyText}>
              {userType === 'manager' 
                ? 'No suggestions found' 
                : 'You have not submitted any suggestions yet'}
            </Text>
          </View>
        )}
        keyboardShouldPersistTaps="handled"
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  error: { 
    color: '#c62828', 
    textAlign: 'center', 
    marginBottom: 12,
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 6,
    marginHorizontal: 16
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 10, 
    color: '#666',
    fontSize: 16
  },
  form: { 
    marginBottom: 20, 
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 12,
    elevation: 2,
    marginHorizontal: 16
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
    justifyContent: 'center',
    marginHorizontal: 16
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
    elevation: 2,
    marginHorizontal: 16
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center'
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14
  },
  dateText: {
    fontSize: 12,
    color: '#666'
  },
  messageText: { 
    color: '#3c4043', 
    marginBottom: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 1,
    marginTop: 8
  },
  statusButton: {
    padding: 5,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  activeStatusButton: {
    backgroundColor: '#1a73e8',
  },
  activeStatusButtonText: {
    color: 'white',
  }
});

export default SuggestionBoxComponent;