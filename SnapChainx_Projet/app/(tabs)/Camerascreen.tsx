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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X_API_KEY } from '../xapikey';
import { Slider } from '@react-native-assets/slider';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [friends, setFriends] = useState<
    { _id: string; username: string; profilePicture: string }[]
  >([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

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
        }
      } catch (err) {}
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

      setPhotoBase64(base64);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64);
    }
  };

  const resetPhoto = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
    setSelectedFriends([]);
  };

  const sendPhotoToFriends = async () => {
    if (!photoBase64 || selectedFriends.length === 0) return;

    setLoading(true);
    const token = await AsyncStorage.getItem('token');
    const apiKey = X_API_KEY;
    const userId = await AsyncStorage.getItem('userId');

    try {
      for (const friendId of selectedFriends) {
        const payload = {
          _id: userId,
          from: userId,
          to: friendId,
          image: `data:image/jpeg;base64,${photoBase64}`,
          date: new Date().toISOString(),
          duration,
        };

        const response = await fetch('https://snapchat.epihub.eu/snap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const result = await response.json();
          Alert.alert('Erreur', result?.message || 'Erreur envoi');
          setLoading(false);
          return;
        }
      }
      Alert.alert('Nova envoyé');
      resetPhoto();
    } catch (err) {
      Alert.alert('Erreur', 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const toggleCameraType = () => {
    setCameraType((prev) => (prev === 'back' ? 'front' : 'back'));
    console.log('Switch caméra !');
  };

  if (hasPermission === null) {
    return <View style={styles.center}><ActivityIndicator color="#fff" /></View>;
  }

  if (hasPermission === false) {
    return <View style={styles.center}><Text style={{ color: '#fff' }}>Pas d'accès à la caméra</Text></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {!photoBase64 ? (
        <>
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={toggleCameraType}
              style={{
                position: 'absolute',
                top: 52,
                right: 24,
                zIndex: 10,
                backgroundColor: '#18181bcc',
                borderRadius: 22,
                width: 44,
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#232323',
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-reverse-outline" size={26} color="#00cbff" />
            </TouchableOpacity>

            <CameraView
              ref={cameraRef}
              style={styles.camera}
              type={cameraType}
            />
            <View style={styles.cameraOverlay}>
              <View style={styles.snapControls}>
                <TouchableOpacity onPress={pickImage} style={styles.galleryButton}>
                  <Ionicons name="images-outline" size={32} color="#00cbff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={takePhoto} style={styles.snapButtonOuter}>
                  <View style={styles.snapButtonInner} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${photoBase64}` }}
            style={styles.previewImage}
          />
          <TouchableOpacity onPress={resetPhoto} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Reprendre</Text>
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: 16, marginBottom: 10 }]}>Envoyer à :</Text>
          <FlatList
            data={friends}
            horizontal
            keyExtractor={(item) => item._id}
            style={{ height: 70, marginBottom: 0 }}
            contentContainerStyle={{ gap: 12, marginBottom: 4, marginTop: 0, paddingHorizontal: 8 }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedFriends((prev) =>
                    prev.includes(item._id)
                      ? prev.filter(id => id !== item._id)
                      : [...prev, item._id]
                  );
                }}
                style={[
                  styles.friendItem,
                  selectedFriends.includes(item._id) && styles.friendItemActive,
                ]}
              >
                <Image
                  source={
                    item.profilePicture
                      ? { uri: item.profilePicture }
                      : require('@/assets/images/default-avatar.png')
                  }
                  style={styles.avatar}
                />
                <Text
                  style={[
                    styles.friendName,
                    selectedFriends.includes(item._id) && styles.friendNameActive,
                  ]}
                  numberOfLines={1}
                >
                  {item.username}
                </Text>
              </TouchableOpacity>
            )}
          />

          <View style={styles.pickerContainer}>
            <Text style={[styles.label, { marginBottom: 10 }]}>Durée du Nova :</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={duration}
                onValueChange={(itemValue) => setDuration(itemValue)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                dropdownIconColor="#00cbff"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                  <Picker.Item
                    key={value}
                    label={`${value} seconde${value > 1 ? 's' : ''}`}
                    value={value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (selectedFriends.length === 0 || loading) && { opacity: 0.5 },
            ]}
            onPress={sendPhotoToFriends}
            disabled={selectedFriends.length === 0 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Envoyer le Nova</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    margin: 10,
  },
  cameraOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  snapControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 38,
  },
  galleryButton: {
    backgroundColor: '#18181b',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#232323',
  },
  snapButtonOuter: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#a855f7',
    shadowColor: '#00cbff',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  snapButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#a855f7',
  },
  previewContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  novaSelected: {
    color: '#a855f7',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  previewImage: {
    width: '100%',
    height: 360,
    borderRadius: 14,
    marginBottom: 10,
  },
  cancelButton: {
    marginTop: 6,
    backgroundColor: '#222',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  label: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 10,
    fontSize: 15,
    alignSelf: 'flex-start',
  },
  friendItem: {
    alignItems: 'center',
    marginRight: 8,
    padding: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#18181b',
    width: 110,
    height: 70,
    justifyContent: 'center',
  },
  friendItemActive: {
    borderColor: '#00cbff',
    backgroundColor: '#232323',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 2,
    backgroundColor: '#232323',
  },
  friendName: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 100,
  },
  friendNameActive: {
    color: '#00cbff',
    fontWeight: 'bold',
  },
  pickerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 11,
  },
  pickerWrapper: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    width: 240,
    overflow: 'hidden',
  },
  picker: {
    height: 120,
    color: '#00cbff',
    width: '100%',
  },
  pickerItem: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sendButton: {
    backgroundColor: '#a855f7',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
