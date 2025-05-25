import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import 'moment/locale/fr';
import { X_API_KEY } from '../xapikey';
import { useRouter } from 'expo-router';
import { getUserInfo } from '@/utils/userStorage';

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
  snapId: string;
}

export default function Snaps() {
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [activeSnap, setActiveSnap] = useState<ActiveSnap | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [hasSnapBeenSeen, setHasSnapBeenSeen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ userId: string; userEmail: string; username: string; profilePicture: string } | null>(null); 
  
  const router = useRouter();


  useEffect(() => {
    getUserInfo().then(setUserInfo);
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/Connexion');
  };

  const handleSnapPress = async (snapId: string) => {
    if (activeSnap) return; 

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
        setActiveSnap({ image: data.data.image, duration, snapId });
        setRemainingTime(duration);
        setHasSnapBeenSeen(false);

        let counter = duration;
        const countdown = setInterval(() => {
          counter--;
          setRemainingTime(counter);
          if (counter <= 0) {
            clearInterval(countdown);
          }
        }, 1000);

        setTimeout(async () => {
          if (!hasSnapBeenSeen) {
            setHasSnapBeenSeen(true);
            await fetch(`https://snapchat.epihub.eu/snap/seen/${snapId}`, {
              method: 'PUT',
              headers: { Authorization: `Bearer ${token}`, 'x-api-key': X_API_KEY },
            });
            setSnaps((prevSnaps) => prevSnaps.filter((snap) => snap._id !== snapId));
          }
          setActiveSnap(null);
          setRemainingTime(null);
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
    interval = setInterval(fetchSnaps, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCloseSnap = async () => {
    if (!activeSnap) return;
    if (!hasSnapBeenSeen) {
      const token = await AsyncStorage.getItem('token');
      await fetch(`https://snapchat.epihub.eu/snap/seen/${activeSnap.snapId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'x-api-key': X_API_KEY },
      });
      setHasSnapBeenSeen(true);
      setSnaps((prevSnaps) =>
        prevSnaps.filter((snap) => snap._id !== activeSnap.snapId)
      );
    }
    setActiveSnap(null);
    setRemainingTime(null);
  };


  return (
    snaps.length === 0 ? (
      <ImageBackground
        source={require('@/assets/images/fluxnova.jpg')}
        style={styles.backgroundImage}
        imageStyle={{ resizeMode: 'cover' }}
      >
        <View style={styles.backgroundContent}>
          <Text style={styles.title}>Flux Nova</Text>
          <Text style={styles.emptyText}>
            Ton flux Nova est vide pour l'instant
          </Text>
        </View>
      </ImageBackground>
    ) : (
      <View style={styles.container}>
        <Text style={styles.title}>Flux Nova</Text>
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
                <View style={styles.snapTextGroup}>
                  <Text style={styles.name}>
                    {item.fromUser?.username || 'Utilisateur inconnu'}
                  </Text>
                  <View style={styles.novaRow}>
                    <Image
                      source={require('@/assets/images/nova-icon.png')}
                      style={styles.novaIcon}
                    />
                    <Text style={styles.novaText}>Nova en attente</Text>
                  </View>
                </View>
                <Text style={styles.time}>{moment(item.date).fromNow()}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
        {activeSnap && (
          <TouchableWithoutFeedback onPress={handleCloseSnap}>
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
          </TouchableWithoutFeedback>
        )}
      </View>
    )
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 50,
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start', 
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  title: {
    fontSize: 26,
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#00cbff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    fontWeight: 'bold',
  },
  snapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#18181b', 
    shadowColor: '#a855f7',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#27272a', 
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#232323',
    borderWidth: 2,
    borderColor: '#a855f7',
  },
  snapTextGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff', 
    marginBottom: 2,
  },
  novaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  novaIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
    tintColor: '#a855f7',
  },
  novaText: {
    color: '#a855f7',
    fontWeight: '600',
    fontSize: 13,
  },
  time: {
    marginLeft: 'auto',
    color: '#aaa',
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
