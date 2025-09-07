import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { Button, Card, Text } from '@rneui/themed';
import { supabase } from '../services/supabase';

export default function ConnectionTestWithUI() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count(*)')
        .limit(1);

      if (error) {
        throw error;
      }

      setIsConnected(true);
      Alert.alert('Success', 'Database connection successful!');
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setIsConnected(false);
      Alert.alert('Connection Failed', error.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card containerStyle={{ margin: 20, borderRadius: 10 }}>
      <Card.Title>Database Connection Test</Card.Title>
      <Card.Divider />
      
      <View style={{ marginBottom: 15 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Status: {' '}
          <Text style={{ 
            color: isConnected === null ? '#666' : isConnected ? '#4CAF50' : '#F44336' 
          }}>
            {isConnected === null ? 'Not tested' : isConnected ? 'Connected' : 'Failed'}
          </Text>
        </Text>
      </View>

      <Button
        title="Test Connection"
        onPress={testConnection}
        loading={isLoading}
        disabled={isLoading}
        buttonStyle={{ borderRadius: 8 }}
      />
    </Card>
  );
}
