import React, { useRef, useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, Platform, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';

// Adjust this to your production URL when deployed
const FRONTEND_URL = 'https://seewhylive.com';
// Use process.env.EXPO_PUBLIC_WEB_URL or fallback
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || FRONTEND_URL;

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Handle Android hardware back button
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      const backAction = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => backHandler.remove();
    }
  }, [canGoBack]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        style={styles.webview}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        // Critical for WebRTC (VDO.Ninja) on mobile webviews
        originWhitelist={['*']}
        allowsAirPlayForMediaPlayback={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19', // Matches brand background
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
