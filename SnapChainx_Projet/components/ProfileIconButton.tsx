import { useNavigation } from 'expo-router';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileIconButton() {
  const navigation = useNavigation();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const pic = await AsyncStorage.getItem('profilePicture');
      setProfilePicture(pic);
    })();
  }, []);

  return (
    <TouchableOpacity onPress={() => navigation.navigate('profile')} style={styles.button}>
      <Image
        source={
          profilePicture
            ? { uri: profilePicture }
            : require('@/assets/images/default-avatar.png')
        }
        style={styles.avatar}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {

  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#00cbff', 
  },
});
