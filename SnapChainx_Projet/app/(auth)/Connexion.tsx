import { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X_API_KEY } from '../xapikey';

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const res = await fetch('https://snapchat.epihub.eu/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': X_API_KEY,
        },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      const data = json?.data;
      const token = data?.token;

      if (res.ok && token) {
        await AsyncStorage.multiSet([
          ['token', token],
          ['userId', data._id],
          ['userEmail', data.email],
          ['username', data.username],
          ['profilePicture', data.profilePicture || ''],
        ]);
        router.replace('/(tabs)/Camerascreen');
      } else {
        Alert.alert('Erreur', json?.message || 'Identifiants incorrects');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de se connecter au serveur');
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
          placeholder="Mot de passe"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <Pressable
          onPress={handleLogin}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Se connecter</Text>
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
    backdropFilter: 'blur(8px)', // Ne fonctionne que sur web, mais pas d'erreur sur mobile
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
