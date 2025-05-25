import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router'; 
import { X_API_KEY } from '../app/xapikey';

export default function DeleteUserAccount() {
  const router = useRouter();

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Confirmation',
      'Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
              Alert.alert('Erreur', 'Token introuvable. Veuillez vous reconnecter.');
              return;
            }

            try {
              const response = await fetch('https://snapchat.epihub.eu/user', {
                method: 'DELETE',
                headers: {
                  'x-api-key': X_API_KEY,
                  'Authorization': `Bearer ${token}`,
                },
              });

              const data = await response.json();

              if (response.ok && data.success) {
                await AsyncStorage.removeItem('token');
                Alert.alert('Compte supprimé', 'Ton compte a bien été supprimé.');
                router.replace('/Connexion');
              } else {
                Alert.alert('Erreur', data.data || 'Échec de la suppression.');
              }
            } catch (error) {
              console.error(error);
              Alert.alert('Erreur', 'Une erreur est survenue pendant la suppression.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleDeleteAccount}>
        <Text style={styles.buttonText}>Supprimer mon compte</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  button: {
    backgroundColor: '#e63946',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
