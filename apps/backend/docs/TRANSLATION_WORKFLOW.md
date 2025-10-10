# Complete Translation Workflow Guide

This guide explains the entire translation process in the Airbnb clone application, from backend implementation to frontend integration.

## 🏗️ Architecture Overview

```
┌─────────────────┐    HTTP Request     ┌─────────────────┐
│   Frontend      │ ──────────────────► │   Backend       │
│   (React/Vue)   │                     │   (NestJS)      │
│                 │                     │                 │
│ • Detects lang  │                     │ • Language      │
│ • Sends headers │                     │   Detection     │
│ • Fetches       │                     │ • Translation   │
│   translations  │                     │   Processing    │
│ • Renders UI    │                     │ • Response      │
└─────────────────┘ ◄────────────────── │   Formatting    │
                         JSON Response   └─────────────────┘
```

## 🔄 Translation Flow Process

### 1. Language Detection (Backend)

When a request arrives, the backend detects the user's preferred language in this order:

```typescript
// 1. Query parameter (?lang=fr)
GET /api/users?lang=fr

// 2. Custom header (X-Language: ar) 
Headers: { "X-Language": "ar" }

// 3. Cookie (language=en)
Cookie: language=en

// 4. Accept-Language header (browser)
Headers: { "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8" }

// 5. Fallback to default
Default: "en"
```

**Implementation:** `LanguageDetectionMiddleware` processes every request and sets `req.language`.

### 2. Translation Processing (Backend)

The backend translates content using the detected language:

```typescript
// Automatic translation in responses
@Controller('auth')
export class AuthController {
  @Post('login')
  async login() {
    return {
      message: this.i18nService.translate('auth.login.success'), 
      // Translates to: "Login successful" (en), "Connexion réussie" (fr), "تم تسجيل الدخول بنجاح" (ar)
      data: { /* user data */ }
    };
  }
}
```

### 3. Response Transformation (Backend)

The `I18nTransformInterceptor` automatically enhances all responses with language metadata:

```json
{
  "status": "success",
  "message": "Connexion réussie",
  "data": { /* actual data */ },
  "meta": {
    "language": "fr",
    "direction": "ltr", 
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Frontend Integration

The frontend consumes the translated content and additional translation APIs.

## 🔧 Backend Translation Implementation

### Translation File Structure

```
src/i18n/
├── en/
│   ├── common.json      # Shared translations
│   ├── auth.json        # Authentication
│   └── storage.json     # File operations
├── fr/
│   ├── common.json
│   ├── auth.json
│   └── storage.json
└── ar/
    ├── common.json
    ├── auth.json
    └── storage.json
```

### Translation Files Content

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

// src/i18n/fr/auth.json  
{
  "login": {
    "title": "Se connecter",
    "success": "Connexion réussie",
    "failed": "Identifiants invalides"
  }
}

// src/i18n/ar/auth.json
{
  "login": {
    "title": "تسجيل الدخول",
    "success": "تم تسجيل الدخول بنجاح", 
    "failed": "بيانات اعتماد غير صحيحة"
  }
}
```

### Backend Translation Usage

#### 1. Direct Translation in Controllers

```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly i18nService: I18nService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto);
      
      return {
        message: this.i18nService.translate('auth.login.success'),
        data: result
      };
    } catch (error) {
      throw new UnauthorizedException(
        this.i18nService.translate('auth.login.failed')
      );
    }
  }
}
```

#### 2. Translation with Variables

```typescript
// Translation file: "Welcome back, {{name}}!"
const message = this.i18nService.translate('auth.welcome', {
  args: { name: user.firstName }
});
// Result: "Welcome back, John!" / "Bienvenue, John !" / "أهلاً بعودتك، John!"
```

#### 3. Validation Error Translation

```typescript
// Validation errors are automatically translated
@IsEmail({}, { 
  message: 'common.validation.email' // Auto-translated to current language
})
email: string;
```

## 📡 Translation APIs for Frontend

### 1. Get All Translations

```javascript
// Fetch all translations for current language
GET /api/i18n/translations?lang=fr

// Response
{
  "status": "success",
  "data": {
    "language": "fr",
    "direction": "ltr",
    "dateFormat": "DD/MM/YYYY",
    "currency": { "currency": "EUR", "locale": "fr-FR" },
    "translations": {
      "common": { /* all common translations */ },
      "auth": { /* all auth translations */ }
    }
  }
}
```

### 2. Get Specific Namespace

```javascript
// Fetch only auth translations
GET /api/i18n/translations/auth?lang=ar

// Response
{
  "status": "success", 
  "data": {
    "namespace": "auth",
    "language": "ar",
    "translations": {
      "login": {
        "title": "تسجيل الدخول",
        "success": "تم تسجيل الدخول بنجاح"
      }
    }
  }
}
```

### 3. Get Supported Languages

```javascript
GET /api/i18n/languages

// Response
{
  "status": "success",
  "data": {
    "current": "en",
    "default": "en", 
    "supported": [
      { "code": "en", "name": "English", "direction": "ltr" },
      { "code": "fr", "name": "Français", "direction": "ltr" },
      { "code": "ar", "name": "العربية", "direction": "rtl" }
    ]
  }
}
```

### 4. Translate Specific Key

```javascript
GET /api/i18n/translate/auth.login.title?lang=fr

// Response
{
  "status": "success",
  "data": {
    "key": "auth.login.title",
    "language": "fr", 
    "translation": "Se connecter"
  }
}
```

## 🎨 Frontend Implementation Examples

### React Implementation

#### 1. Translation Hook

```typescript
// hooks/useTranslations.ts
import { useState, useEffect } from 'react';

interface TranslationData {
  [namespace: string]: Record<string, any>;
}

interface LanguageInfo {
  language: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
}

export const useTranslations = (language: string = 'en') => {
  const [translations, setTranslations] = useState<TranslationData>({});
  const [languageInfo, setLanguageInfo] = useState<LanguageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        setLoading(true);
        
        // Fetch all translations
        const response = await fetch(`/api/i18n/translations?lang=${language}`, {
          headers: {
            'X-Language': language,
            'Accept-Language': language
          }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
          setTranslations(data.data.translations);
          setLanguageInfo({
            language: data.data.language,
            direction: data.data.direction, 
            dateFormat: data.data.dateFormat
          });
        }
      } catch (error) {
        console.error('Failed to fetch translations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTranslations();
  }, [language]);

  const t = (key: string, variables?: Record<string, string>) => {
    const keys = key.split('.');
    let value = translations;
    
    // Navigate through nested object
    for (const k of keys) {
      value = value?.[k];
      if (!value) return key; // Fallback to key if not found
    }
    
    let result = value as string;
    
    // Replace variables {{variable}}
    if (variables) {
      Object.entries(variables).forEach(([key, val]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), val);
      });
    }
    
    return result;
  };

  return { t, languageInfo, loading, translations };
};
```

#### 2. Language Context Provider

```typescript
// contexts/LanguageContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  supportedLanguages: Array<{ code: string; name: string; direction: string }>;
  t: (key: string, variables?: Record<string, string>) => string;
  direction: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Get language from localStorage, URL, or browser
    return localStorage.getItem('language') || 
           new URL(window.location.href).searchParams.get('lang') ||
           navigator.language.split('-')[0] || 
           'en';
  });
  
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const { t, languageInfo } = useTranslations(currentLanguage);

  useEffect(() => {
    // Fetch supported languages
    fetch('/api/i18n/languages')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setSupportedLanguages(data.data.supported);
        }
      });
  }, []);

  useEffect(() => {
    // Update document direction and language
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = languageInfo?.direction || 'ltr';
    
    // Save to localStorage
    localStorage.setItem('language', currentLanguage);
    
    // Set cookie for backend
    document.cookie = `language=${currentLanguage}; path=/; max-age=31536000`;
  }, [currentLanguage, languageInfo]);

  const setLanguage = (lang: string) => {
    setCurrentLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      supportedLanguages,
      t,
      direction: languageInfo?.direction || 'ltr'
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
```

#### 3. Component Usage

```typescript
// components/LoginForm.tsx
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LoginForm: React.FC = () => {
  const { t, direction, currentLanguage } = useLanguage();

  return (
    <div className={`login-form ${direction}`}>
      <h1>{t('auth.login.title')}</h1>
      
      <form>
        <div className="form-group">
          <label>{t('auth.fields.email')}</label>
          <input 
            type="email" 
            placeholder={t('auth.fields.email')}
            dir={direction}
          />
        </div>
        
        <div className="form-group">
          <label>{t('auth.fields.password')}</label>
          <input 
            type="password" 
            placeholder={t('auth.fields.password')}
            dir={direction}
          />
        </div>
        
        <button type="submit">
          {t('auth.login.title')}
        </button>
      </form>
      
      {/* Welcome message with user name */}
      <p>{t('auth.welcome', { name: 'John' })}</p>
    </div>
  );
};
```

#### 4. Language Switcher

```typescript
// components/LanguageSwitcher.tsx
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, setLanguage, supportedLanguages } = useLanguage();

  return (
    <div className="language-switcher">
      <select 
        value={currentLanguage} 
        onChange={(e) => setLanguage(e.target.value)}
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};
```

### Vue.js Implementation

#### 1. Translation Plugin

```typescript
// plugins/i18n.ts
import { App } from 'vue';

interface TranslationPlugin {
  install: (app: App) => void;
}

export const createI18n = (defaultLanguage = 'en'): TranslationPlugin => {
  return {
    install(app: App) {
      const translations = ref({});
      const currentLanguage = ref(defaultLanguage);
      const languageInfo = ref(null);

      const loadTranslations = async (lang: string) => {
        try {
          const response = await fetch(`/api/i18n/translations?lang=${lang}`);
          const data = await response.json();
          
          if (data.status === 'success') {
            translations.value = data.data.translations;
            languageInfo.value = data.data;
          }
        } catch (error) {
          console.error('Failed to load translations:', error);
        }
      };

      const t = (key: string, variables?: Record<string, string>) => {
        const keys = key.split('.');
        let value = translations.value;
        
        for (const k of keys) {
          value = value?.[k];
          if (!value) return key;
        }
        
        let result = value as string;
        
        if (variables) {
          Object.entries(variables).forEach(([key, val]) => {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), val);
          });
        }
        
        return result;
      };

      const setLanguage = async (lang: string) => {
        currentLanguage.value = lang;
        await loadTranslations(lang);
        
        // Update document
        document.documentElement.lang = lang;
        document.documentElement.dir = languageInfo.value?.direction || 'ltr';
      };

      // Load initial translations
      loadTranslations(defaultLanguage);

      app.config.globalProperties.$t = t;
      app.config.globalProperties.$setLanguage = setLanguage;
      app.config.globalProperties.$currentLanguage = currentLanguage;
      
      app.provide('i18n', { t, setLanguage, currentLanguage, languageInfo });
    }
  };
};
```

#### 2. Vue Component Usage

```vue
<!-- components/LoginForm.vue -->
<template>
  <div :class="['login-form', languageInfo?.direction]">
    <h1>{{ $t('auth.login.title') }}</h1>
    
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label>{{ $t('auth.fields.email') }}</label>
        <input 
          v-model="email"
          type="email" 
          :placeholder="$t('auth.fields.email')"
          :dir="languageInfo?.direction"
        />
      </div>
      
      <div class="form-group">
        <label>{{ $t('auth.fields.password') }}</label>
        <input 
          v-model="password"
          type="password" 
          :placeholder="$t('auth.fields.password')"
          :dir="languageInfo?.direction"
        />
      </div>
      
      <button type="submit">
        {{ $t('auth.login.title') }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue';

const { languageInfo } = inject('i18n');
const email = ref('');
const password = ref('');

const handleLogin = async () => {
  // Login logic with automatic language headers
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Language': languageInfo.value?.language
    },
    body: JSON.stringify({
      email: email.value,
      password: password.value
    })
  });
  
  const result = await response.json();
  // Result will contain translated success/error messages
};
</script>
```

## 🎯 RTL (Right-to-Left) Support

### CSS Styling for RTL

```css
/* styles/i18n.css */
.login-form {
  direction: ltr;
  text-align: left;
}

.login-form.rtl {
  direction: rtl;
  text-align: right;
}

/* Logical properties for RTL support */
.form-group {
  margin-inline-start: 16px;
  padding-inline-end: 8px;
}

/* RTL-aware animations */
.slide-enter {
  transform: translateX(-100%);
}

.rtl .slide-enter {
  transform: translateX(100%);
}

/* RTL typography for Arabic */
.rtl {
  font-family: 'Amiri', 'Noto Sans Arabic', 'Arial', sans-serif;
  line-height: 1.6;
}
```

## 🔍 Best Practices

### 1. Translation Key Naming

```typescript
// ✅ Good - Hierarchical and descriptive
'auth.login.success'
'common.validation.email'
'storage.upload.failed'

// ❌ Bad - Flat and unclear
'loginSuccess'
'emailError'
'uploadFail'
```

### 2. Handling Missing Translations

```typescript
// Backend - Always provide fallbacks
const message = this.i18nService.translate('custom.key', {
  defaultValue: 'Default message if translation missing',
  args: { name: user.name }
});

// Frontend - Fallback to key or default language
const t = (key: string) => {
  return translations[key] || fallbackTranslations[key] || key;
};
```

### 3. API Request Headers

```typescript
// Always send language preference headers
const apiCall = async (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      'X-Language': currentLanguage,
      'Accept-Language': currentLanguage,
      ...options.headers
    }
  });
};
```

### 4. Error Handling

```typescript
// Backend - Translated error responses
try {
  // ... some operation
} catch (error) {
  throw new BadRequestException(
    this.i18nService.translate('storage.upload.failed', {
      args: { maxSize: '10MB' }
    })
  );
}

// Frontend - Display translated errors
const handleError = (error: any) => {
  const message = error.response?.data?.message || t('common.messages.internalError');
  showNotification(message, 'error');
};
```

## 🚀 Performance Optimization

### 1. Translation Caching

```typescript
// Frontend - Cache translations in localStorage
const TranslationCache = {
  get: (language: string) => {
    const cached = localStorage.getItem(`translations_${language}`);
    return cached ? JSON.parse(cached) : null;
  },
  
  set: (language: string, data: any) => {
    localStorage.setItem(`translations_${language}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  },
  
  isValid: (language: string, maxAge = 24 * 60 * 60 * 1000) => { // 24 hours
    const cached = TranslationCache.get(language);
    return cached && (Date.now() - cached.timestamp) < maxAge;
  }
};
```

### 2. Lazy Loading

```typescript
// Load translations on demand
const loadNamespace = async (namespace: string) => {
  if (!loadedNamespaces.has(namespace)) {
    const response = await fetch(`/api/i18n/translations/${namespace}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      translations.value[namespace] = data.data.translations;
      loadedNamespaces.add(namespace);
    }
  }
};
```

## 🔄 Development Workflow

### 1. Adding New Translations

1. **Add to translation files**:
```json
// src/i18n/en/feature.json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

2. **Add to translation constants**:
```typescript
// src/common/constants/translation-keys.ts
export const TRANSLATION_KEYS = {
  // ... existing keys
  FEATURE: {
    NEW_FEATURE: {
      TITLE: 'feature.newFeature.title',
      DESCRIPTION: 'feature.newFeature.description'
    }
  }
} as const;
```

3. **Use in backend**:
```typescript
const title = this.i18nService.translate(TRANSLATION_KEYS.FEATURE.NEW_FEATURE.TITLE);
```

4. **Use in frontend**:
```typescript
const title = t('feature.newFeature.title');
```

### 2. Translation Management

- **Development**: Use English as base language
- **Translation**: Send translation files to translators
- **Review**: Native speakers review translations
- **Testing**: Test with different languages
- **Deployment**: Deploy with all language files

This comprehensive system ensures seamless multilingual support across your entire Airbnb clone application! 🌍