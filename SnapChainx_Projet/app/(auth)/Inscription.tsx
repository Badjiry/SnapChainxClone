import { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X_API_KEY } from '../xapikey';

export default function Inscription() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    try {
      const res = await fetch('https://snapchat.epihub.eu/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': X_API_KEY,
        },
        body: JSON.stringify({
          email,
          username,
          password,
          profilePicture: '',
        }),
      });

      const json = await res.json();
      const token = json?.data?.token;

      if (res.ok) {
        Alert.alert('✅ Inscription réussie');
        if (token) {
          await AsyncStorage.setItem('token', token);
        }
        router.replace('/(auth)/Connexion');
      } else {
        Alert.alert('Erreur', json?.message || 'Inscription échouée');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer un compte');
    }
  };

  return (
    <View style={styles.screen}>
      
      <View style={styles.formContainer}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Nom d'utilisateur"
          placeholderTextColor="#aaa"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />
        <TextInput
          placeholder="Mot de passe"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <Pressable
          onPress={handleRegister}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Créer un compte</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 24,
    borderRadius: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#6b7280',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 18,
    borderRadius: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#a855f7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
});
