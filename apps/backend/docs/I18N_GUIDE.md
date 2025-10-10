# Internationalization (i18n) Guide

This guide explains how to use the comprehensive internationalization system implemented in this Airbnb clone backend.

## Overview

The i18n system provides:
- **Multi-language support** for English (en), French (fr), and Arabic (ar)
- **Automatic language detection** from headers, query params, and cookies
- **RTL/LTR support** with proper text direction handling
- **Translation APIs** for frontend consumption
- **Type-safe translation keys** with TypeScript constants
- **Localized validation messages** with proper error handling
- **Cultural adaptations** including date, number, and currency formatting

## Quick Start

### 1. Language Detection

The system automatically detects user language from multiple sources in order of preference:

1. **Query parameter**: `?lang=fr`
2. **Custom header**: `X-Language: ar`
3. **Cookie**: `language=en`
4. **Accept-Language header**: Browser preferences
5. **Fallback**: Default language (en)

### 2. Using Translations in Controllers

```typescript
import { Controller, Get } from '@nestjs/common';
import { I18nService } from '../modules/i18n/services/i18n.service';
import { TRANSLATION_KEYS } from '../common/constants/translation-keys';

@Controller('auth')
export class AuthController {
  constructor(private readonly i18nService: I18nService) {}

  @Post('login')
  async login() {
    // ... login logic
    
    return {
      status: 'success',
      message: this.i18nService.translate(TRANSLATION_KEYS.AUTH.LOGIN.SUCCESS),
      data: { /* user data */ }
    };
  }
}
```

### 3. Translation with Arguments

```typescript
// With interpolation arguments
const message = this.i18nService.translate(
  TRANSLATION_KEYS.COMMON.VALIDATION.MIN_LENGTH,
  { args: { min: 8 } }
);
// Result: "Must be at least 8 characters long"
```

### 4. Frontend Translation APIs

Get all translations for current language:
```bash
GET /api/i18n/translations?lang=fr
```

Get specific namespace translations:
```bash
GET /api/i18n/translations/auth?lang=ar
```

Get supported languages:
```bash
GET /api/i18n/languages
```

## Advanced Usage

### RTL Language Support

The system includes comprehensive RTL support for Arabic and other right-to-left languages:

```typescript
import { RtlSupportHelper } from '../common/helpers/rtl-support.helper';

// Check if language is RTL
const isRtl = RtlSupportHelper.isRtlLanguage('ar'); // true

// Get text direction
const direction = RtlSupportHelper.getTextDirection('ar'); // 'rtl'

// Get CSS properties for RTL
const cssProps = RtlSupportHelper.getRtlCssProperties('ar');
// { direction: 'rtl', textAlign: 'right' }

// Format numbers for RTL languages
const arabicNum = RtlSupportHelper.formatNumberForRtl(123, 'ar'); // '١٢٣'
```

### Custom Validation Messages

Create localized validation messages:

```typescript
// In your DTO
export class LoginDto {
  @IsEmail({}, { 
    message: 'validation.email.invalid' // This will be auto-translated
  })
  email: string;
}

// The system will automatically translate validation errors
```

### Adding New Languages

1. **Create translation files**:
   ```bash
   mkdir src/i18n/es
   touch src/i18n/es/common.json
   touch src/i18n/es/auth.json
   ```

2. **Update configuration**:
   ```bash
   # .env
   I18N_SUPPORTED_LANGUAGES=en,fr,ar,es
   ```

3. **Add language metadata**:
   ```typescript
   // In I18nController
   const languageNames: Record<string, string> = {
     en: 'English',
     fr: 'Français', 
     ar: 'العربية',
     es: 'Español', // Add new language
   };
   ```

### Translation File Structure

Translations are organized by namespace:

```json
// src/i18n/en/auth.json
{
  "login": {
    "title": "Sign In",
    "success": "Login successful",
    "failed": "Invalid credentials"
  },
  "register": {
    "title": "Create Account",
    "success": "Registration successful"
  }
}
```

```json
// src/i18n/fr/auth.json  
{
  "login": {
    "title": "Se connecter",
    "success": "Connexion réussie",
    "failed": "Identifiants invalides"
  }
}
```

### Type-Safe Translation Keys

Use the provided constants for type safety:

```typescript
import { TRANSLATION_KEYS } from '../common/constants/translation-keys';

// Type-safe translation keys
const key = TRANSLATION_KEYS.AUTH.LOGIN.SUCCESS; // 'auth.login.success'

// TypeScript will autocomplete and validate keys
this.i18nService.translate(TRANSLATION_KEYS.AUTH.LOGIN.SUCCESS);
```

## API Reference

### I18nService Methods

| Method | Description | Example |
|--------|-------------|---------|
| `translate(key, options?)` | Translate a key for current language | `translate('auth.login.success')` |
| `translateFor(key, lang, args?)` | Translate for specific language | `translateFor('auth.login.success', 'fr')` |
| `getTranslations(namespace, lang?)` | Get all translations for namespace | `getTranslations('auth', 'ar')` |
| `getCurrentLanguage()` | Get current request language | `getCurrentLanguage()` |
| `getSupportedLanguages()` | Get array of supported languages | `['en', 'fr', 'ar']` |
| `isLanguageSupported(lang)` | Check if language is supported | `isLanguageSupported('es')` |
| `getLanguageDirection(lang?)` | Get text direction for language | `getLanguageDirection('ar') // 'rtl'` |
| `formatCurrency(value, lang?)` | Format currency for locale | `formatCurrency(99.99, 'fr')` |
| `formatDate(date, lang?)` | Format date for locale | `formatDate(new Date(), 'ar')` |

### Translation Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/i18n/translations` | GET | Get all translations for current/specified language |
| `/i18n/translations/:namespace` | GET | Get translations for specific namespace |
| `/i18n/languages` | GET | Get supported languages with metadata |
| `/i18n/translate/:key` | GET | Translate specific key |
| `/i18n/context` | GET | Get current language context |

### Language Detection Headers

The system sets response headers for client-side usage:

| Header | Description | Example |
|--------|-------------|---------|
| `Content-Language` | Current language | `ar` |
| `X-Language-Direction` | Text direction | `rtl` |
| `X-Supported-Languages` | Available languages | `en,fr,ar` |

## Best Practices

### 1. Consistent Key Naming

Use descriptive, hierarchical keys:
```typescript
// Good
TRANSLATION_KEYS.AUTH.LOGIN.SUCCESS
TRANSLATION_KEYS.COMMON.VALIDATION.EMAIL

// Avoid
'loginSuccess'
'emailError'
```

### 2. Handle Missing Translations

Always provide fallback values:
```typescript
this.i18nService.translate('custom.key', {
  defaultValue: 'Fallback message',
  args: { name: 'User' }
});
```

### 3. Use Interpolation for Dynamic Content

```typescript
// Translation file
{
  "welcome": "Welcome back, {{name}}!"
}

// Usage
this.i18nService.translate('welcome', {
  args: { name: user.firstName }
});
```

### 4. Consider Cultural Context

- Use appropriate date formats for each locale
- Consider cultural differences in greetings and formality
- Use local currency and number formats
- Respect RTL reading patterns in Arabic

### 5. Frontend Integration

For React/Vue/Angular apps, consume the translation APIs:

```typescript
// Frontend example (React)
const useTranslations = (namespace: string) => {
  const [translations, setTranslations] = useState({});
  
  useEffect(() => {
    fetch(`/api/i18n/translations/${namespace}?lang=${currentLang}`)
      .then(res => res.json())
      .then(data => setTranslations(data.data.translations));
  }, [namespace, currentLang]);
  
  return translations;
};
```

## Testing i18n

### Test Different Languages

```bash
# Test Arabic
curl -H "X-Language: ar" http://localhost:3000/api/auth/login

# Test with query param
curl http://localhost:3000/api/i18n/translations?lang=fr

# Test Accept-Language header
curl -H "Accept-Language: fr-FR,fr;q=0.9,en;q=0.8" http://localhost:3000/api/i18n/context
```

### Verify RTL Support

```bash
# Check RTL language detection
curl -H "X-Language: ar" http://localhost:3000/api/i18n/context

# Should return:
{
  "data": {
    "language": "ar",
    "direction": "rtl",
    "isSupported": true
  }
}
```

## Troubleshooting

### Common Issues

1. **Missing translations**: Check that translation files exist and keys are correct
2. **RTL layout issues**: Ensure proper CSS direction properties are applied
3. **Language not detected**: Verify headers are being sent correctly
4. **Validation messages not translated**: Check that validation pipe is properly configured

### Debug Mode

Enable i18n debugging in development:
```bash
# .env.development
I18N_DEBUG=true
```

This will log translation attempts and missing keys to help with debugging.

## Performance Considerations

- Translation files are loaded once at startup
- Translations are cached in memory
- Language detection happens once per request
- Consider using a CDN for serving translation files in large deployments

## Security

- All translation inputs are sanitized
- No user input is directly interpolated into translations
- Translation keys are validated against known constants
- File access is restricted to designated translation directories

This comprehensive i18n system ensures your Airbnb clone can serve users worldwide with proper language support and cultural adaptations.