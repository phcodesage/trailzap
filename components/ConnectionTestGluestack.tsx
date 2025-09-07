import React, { useState } from 'react';
import { Alert } from 'react-native';
import {
  Box,
  Button,
  ButtonText,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
} from '@gluestack-ui/themed';
import { supabase } from '../services/supabase';

export default function ConnectionTestGluestack() {
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

  const getStatusColor = () => {
    if (isConnected === null) return '$gray600';
    return isConnected ? '$green600' : '$red600';
  };

  const getStatusText = () => {
    if (isConnected === null) return 'Not tested';
    return isConnected ? 'Connected' : 'Failed';
  };

  return (
    <Box p="$5">
      <Card p="$6" borderRadius="$lg" backgroundColor="$white" shadowColor="$gray300" shadowOffset={{ width: 0, height: 2 }} shadowOpacity={0.1} shadowRadius={4}>
        <VStack space="md">
          <Heading size="lg" textAlign="center">
            Database Connection Test
          </Heading>
          
          <HStack space="sm" alignItems="center">
            <Text size="md" fontWeight="$semibold">
              Status:
            </Text>
            <Text size="md" color={getStatusColor()}>
              {getStatusText()}
            </Text>
          </HStack>

          <Button
            onPress={testConnection}
            isDisabled={isLoading}
            backgroundColor="$blue600"
            borderRadius="$md"
            $active-backgroundColor="$blue700"
          >
            {isLoading ? (
              <HStack space="sm" alignItems="center">
                <Spinner color="$white" size="small" />
                <ButtonText color="$white">Testing...</ButtonText>
              </HStack>
            ) : (
              <ButtonText color="$white">Test Connection</ButtonText>
            )}
          </Button>
        </VStack>
      </Card>
    </Box>
  );
}
