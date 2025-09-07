import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { testSupabaseConnection } from '../services/supabase';

export default function ConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Not tested');
  const [isLoading, setIsLoading] = useState(false);

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const result = await testSupabaseConnection();
      
      if (result.success) {
        setConnectionStatus(`✅ ${result.message}`);
        Alert.alert('Success', result.message);
      } else {
        setConnectionStatus(`❌ ${result.error}`);
        Alert.alert('Connection Failed', result.error);
      }
    } catch (error) {
      setConnectionStatus('❌ Test failed');
      Alert.alert('Error', 'Failed to test connection');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-test on component mount
  useEffect(() => {
    handleTestConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Connection Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={styles.statusText}>{connectionStatus}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleTestConnection}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Connection'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        This will test if your app can connect to Supabase.{'\n'}
        If tables don't exist yet, that's normal - run the migrations first.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    flex: 1,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
