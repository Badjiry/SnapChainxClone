import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X_API_KEY } from '../app/xapikey';

export default function UpdateProfilePicture({ onProfilePictureUpdated }: { onProfilePictureUpdated?: (uri: string) => void }) {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      setImageBase64(result.assets[0].base64);
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!imageBase64) return;
    setLoading(true);
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await fetch('https://snapchat.epihub.eu/user', {
        method: 'PATCH',
        headers: {
          'x-api-key': X_API_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profilePicture: `data:image/jpeg;base64,${imageBase64}`,
        }),
      });
      if (!res.ok) {
        const rawResponse = await res.text();
        Alert.alert('Erreur', `Erreur ${res.status} : ${rawResponse}`);
        return;
      }
      // Mets à jour AsyncStorage
      await AsyncStorage.setItem('profilePicture', `data:image/jpeg;base64,${imageBase64}`);
      // Informe le parent
      if (onProfilePictureUpdated) {
        onProfilePictureUpdated(`data:image/jpeg;base64,${imageBase64}`);
      }
      Alert.alert('Succès', 'Photo de profil mise à jour !');
      setImageBase64(null);
      setImageUri(null);
    } catch (err) {
      Alert.alert('Erreur', 'Échec de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!imageUri ? (
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Changer ma photo de profil</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <TouchableOpacity
            style={styles.button}
            onPress={handleUpload}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Mettre à jour</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 10,
    marginTop: 50,
    alignItems: 'center',
  },
  preview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00cbff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    minWidth: 180,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
