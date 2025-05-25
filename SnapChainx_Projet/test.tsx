import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import 'moment/locale/fr';
import { X_API_KEY } from '../xapikey';
import { useRouter } from 'expo-router';

moment.locale('fr');

interface Snap {
  _id: string;
  from: string;
  date: string;
  fromUser: {
    username: string;
    profilePicture: string;
  };
}

interface User {
  _id: string;
  username: string;
  profilePicture: string;
}

interface ActiveSnap {
  image: string;
  duration: number;
}

export default function Snaps() {
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [activeSnap, setActiveSnap] = useState<ActiveSnap | null>(null);
  const router = useRouter();
  const [remainingTime, setRemainingTime] = useState<number | null>(null);


  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/Connexion');
  };

const handleSnapPress = async (snapId: string) => {
  const token = await AsyncStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`https://snapchat.epihub.eu/snap/${snapId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'x-api-key': X_API_KEY },
    });

    const data = await response.json();
    if (response.ok && data.data?.image && data.data?.duration) {
      const duration = data.data.duration;
      setActiveSnap({ image: data.data.image, duration });
      setRemainingTime(duration);

      let counter = duration;
      const countdown = setInterval(() => {
        counter--;
        setRemainingTime(counter);
        if (counter <= 0) {
          clearInterval(countdown);
        }
      }, 1000);

      setTimeout(async () => {
        clearInterval(countdown);
        setActiveSnap(null);
        setRemainingTime(null);

        await fetch(`https://snapchat.epihub.eu/snap/seen/${snapId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'x-api-key': X_API_KEY },
        });

        setSnaps((prevSnaps) => prevSnaps.filter((snap) => snap._id !== snapId));
      }, duration * 1000);
    } else {
      console.error('Erreur récupération snap :', data);
    }
  } catch (error) {
    console.error('Erreur :', error);
  }
};

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchSnaps = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      try {
        const [snapRes, usersRes] = await Promise.all([
          fetch('https://snapchat.epihub.eu/snap', {
            headers: {
              'x-api-key': X_API_KEY,
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch('https://snapchat.epihub.eu/user', {
            headers: {
              'x-api-key': X_API_KEY,
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const snapData = await snapRes.json();
        const usersData = await usersRes.json();

        if (!snapRes.ok || !usersRes.ok) {
          console.error('Erreur snap ou user', snapData, usersData);
          return;
        }

        const usersMap = new Map(
          usersData.data.map((user: any) => [user._id, user])
        );

        const enrichedSnaps = snapData.data.map((snap: any) => ({
          ...snap,
          fromUser: usersMap.get(snap.from) || {
            username: 'Utilisateur inconnu',
            profilePicture: '',
          },
        }));

        setSnaps(enrichedSnaps);
      } catch (error) {
        console.error('Erreur fetch snaps ou users:', error);
      }
    };

    fetchSnaps();
    interval = setInterval(fetchSnaps, 10000); 

    return () => clearInterval(interval);
  }, []);

  return (
  <View style={styles.container}>
    <Button title="Se déconnecter" onPress={handleLogout} />

    <Text style={styles.title}>Snaps reçus</Text>

    {snaps.length === 0 ? (
      <Text style={styles.emptyText}>Aucun snap reçu</Text>
    ) : (
      <FlatList
          data={[...snaps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
          keyExtractor={(item) => item._id} 
        renderItem={({ item }) => (
          
          <TouchableOpacity onPress={() => handleSnapPress(item._id)}>
            <View style={styles.snapItem}>
              <Image
                source={
                  item.fromUser?.profilePicture
                    ? { uri: item.fromUser.profilePicture }
                    : require('@/assets/images/default-avatar.png')
                }
                style={styles.avatar}
              />
              <View>
                <Text style={styles.name}>
                  {item.fromUser && item.fromUser.username
                    ? item.fromUser.username
                    : 'Utilisateur inconnu'}
                </Text>
                <Text style={styles.newSnap}>🟥 Nouveau Snap</Text>
              </View>
              <Text style={styles.time}>
                {moment(item.date).fromNow()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    )}

    {activeSnap && (
      <View style={styles.snapOverlay}>
        <Image
          source={{ uri: activeSnap.image }}
          style={styles.snapImage}
          resizeMode="contain"
        />
        {remainingTime !== null && (
          <Text style={styles.timerText}>{remainingTime}</Text>
        )}
      </View>
    )}
  </View>
);

}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 50,
    flex: 1,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  snapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  newSnap: {
    color: 'red',
    fontWeight: 'bold',
  },
  time: {
    marginLeft: 'auto',
    color: '#888',
    fontSize: 12,
  },
  snapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  snapImage: {
    width: '100%',
    height: '100%',
  },
  timerText: {
    position: 'absolute',
    top: 40,
    right: 20,
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
});
