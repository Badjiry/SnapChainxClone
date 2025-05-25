import React from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname, Slot } from 'expo-router';
import ProfileIconButton from '@/components/ProfileIconButton';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function CustomTabsLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => pathname.includes(route);
  const hideTopBar = pathname.includes('Camerascreen');

  return (
    <View style={styles.container}>
      {!hideTopBar && (
        <View style={styles.topBar}>
          <ProfileIconButton />
          <Text style={styles.title}>NovaChain</Text>
          <View style={{ width: 28 }} /> 
        </View>
      )}

      <View style={styles.content}>
        <Slot />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => router.replace('/snaps')} style={styles.tab}>
          <Image
            source={require('@/assets/images/nova-icon.png')}
            style={[
              styles.icon,
              isActive('snaps') && styles.activeOverlay
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/Camerascreen')} style={styles.tab}>
          <IconSymbol
            size={28}
            name="camera.fill"
            color={isActive('Camerascreen') ? '#a855f7' : '#888'}
            style={isActive('Camerascreen') ? styles.activeOverlay : styles.icon}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/friends')} style={styles.tab}>
          <IconSymbol
            size={28}
            name="person.2.fill"
            color={isActive('friends') ? '#a855f7' : '#888'}
            style={isActive('friends') ? styles.activeOverlay : styles.icon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    height: 100,
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingTop: 40,  
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: '#222',
    borderBottomWidth: 1,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    height: 60,
    backgroundColor: '#111',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopColor: '#222',
    borderTopWidth: 1,
    paddingBottom: 14,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  icon: {
    width: 28,
    height: 28,
    opacity: 0.4,
  },
  activeOverlay: {
    opacity: 1,
  }
});