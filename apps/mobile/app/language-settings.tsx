import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { router } from 'expo-router';
import { TickCircle } from 'iconsax-react-native';

import { Button, Text } from '@/components/atoms';
import { ScreenTemplate } from '@/components/templates';
import { ms, mvs } from '@/utils/scaling';
import { useI18n, type LanguageCode } from '@/i18n';

export default function LanguageSettingsScreen() {
  const { theme } = useUnistyles();
  const { currentLanguage, changeLanguage, supportedLanguages } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(currentLanguage);
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageSelect = (languageCode: LanguageCode) => {
    setSelectedLanguage(languageCode);
  };

  const handleApplyLanguage = async () => {
    if (selectedLanguage === currentLanguage) {
      // No change needed
      router.back();
      return;
    }

    setIsChanging(true);

    try {
      await changeLanguage(selectedLanguage);

      // Show success message
      Alert.alert(
        'Language Changed',
        `Language has been changed to ${supportedLanguages.find((lang) => lang.code === selectedLanguage)?.name}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to change language:', error);
      Alert.alert('Error', 'Failed to change language. Please try again.');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <ScreenTemplate title="Language" showBackButton>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.description}>
            Select your preferred language for the app
          </Text>

          <View style={styles.languagesContainer}>
            {supportedLanguages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageCard,
                  selectedLanguage === language.code && {
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.primary + '10',
                  },
                ]}
                onPress={() => handleLanguageSelect(language.code)}
                activeOpacity={0.7}
              >
                <View style={styles.languageInfo}>
                  <Text variant="bodyMediumSemiBold" color="neutral800">
                    {language.name}
                  </Text>
                  <Text variant="bodySmallRegular" color="neutral600" style={styles.nativeName}>
                    {language.nativeName}
                  </Text>
                </View>

                {selectedLanguage === language.code && (
                  <TickCircle size={ms(24)} color={theme.colors.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text variant="bodySmallSemiBold" color="neutral800">
              Note:
            </Text>
            <Text variant="bodySmallRegular" color="neutral600" style={styles.infoText}>
              • Changing to Arabic will enable right-to-left (RTL) layout{'\n'}
              • The app may need to reload to apply some language changes{'\n'}
              • Translations are loaded from the server
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            variant="filled"
            color="primary"
            onPress={handleApplyLanguage}
            disabled={isChanging || selectedLanguage === currentLanguage}
          >
            {isChanging ? (
              <ActivityIndicator size="small" color={theme.colors.neutral0} />
            ) : (
              'Apply Language'
            )}
          </Button>
        </View>
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: mvs(100),
  },
  description: {
    marginBottom: theme.spacing.xl,
  },
  languagesContainer: {
    gap: theme.spacing.md,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.neutral200,
    backgroundColor: theme.colors.surface,
  },
  languageInfo: {
    flex: 1,
  },
  nativeName: {
    marginTop: theme.spacing.xs,
  },
  infoBox: {
    backgroundColor: theme.colors.primaryLight || theme.colors.primary + '10',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    marginTop: theme.spacing.xl,
  },
  infoText: {
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
  footer: {
    padding: theme.spacing.lg,
    paddingBottom: mvs(40),
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral200,
    backgroundColor: theme.colors.background,
  },
}));
