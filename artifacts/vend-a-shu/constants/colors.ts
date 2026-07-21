/**
 * Vend-a-Shu palette: signature orange + deep navy, warm light surfaces.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#1E3A5F',
    tint: '#F97316',

    // Core surfaces
    background: '#F8F9FA',
    foreground: '#1E3A5F',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#1E3A5F',

    // Primary action color (buttons, links, active states)
    primary: '#F97316',
    primaryForeground: '#FFFFFF',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#F0F4FF',
    secondaryForeground: '#1E3A5F',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#F0F0F0',
    mutedForeground: '#8A94A6',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#FDDCBC',
    accentForeground: '#1E3A5F',

    // Destructive actions (delete, error states)
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#E4E7EC',
    input: '#E4E7EC',

    // Brand extras
    navy: '#1E3A5F',
    navySoft: '#4A6FA5',
    success: '#22C55E',
    peach: '#FFF9F0',
  },

  radius: 12,
};

export default colors;
