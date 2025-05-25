import { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X_API_KEY } from '../app/xapikey';

type User = {
  _id: string;
  username: string;
  profilePicture: string;
};

type Props = {
  onFriendAdded?: () => void;
};

export default function AddFriend({ onFriendAdded }: Props) {
  const [search, setSearch] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);

  const handleSearch = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('https://snapchat.epihub.eu/user', {
        headers: {
          'x-api-key': X_API_KEY,
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      const list = json?.data;

      const match = list.find(
        (u: User) => u.username.toLowerCase().includes(search.toLowerCase())
      );

      if (match) {
        setFoundUser(match);
      } else {
        setFoundUser(null);
        Alert.alert('Utilisateur non trouvé');
      }
    } catch (err) {
      console.error('Erreur lors de la recherche', err);
    }
  };

  const handleAdd = async () => {
    if (!foundUser?._id) return;

    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('https://snapchat.epihub.eu/user/friends', {
        method: 'POST',
        headers: {
          'x-api-key': X_API_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendId: foundUser._id }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert('✅ Ami ajouté !');
        setSearch('');
        setFoundUser(null);
        onFriendAdded?.();
      } else {
        Alert.alert('Erreur', data?.message || 'Impossible d\'ajouter cet ami');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ajouter un NovaFriend</Text>

      <TextInput
        placeholder="Nom d'utilisateur"
        placeholderTextColor="#666"
        value={search}
        onChangeText={setSearch}
        style={styles.input}
      />
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.searchButtonText}>Rechercher</Text>
      </TouchableOpacity>

      {foundUser && (
        <View style={styles.result}>
          <Image
            source={
              foundUser.profilePicture
                ? { uri: foundUser.profilePicture }
                : require('@/assets/images/default-avatar.png')
            }
            style={styles.avatar}
          />
          <Text style={styles.username}>{foundUser.username}</Text>
          <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
            <Text style={styles.plus}>＋</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    padding: 18,
    backgroundColor: '#111',
    borderRadius: 14,
    shadowColor: '#00cbff',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
    color: '#00cbff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    color: '#fff',
    backgroundColor: '#1e1e1e',
  },
  searchButton: {
    backgroundColor: '#00cbff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  searchButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#232323',
  },
  username: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#00cbff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  plus: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
