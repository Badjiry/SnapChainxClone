import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddFriend from '@/components/AddFriend';
import { X_API_KEY } from '../xapikey';

export default function Friends() {
  const [friends, setFriends] = useState<
    { _id: string; username: string; profilePicture: string }[]
  >([]);

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
        console.error('Erreur API /friends :', json);
      }
    } catch (err) {
      console.error('Erreur fetch /friends :', err);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleDeleteFriend = (friendId: string) => {
    Alert.alert(
      'Supprimer cet ami',
      'Es-tu sûr de vouloir supprimer cet ami ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            try {
              const res = await fetch('https://snapchat.epihub.eu/user/friends', {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': X_API_KEY,
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ friendId }),
              });

              const data = await res.json();

              if (res.ok) {
                setFriends((prev) => prev.filter((friend) => friend._id !== friendId));
              } else {
                Alert.alert('Erreur', data?.message || 'Impossible de supprimer cet ami.');
              }
            } catch (err) {
              Alert.alert('Erreur', 'Une erreur est survenue.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AddFriend onFriendAdded={fetchFriends} />
      <Text style={styles.title}>NovaFriends</Text>

      {friends.length === 0 ? (
        <Text style={styles.emptyText}>Tu n'as pas encore de NovaFriend 🫥</Text>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.friendItem}>
              <Image
                source={
                  item.profilePicture
                    ? { uri: item.profilePicture }
                    : require('@/assets/images/default-avatar.png')
                }
                style={styles.avatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.username}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteFriend(item._id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteIcon}>×</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 30,
    backgroundColor: '#000',
    flex: 1,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#00cbff',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    padding: 12,
    backgroundColor: '#18181b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#232323',
  },
  emptyText: {
    marginTop: 40,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  deleteButton: {
    backgroundColor: '#888',
    width: 22,
    height: 22,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 14,
    textAlign: 'center',
  },
});