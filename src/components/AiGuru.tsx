import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Sparkles, User as UserIcon, BotIcon, MessageSquare, ThumbsUp, ThumbsDown, RotateCcw, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  fetchConversationList,
  fetchMessages,
  sendMessageStream,
  getUserMetadata,
  type Message,
  type StreamEvent,
  type StudentMetadata
} from '@/services/aiGuruService';
import { exchangeToken } from '@/services/userService';
import { AI_GURU_CONSTANTS } from '@/constants/aiGuru';

interface AiGuruProps {
  cohortId?: string;
  className?: string;
}

const AiGuru: React.FC<AiGuruProps> = ({ cohortId, className }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamMessage, setCurrentStreamMessage] = useState('');
  const [conversationId, setConversationId] = useState<string>('');
  const [userMetadata, setUserMetadata] = useState<StudentMetadata>({ classes: '', exam: '', first_name: '', last_name: '' });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentCohortId, setCurrentCohortId] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load user profile and metadata
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user metadata
        const metadata = getUserMetadata();
        setUserMetadata(metadata);

        // Get user data from exchange token endpoint
        const tokenResponse = await exchangeToken();
        if (tokenResponse.success && tokenResponse.data.user) {
          const userData = tokenResponse.data.user;
          setUserProfile(userData);
          
          // Set cohort ID from user data or use prop
          const profileCohortId = userData.profileId?.cohortId;
          if (profileCohortId) {
            setCurrentCohortId(profileCohortId);
          } else if (cohortId) {
            setCurrentCohortId(cohortId);
          }
        } else if (cohortId) {
          setCurrentCohortId(cohortId);
        }
      } catch (error) {
        // Fallback to prop cohortId if available
        if (cohortId) {
          setCurrentCohortId(cohortId);
        }
      }
    };

    loadUserData();
  }, [cohortId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamMessage]);

  // Focus input when component loads
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const response = await fetchMessages(convId);
      if (response.success) {
        // Reverse messages to show newest at bottom (like ChatGPT)
        const messages = response.data.messages || [];
        setMessages(messages.reverse());
      }
    } catch (error) {
      toast.error('Failed to load messages');
    }
  }, []);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        if (!userMetadata.first_name || !currentCohortId) return;
        
        const response = await fetchConversationList(AI_GURU_CONSTANTS.INTENT_TYPE);
        if (response.success && response.data.length > 0) {
          // Find or create conversation for this user
          const userConversation = response.data.find(conv => 
            conv.display_name?.includes(userMetadata.first_name) || 
            conv.display_name?.includes(AI_GURU_CONSTANTS.MESSAGES.CONVERSATION_MATCH)
          ) || response.data[0]; // Fallback to first conversation
          
          setConversationId(userConversation.conversation_id);
          // Load messages for this conversation
          await loadMessages(userConversation.conversation_id);
        }
      } catch (error) {
        // Don't show error toast on initial load
      }
    };
    
    if (userMetadata.first_name && currentCohortId) {
      loadConversations();
    }
  }, [userMetadata.first_name, currentCohortId, loadMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading || isStreaming || !currentCohortId) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Create temporary user message for immediate display
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        author_id: userProfile?.id || userMetadata.first_name || 'user',
        text: messageText,
        author_metadata: {
          profile_pic: '',
          first_name: userProfile?.firstName || userMetadata.first_name || '',
          last_name: userProfile?.lastName || userMetadata.last_name || ''
        },
        created_at: new Date().toISOString(),
        type: 'text',
        conversation_id: conversationId,
        admission_metadata: '',
        bookmarked: null,
        is_deleted: false,
        media_url: '',
        metadata: [],
        transcribed_text: '',
        voted: null
      };

      setMessages(prev => [...prev, tempUserMessage]);

      // Prepare payload
      const payload = {
        cohort_id: currentCohortId,
        conversation_id: conversationId || '',
        intent_type: AI_GURU_CONSTANTS.INTENT_TYPE,
        student_metadata: userMetadata,
        text: messageText,
        isSuggestiveMessage: false
      };

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      // Start streaming
      setIsStreaming(true);
      setCurrentStreamMessage('');

      let aiMessageId = '';
      let fullAiMessage = '';

      await sendMessageStream(payload, (event: StreamEvent) => {
        if (event.event === 'human_message_details') {
          // Update conversation ID if this is a new conversation
          if (!conversationId && event.data.conversation_id) {
            setConversationId(event.data.conversation_id);
          }
          
          // Update the temporary user message with actual server data
          setMessages(prev => prev.map(msg => 
            msg.id.startsWith('temp-') ? {
              ...msg,
              id: event.data.id || msg.id,
              author_id: event.data.author_id || msg.author_id,
              author_metadata: event.data.author_metadata || msg.author_metadata,
              created_at: event.data.created_at || msg.created_at
            } : msg
          ));
        } else if (event.event === 'ai_message_details') {
          aiMessageId = event.data.id || `ai-${Date.now()}`;
        } else if (event.event === 'text_chunk') {
          // Append text chunk for faster display
          fullAiMessage += event.data.text || '';
          setCurrentStreamMessage(fullAiMessage);
        } else if (event.event === 'consolidated_output') {
          // Final message received
          const finalMessage: Message = {
            id: aiMessageId || `ai-${Date.now()}`,
            author_id: 'ai_guru',
            text: event.data.text || fullAiMessage,
            author_metadata: {
              profile_pic: '',
              first_name: 'AI',
              last_name: 'Guru'
            },
            created_at: new Date().toISOString(),
            type: 'text',
            conversation_id: conversationId,
            admission_metadata: '',
            bookmarked: null,
            is_deleted: false,
            media_url: '',
            metadata: [],
            transcribed_text: '',
            voted: null
          };

          setMessages(prev => [...prev, finalMessage]);
          setCurrentStreamMessage('');
          setIsStreaming(false);
        } else if (event.event === 'end') {
          // Stream ended
          setIsStreaming(false);
          setCurrentStreamMessage('');
        }
      }, abortControllerRef.current.signal);

    } catch (error) {
      toast.error('Failed to send message');
      setIsStreaming(false);
      setIsLoading(false);
      setCurrentStreamMessage('');
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, isStreaming, userMetadata, userProfile, conversationId, currentCohortId]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`h-full w-full flex flex-col bg-[#343541] overflow-hidden relative ${className}`}>
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .message-content strong {
          font-weight: 600;
        }
        .message-content em {
          font-style: italic;
        }
        .message-content ul, .message-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        .message-content li {
          margin: 0.25rem 0;
        }
        .message-content code {
          background-color: rgba(0,0,0,0.1);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875em;
        }
        .message-content pre {
          background-color: rgba(0,0,0,0.05);
          padding: 0.5rem;
          border-radius: 0.375rem;
          overflow-x: auto;
          font-family: monospace;
          font-size: 0.875em;
        }
        .message-content blockquote {
          border-left: 3px solid currentColor;
          padding-left: 0.75rem;
          margin: 0.5rem 0;
          font-style: italic;
        }
        .message-content a {
          color: inherit;
          text-decoration: underline;
        }
        .message-content h1, .message-content h2, .message-content h3 {
          font-weight: 600;
          margin: 0.75rem 0 0.25rem 0;
        }
        .message-content p {
          margin: 0.5rem 0;
        }
      `}</style>
      
      {/* Chat Messages Area - ChatGPT Style */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide">
          <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
            {/* Welcome Message */}
            {messages.length === 0 && !isStreaming && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
                  <BotIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-[#ececf1] mb-3">{AI_GURU_CONSTANTS.MESSAGES.WELCOME_TITLE}</h3>
                <p className="text-[#8e8ea0] max-w-lg mx-auto">
                  {AI_GURU_CONSTANTS.MESSAGES.WELCOME_SUBTITLE}
                </p>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => {
              const isUserMessage = message.author_id === userMetadata.first_name || 
                                  message.author_id === 'user' ||
                                  (userProfile && message.author_id === userProfile.id);
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} gap-3`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 ${isUserMessage ? 'order-2' : 'order-1'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isUserMessage 
                        ? 'bg-[#10a37f]' 
                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    }`}>
                      {isUserMessage ? (
                        <UserIcon className="h-4 w-4 text-white" />
                      ) : (
                        <BotIcon className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                  
                  {/* Message Content */}
                  <div className={`max-w-2xl ${isUserMessage ? 'order-1' : 'order-1'}`}>
                    {/* Sender Name */}
                    <div className={`text-xs font-medium mb-1 ${
                      isUserMessage 
                        ? 'text-[#8e8ea0] text-right' 
                        : 'text-[#8e8ea0]'
                    }`}>
                      {isUserMessage ? (userProfile?.firstName || 'You') : AI_GURU_CONSTANTS.AI_NAME}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`rounded-2xl px-4 py-3 ${
                      isUserMessage
                        ? 'bg-[#444654] text-[#ececf1]'
                        : 'bg-[#343541] text-[#ececf1]'
                    }`}>
                      <div 
                        className="text-sm whitespace-pre-wrap break-words message-content"
                        dangerouslySetInnerHTML={{ 
                          __html: message.text
                            .replace(/\n/g, '<br />')
                            .replace(/\\sqrt\{([^}]+)\}/g, '√$1') // Convert \sqrt{...} to √
                            .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)') // Convert \frac{a}{b} to (a/b)
                            .replace(/\\mathrm\{([^}]+)\}/g, '$1') // Convert \mathrm{...} to plain text
                            .replace(/\\\(/g, '(') // Convert \( to (
                            .replace(/\\\)/g, ')') // Convert \) to )
                            .replace(/\$/g, '') // Remove $ symbols
                            .replace(/≠/g, '!=') // Convert ≠ to !=
                            .replace(/≤/g, '<=') // Convert ≤ to <=
                            .replace(/≥/g, '>=') // Convert ≥ to >=
                        }}
                      />
                    </div>
                    
                    {/* Action Buttons for AI Messages - Only Keep Thumbs Up/Down */}
                    {!isUserMessage && (
                      <div className="flex items-center gap-2 mt-2 text-[#8e8ea0]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-[#4e4f5f] hover:text-[#ececf1]"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-[#4e4f5f] hover:text-[#ececf1]"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Streaming Message */}
            {isStreaming && currentStreamMessage && (
              <div className="flex justify-start gap-3">
                {/* Bot Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <BotIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                {/* Message Content */}
                <div className="max-w-2xl">
                  {/* Sender Name */}
                  <div className="text-xs font-medium mb-1 text-[#8e8ea0]">
                    {AI_GURU_CONSTANTS.AI_NAME}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className="bg-[#343541] text-[#ececf1] rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="text-sm whitespace-pre-wrap break-words message-content"
                        dangerouslySetInnerHTML={{ 
                          __html: currentStreamMessage
                            .replace(/\n/g, '<br />')
                            .replace(/\\sqrt\{([^}]+)\}/g, '√$1') // Convert \sqrt{...} to √
                            .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)') // Convert \frac{a}{b} to (a/b)
                            .replace(/\\mathrm\{([^}]+)\}/g, '$1') // Convert \mathrm{...} to plain text
                            .replace(/\\\(/g, '(') // Convert \( to (
                            .replace(/\\\)/g, ')') // Convert \) to )
                            .replace(/\$/g, '') // Remove $ symbols
                            .replace(/≠/g, '!=') // Convert ≠ to !=
                            .replace(/≤/g, '<=') // Convert ≤ to <=
                            .replace(/≥/g, '>=') // Convert ≥ to >=
                        }}
                      />
                      <Sparkles className="h-4 w-4 text-blue-400 animate-pulse flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Typing Indicator */}
            {isStreaming && !currentStreamMessage && (
              <div className="flex justify-start gap-3">
                {/* Bot Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <BotIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                {/* Message Content */}
                <div className="max-w-2xl">
                  {/* Sender Name */}
                  <div className="text-xs font-medium mb-1 text-[#8e8ea0]">
                    {AI_GURU_CONSTANTS.AI_NAME}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className="bg-[#343541] text-[#ececf1] rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#8e8ea0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-[#8e8ea0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-[#8e8ea0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-[#8e8ea0] ml-2">{AI_GURU_CONSTANTS.MESSAGES.TYPING_INDICATOR}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area - ChatGPT Style */}
      <div className="border-t border-[#4e4f5f] bg-[#343541] p-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <div className="flex items-center gap-2 bg-[#40414f] rounded-2xl px-4 py-3 pr-12">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={AI_GURU_CONSTANTS.MESSAGES.PLACEHOLDER}
                disabled={isLoading || isStreaming}
                className="flex-1 bg-transparent border-none text-[#ececf1] placeholder-[#8e8ea0] focus:ring-0 focus:outline-none text-sm"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || isStreaming || !inputMessage.trim()}
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-[#10a37f] hover:bg-[#0f9a73] text-white disabled:bg-[#4e4f5f] disabled:text-[#8e8ea0]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-[#8e8ea0] mt-2 text-center">
            {AI_GURU_CONSTANTS.AI_NAME} may produce inaccurate information. Always verify important details.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiGuru;
