import { View, Text, StyleSheet, Image, Button, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import DeleteUser from '@/components/DeleteUser';
import UpdateUser from '@/components/UpdateUser';
import UpdateProfilePicture from '@/components/UpdateProfilePicture';

export default function Profile() {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const [name, mail, picture] = await Promise.all([
        AsyncStorage.getItem('username'),
        AsyncStorage.getItem('email'),
        AsyncStorage.getItem('profilePicture'),
      ]);
      setUsername(name);
      setEmail(mail);
      setProfilePicture(picture);
    })();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/Connexion');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#111' }} contentContainerStyle={styles.container}>
      {/* Section Profil utilisateur */}
      <View style={styles.profileBox}>
        {profilePicture ? (
          <Image source={{ uri: profilePicture }} style={styles.avatar} />
        ) : (
          <Image
            source={require('@/assets/images/default-avatar.png')}
            style={styles.avatar}
          />
        )}

        <Text style={styles.name}>{username}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      {/* Section Actions */}
      <View style={styles.actionsBox}>
        <Text style={styles.sectionTitle}>Actions sur le compte</Text>
        <UpdateProfilePicture onProfilePictureUpdated={setProfilePicture} />
        <UpdateUser onUsernameUpdated={setUsername} />
        <DeleteUser />
        <View style={styles.logoutButton}>
          <Button title="Se déconnecter" onPress={handleLogout} color="#ff4d4d" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 80,
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 20,
  },
  profileBox: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#555',
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  email: {
    fontSize: 16,
    color: '#fff',
  },
  actionsBox: {
    width: '100%',
    padding: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
