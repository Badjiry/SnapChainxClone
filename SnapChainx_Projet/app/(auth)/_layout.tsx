import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter, usePathname, Slot } from 'expo-router';

export default function AuthLayout() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.screen}>
      <View style={styles.logoWrapper}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.content}>
        <Slot />
      </View>

      <View style={styles.tabBar}>
        <Pressable onPress={() => router.replace('/(auth)/Connexion')} style={styles.tabButton}>
          <Text style={[styles.tabText, pathname.includes('Connexion') && styles.active]}>
            Connexion
          </Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/(auth)/Inscription')} style={styles.tabButton}>
          <Text style={[styles.tabText, pathname.includes('Inscription') && styles.active]}>
            Inscription
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 200, 
  },
  logoWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 90, 
  },
  logo: {
    width: 260,
    height: 260,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
  },
  tabBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 95, 
    backgroundColor: 'rgba(20,20,20,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#333',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 30,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    color: '#aaa',
    fontSize: 17, 
    fontWeight: '500',
  },
  active: {
    color: '#a855f7',
    fontWeight: 'bold',
  },
});


