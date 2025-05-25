import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUserInfo = async () => {
  try {
    const [[, userId], [, userEmail], [, username], [, profilePicture]] =
      await AsyncStorage.multiGet(['userId', 'userEmail', 'username', 'profilePicture']);
    return {
      userId,
      userEmail,
      username,
      profilePicture,
    };
  } catch (error) {
    console.error('Erreur récupération infos utilisateur', error);
    return null;
  }
};