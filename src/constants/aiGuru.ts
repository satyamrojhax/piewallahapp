// AI Guru Configuration Constants
export const AI_GURU_CONSTANTS = {
  // AI Assistant Configuration
  AI_NAME: 'AI Guru',
  INTENT_TYPE: 'ACADEMIC_FOUNDATION',
  
  // UI Text
  MESSAGES: {
    WELCOME_TITLE: 'How can I help you today?',
    WELCOME_SUBTITLE: "I'm here to help you with your studies, answer questions, and provide academic support.",
    TYPING_INDICATOR: 'AI Guru is thinking...',
    DISCLAIMER: 'AI Guru may produce inaccurate information. Always verify important details.',
    PLACEHOLDER: 'Ask anything',
    CONVERSATION_MATCH: 'AI Guru'
  },
  
  // ChatGPT Theme Colors
  COLORS: {
    BACKGROUND: '#343541',
    BORDER: '#4e4f5f',
    TEXT_PRIMARY: '#ececf1',
    TEXT_SECONDARY: '#8e8ea0',
    USER_BUBBLE: '#444654',
    AI_BUBBLE: '#343541',
    INPUT_BACKGROUND: '#40414f',
    SEND_BUTTON: '#10a37f',
    SEND_BUTTON_HOVER: '#0f9a73',
    USER_AVATAR: '#10a37f',
    AI_AVATAR_GRADIENT: 'from-blue-500 to-purple-600',
    DISABLED_BUTTON: '#4e4f5f'
  }
} as const;
