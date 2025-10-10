/**
 * RTL (Right-to-Left) language support utilities
 * Provides helper functions for handling RTL languages like Arabic
 */

export class RtlSupportHelper {
  // RTL languages that are supported
  private static readonly RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'ku', 'ps'];

  // Weak RTL characters that should be handled specially
  private static readonly RTL_WEAK_CHARS =
    /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF]/;

  /**
   * Check if a language code is RTL
   */
  static isRtlLanguage(langCode: string): boolean {
    return this.RTL_LANGUAGES.includes(langCode.toLowerCase());
  }

  /**
   * Get text direction for a language
   */
  static getTextDirection(langCode: string): 'ltr' | 'rtl' {
    return this.isRtlLanguage(langCode) ? 'rtl' : 'ltr';
  }

  /**
   * Check if text contains RTL characters
   */
  static containsRtlCharacters(text: string): boolean {
    return this.RTL_WEAK_CHARS.test(text);
  }

  /**
   * Apply proper text alignment based on content
   */
  static getTextAlignment(text: string, langCode: string): 'left' | 'right' | 'center' {
    if (this.containsRtlCharacters(text) || this.isRtlLanguage(langCode)) {
      return 'right';
    }
    return 'left';
  }

  /**
   * Format number for RTL languages (some use different numerals)
   */
  static formatNumberForRtl(num: number, langCode: string): string {
    if (!this.isRtlLanguage(langCode)) {
      return num.toString();
    }

    // For Arabic, use Arabic-Indic numerals in some contexts
    if (langCode === 'ar') {
      const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return num.toString().replace(/[0-9]/g, (digit) => arabicNumerals[parseInt(digit, 10)]);
    }

    return num.toString();
  }

  /**
   * Get CSS properties for RTL support
   */
  static getRtlCssProperties(langCode: string): Record<string, string> {
    const isRtl = this.isRtlLanguage(langCode);

    return {
      direction: isRtl ? 'rtl' : 'ltr',
      textAlign: isRtl ? 'right' : 'left',
      // Add more CSS properties as needed for your UI framework
    };
  }

  /**
   * Transform logical properties for RTL
   * Converts start/end to left/right based on text direction
   */
  static transformLogicalProperty(
    property:
      | 'margin-start'
      | 'margin-end'
      | 'padding-start'
      | 'padding-end'
      | 'border-start'
      | 'border-end',
    langCode: string,
  ): string {
    const isRtl = this.isRtlLanguage(langCode);
    const [prefix, suffix] = property.split('-');

    if (suffix === 'start') {
      return `${prefix}-${isRtl ? 'right' : 'left'}`;
    } else if (suffix === 'end') {
      return `${prefix}-${isRtl ? 'left' : 'right'}`;
    }

    return property;
  }

  /**
   * Format date considering RTL layout
   */
  static formatDateForRtl(date: Date, langCode: string): string {
    const isRtl = this.isRtlLanguage(langCode);

    // For RTL languages, you might want different date formats
    if (isRtl) {
      // Use RTL-friendly date format
      return new Intl.DateTimeFormat(langCode, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        calendar: langCode === 'ar' ? 'islamic' : undefined, // Use Islamic calendar for Arabic if desired
      }).format(date);
    }

    return new Intl.DateTimeFormat(langCode).format(date);
  }

  /**
   * Get appropriate font stack for RTL languages
   */
  static getFontStackForLanguage(langCode: string): string {
    const fontStacks: Record<string, string> = {
      ar: '"Amiri", "Noto Sans Arabic", "Arabic Typesetting", "Times New Roman", serif',
      he: '"David Libre", "Noto Sans Hebrew", "Times New Roman", serif',
      fa: '"Vazir", "Noto Sans Persian", "Times New Roman", serif',
      ur: '"Noto Sans Urdu", "Times New Roman", serif',
      // Add more language-specific fonts as needed
    };

    return fontStacks[langCode] || '"Inter", "Segoe UI", "Roboto", sans-serif';
  }

  /**
   * Handle mixed content (LTR + RTL text)
   * Returns appropriate Unicode directionality marks
   */
  static handleMixedContent(text: string, baseLangCode: string): string {
    const isBaseRtl = this.isRtlLanguage(baseLangCode);

    // Add Unicode marks for proper text rendering
    if (isBaseRtl && /[a-zA-Z0-9]/.test(text)) {
      // RTL base with LTR content - add LTR marks around Latin text
      return text.replace(/([a-zA-Z0-9]+)/g, '\u202D$1\u202C'); // LTR override
    } else if (!isBaseRtl && this.containsRtlCharacters(text)) {
      // LTR base with RTL content - add RTL marks
      return text.replace(
        /([\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF]+)/g,
        '\u202E$1\u202C',
      ); // RTL override
    }

    return text;
  }

  /**
   * Get language-specific keyboard layout hint
   */
  static getKeyboardLayoutHint(langCode: string): string | undefined {
    const keyboardLayouts: Record<string, string> = {
      ar: 'arabic',
      he: 'hebrew',
      fa: 'persian',
      ur: 'urdu',
    };

    return keyboardLayouts[langCode];
  }

  /**
   * Generate RTL-aware CSS class names
   */
  static generateRtlClassName(baseClassName: string, langCode: string): string {
    const isRtl = this.isRtlLanguage(langCode);
    return isRtl ? `${baseClassName} ${baseClassName}--rtl` : baseClassName;
  }
}
