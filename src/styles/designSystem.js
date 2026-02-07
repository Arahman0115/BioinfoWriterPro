/**
 * BioinfoWriterPro Design System
 * Modern Scientific Design with Notion meets Nature.com aesthetic
 */

// Color Palette - Blue/Cyan Primary with Purple AI accents
export const colors = {
  // Primary - Blue/Cyan (trust, science, stability)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Primary brand color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c3d66',
  },

  // Accent - Purple (AI features, highlights)
  accent: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // Accent color for AI
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },

  // Semantic colors
  success: {
    light: '#dcfce7',
    main: '#22c55e',
    dark: '#15803d',
  },
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#b45309',
  },
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#991b1b',
  },
  info: {
    light: '#e0f2fe',
    main: '#0ea5e9',
    dark: '#0c3d66',
  },

  // Neutral - Slate/Gray scale
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Light mode
  light: {
    background: '#ffffff',
    surface: '#f9fafb',
    surfaceVariant: '#f3f4f6',
    border: '#e5e7eb',
    text: '#111827',
    textSecondary: '#6b7280',
  },

  // Dark mode
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceVariant: '#334155',
    border: '#475569',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
  },
};

// Typography
export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'Geist Mono', 'Courier New', monospace",
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Base size: 16px
  fontSize: {
    xs: { size: '12px', lineHeight: '16px', letterSpacing: '0.5px' },
    sm: { size: '14px', lineHeight: '20px', letterSpacing: '0.25px' },
    base: { size: '16px', lineHeight: '24px', letterSpacing: '0px' },
    lg: { size: '18px', lineHeight: '28px', letterSpacing: '0px' },
    xl: { size: '20px', lineHeight: '28px', letterSpacing: '-0.5px' },
    '2xl': { size: '24px', lineHeight: '32px', letterSpacing: '-0.5px' },
    '3xl': { size: '30px', lineHeight: '36px', letterSpacing: '-1px' },
    '4xl': { size: '36px', lineHeight: '44px', letterSpacing: '-1.5px' },
  },

  // Predefined text styles
  styles: {
    h1: {
      fontSize: '36px',
      fontWeight: 700,
      lineHeight: '44px',
      letterSpacing: '-1.5px',
    },
    h2: {
      fontSize: '30px',
      fontWeight: 600,
      lineHeight: '36px',
      letterSpacing: '-1px',
    },
    h3: {
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: '32px',
      letterSpacing: '-0.5px',
    },
    h4: {
      fontSize: '20px',
      fontWeight: 600,
      lineHeight: '28px',
    },
    body: {
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '24px',
    },
    bodySmall: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '20px',
    },
    caption: {
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: '16px',
    },
    label: {
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '20px',
    },
  },
};

// Spacing System (4px base unit)
export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
};

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '2px',
  md: '4px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '20px',
  full: '9999px',
};

// Shadow System
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

// Component Variants
export const componentVariants = {
  button: {
    primary: {
      bg: colors.primary[500],
      text: 'white',
      hover: colors.primary[600],
      active: colors.primary[700],
      disabled: colors.neutral[300],
    },
    secondary: {
      bg: colors.neutral[100],
      text: colors.neutral[900],
      hover: colors.neutral[200],
      active: colors.neutral[300],
      disabled: colors.neutral[200],
    },
    outline: {
      bg: 'transparent',
      border: colors.primary[500],
      text: colors.primary[500],
      hover: colors.primary[50],
      disabled: colors.neutral[300],
    },
    ghost: {
      bg: 'transparent',
      text: colors.primary[500],
      hover: colors.primary[50],
      disabled: colors.neutral[300],
    },
  },

  card: {
    bg: 'white',
    border: colors.neutral[200],
    shadow: shadows.sm,
    borderRadius: borderRadius.lg,
    padding: spacing[6],
  },

  input: {
    bg: 'white',
    border: colors.neutral[200],
    borderFocus: colors.primary[500],
    text: colors.neutral[900],
    placeholder: colors.neutral[400],
    borderRadius: borderRadius.md,
    padding: `${spacing[2]} ${spacing[3]}`,
  },
};

// Motion/Animation
export const motion = {
  duration: {
    instant: '0ms',
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Layout
export const layout = {
  maxWidth: '1400px',
  paddingMobile: spacing[4],
  paddingTablet: spacing[6],
  paddingDesktop: spacing[8],
  sidebarWidth: {
    collapsed: '64px',
    expanded: '240px',
  },
  contentPadding: {
    mobile: spacing[4],
    tablet: spacing[6],
    desktop: spacing[8],
  },
};

// Export combined design system
export const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  componentVariants,
  motion,
  layout,
};

export default designSystem;
