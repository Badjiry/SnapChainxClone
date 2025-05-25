import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X_API_KEY } from './xapikey';

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [friends, setFriends] = useState<
    { _id: string; username: string; profilePicture: string }[]
  >([]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      const savedBase64 = await AsyncStorage.getItem('lastPhoto');
      if (savedBase64) {
        setPhotoBase64(savedBase64);
      }

      const fetchFriends = async () => {
        const token = await AsyncStorage.getItem('token');
        const apiKey = X_API_KEY;

        try {
          const res = await fetch('https://snapchat.epihub.eu/user/friends', {
            method: 'GET',
            headers: {
              'x-api-key': apiKey,
              Authorization: `Bearer ${token}`,
            },
          });

          const json = await res.json();
          if (res.ok && Array.isArray(json.data)) {
            setFriends(json.data);
          } else {
            console.error('Erreur API /user/friends :', json);
          }
        } catch (err) {
          console.error('Erreur fetch /user/friends :', err);
        }
      };

      fetchFriends();
    })();
  }, []);

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        skipProcessing: true,
      });

      setPhotoUri(photo.uri);

      const base64 = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const sizeKB = (base64.length * 3) / 4 / 1024;
      console.log('Taille image encodée :', sizeKB.toFixed(1), 'KB');

      if (sizeKB > 800) {
        Alert.alert('Image trop lourde');
        return;
      }

      setPhotoBase64(base64);
      await AsyncStorage.setItem('lastPhoto', base64);

      Alert.alert('Photo prise !', 'Souhaitez-vous enregistrer cette photo dans votre galerie ?', [
        {
          text: 'Non',
          style: 'cancel',
        },
        {
          text: 'Oui',
          onPress: async () => {
            const permission = await MediaLibrary.requestPermissionsAsync();
            if (permission.status === 'granted') {
              try {
                await MediaLibrary.saveToLibraryAsync(photo.uri);
                Alert.alert('✅ Enregistrée dans la galerie');
              } catch (err) {
                console.error('Erreur enregistrement galerie :', err);
              }
            } else {
              Alert.alert('Permission refusée');
            }
          },
        },
      ]);
    }
  };

  const sendPhotoToFriend = async (friendId: string) => {
    if (!photoBase64) return;

    const token = await AsyncStorage.getItem('token');
    const apiKey = X_API_KEY;
    const userId = await AsyncStorage.getItem('userId');

    const payload = {
      _id: userId,
      from: userId,
      to: friendId,
      image: `data:image/jpeg;base64,${photoBase64}`,
      date: new Date().toISOString(),
      duration: 5,
    };

    try {
      const response = await fetch('https://snapchat.epihub.eu/snap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        if (response.ok) {
          Alert.alert('✅ Snap envoyé !');
        } else {
          console.error('Erreur envoi image :', result);
        }
      } else {
        const text = await response.text();
        console.error('Réponse non-JSON :', text.slice(0, 200));
      }
    } catch (err) {
      console.error('Erreur réseau :', err);
    }
  };

  const resetPhoto = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
    AsyncStorage.removeItem('lastPhoto');
  };

  if (hasPermission === null) {
    return <View style={styles.center}><Text>Demande de permission...</Text></View>;
  }

  if (hasPermission === false) {
    return <View style={styles.center}><Text>Pas d'accès à la caméra</Text></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      {!photoBase64 ? (
        <>
          <CameraView ref={cameraRef} style={styles.camera} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={takePhoto}>
              <Text style={styles.buttonText}>📸</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={() => router.push('/GalleryScreen')}>
              <Text style={styles.buttonText}>🖼️ Galerie</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${photoBase64}` }}
            style={styles.previewImage}
          />
          <TouchableOpacity onPress={resetPhoto} style={styles.button}>
            <Text style={styles.buttonText}>Reprendre</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 18, marginVertical: 10 }}>Envoyer à :</Text>
          <FlatList
            data={friends}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => sendPhotoToFriend(item._id)}
                style={styles.friendItem}
              >
                <Image
                  source={
                    item.profilePicture
                      ? { uri: item.profilePicture }
                      : require('@/assets/images/default-avatar.png')
                  }
                  style={styles.avatar}
                />
                <Text>{item.username}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#ffffffcc',
    padding: 20,
    borderRadius: 50,
  },
  buttonText: {
    fontSize: 24,
  },
  previewContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '50%',
    resizeMode: 'contain',
    marginBottom: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    width: '100%',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

