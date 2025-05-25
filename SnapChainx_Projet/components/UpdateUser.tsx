import { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X_API_KEY } from '../app/xapikey';

type User = {
  username: string;
};

export default function UpdateUser({ onUsernameUpdated }: { onUsernameUpdated?: (username: string) => void }) {
  const [update, setUpdate] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);

  const handleUpdate = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    try {
      const bodyContent = JSON.stringify({ username: update });

      const res = await fetch('https://snapchat.epihub.eu/user', {
        method: 'PATCH',
        headers: {
          'x-api-key': X_API_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: bodyContent,
      });

      const rawResponse = await res.text(); 
      console.log('Réponse brute:', rawResponse);

      if (!res.ok) {
        Alert.alert('Erreur', `Erreur ${res.status} : ${rawResponse}`);
        return;
      }

      const json = JSON.parse(rawResponse);
      setFoundUser(json);
      if (onUsernameUpdated) {
        onUsernameUpdated(json.username);
      }
      Alert.alert('Succès', 'Nom d’utilisateur mis à jour !');
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nouveau nom d'utilisateur :</Text>
      <TextInput
        style={styles.input}
        placeholder="Entrez le nouveau nom"
        placeholderTextColor="#aaa"
        value={update}
        onChangeText={setUpdate}
      />
      <Button title="Mettre à jour" onPress={handleUpdate} color="" />

      {foundUser && (
        <Text style={styles.success}>
          Nouveau nom : {foundUser.username}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 50,
    backgroundColor: '#111',
    borderRadius: 12,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#666',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    color: '#fff',
    backgroundColor: '#222',
  },
  success: {
    marginTop: 20,
    color: '#4CAF50',
    fontSize: 16,
  },
});
