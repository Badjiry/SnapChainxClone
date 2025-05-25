import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X_API_KEY } from './xapikey';

export default function GalleryScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [friends, setFriends] = useState<
    { _id: string; username: string; profilePicture: string }[]
  >([]);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setHasPermission(false);
        Alert.alert('Permission refusée', 'Impossible d’accéder à la galerie.');
        return;
      }
      setHasPermission(true);

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 50,
        sortBy: [['creationTime', false]],
      });

      const promises = media.assets.map((asset) => MediaLibrary.getAssetInfoAsync(asset.id));
      const results = await Promise.all(promises);
      const uris = results
        .map(info => info.localUri)
        .filter((uri): uri is string => uri !== undefined && uri.startsWith('file://'));
      setImageUris(uris);

      const token = await AsyncStorage.getItem('token');
      const res = await fetch('https://snapchat.epihub.eu/user/friends', {
        method: 'GET',
        headers: {
          'x-api-key': X_API_KEY,
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) setFriends(json.data);
    })();
  }, []);

  const sendImageToFriend = async (uri: string, friendId: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const sizeKB = (base64.length * 3) / 4 / 1024;
    if (sizeKB > 800) {
      Alert.alert('Image trop lourde', 'Choisis une image plus légère.');
      return;
    }

    const token = await AsyncStorage.getItem('token');
    const userId = await AsyncStorage.getItem('userId');

    const payload = {
      _id: userId,
      from: userId,
      to: friendId,
      image: `data:image/jpeg;base64,${base64}`,
      date: new Date().toISOString(),
      duration: 5,
    };

    try {
      const res = await fetch('https://snapchat.epihub.eu/snap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': X_API_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        Alert.alert('✅ Snap envoyé !');
      } else {
        const error = await res.text();
        console.error('Erreur envoi snap :', error);
      }
    } catch (err) {
      console.error('Erreur réseau :', err);
    }
  };

  const handleSelectImage = (uri: string) => {
    Alert.alert('Envoyer à...', 'Choisis un ami :',
      friends.map(friend => ({
        text: friend.username,
        onPress: () => sendImageToFriend(uri, friend._id),
      }))
    );
  };

  if (hasPermission === false) {
    return <Text style={styles.centerText}>Pas d'accès à la galerie</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {imageUris.map((uri, index) => (
        <TouchableOpacity key={index} onPress={() => handleSelectImage(uri)}>
          <Image source={{ uri }} style={styles.image} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'center',
  },
  image: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
  centerText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
  },
});
