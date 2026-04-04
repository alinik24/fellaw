import React, { useState } from 'react';
import { X, Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface ChatAssistantProps {
  onClose: () => void;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      content: 'Hello! I\'m your FelLaw AI Assistant. How can I help you today? I can answer questions about German law, guide you through our services, or help with your case.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: messages.length + 2,
        sender: 'ai',
        content: generateAIResponse(newMessage),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('lawyer') || lowerInput.includes('attorney')) {
      return 'I can help you find a qualified lawyer! We have specialists in tenancy law, employment law, family law, and more. Would you like to see our lawyer directory or get matched with a lawyer for your specific case?';
    } else if (lowerInput.includes('cost') || lowerInput.includes('price') || lowerInput.includes('fee')) {
      return 'Our pricing varies by service: Self-service tools start at €0-49/month, lawyer consultations are €190-250, and full representation depends on case complexity. Would you like detailed pricing for a specific service?';
    } else if (lowerInput.includes('emergency') || lowerInput.includes('urgent')) {
      return 'For emergency legal situations, please use our Crisis Now feature on the homepage. It provides immediate guidance for police stops, accidents, arrests, and other urgent matters. Would you like me to guide you there?';
    } else if (lowerInput.includes('rent') || lowerInput.includes('landlord') || lowerInput.includes('tenant')) {
      return 'For tenancy disputes, we offer specialized support including rent increase challenges, eviction defense, and Mietpreisbremse violations. I can help you start a case assessment or connect you with a tenancy law specialist. What would you prefer?';
    } else {
      return 'I understand you need assistance with your legal matter. I can help you with: finding lawyers, understanding your legal options, navigating our services, or starting a new case. What would be most helpful for you right now?';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 shadow-2xl">
      <Card className="bg-card border-2 border-primary">
        <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <CardTitle className="text-lg">FelLaw AI Assistant</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-primary/20 text-primary-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border-2 border-border text-foreground'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {message.sender === 'ai' ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <p className="text-xs font-semibold">
                      {message.sender === 'user' ? 'You' : 'AI Assistant'}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-70 mt-2">{message.timestamp}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-card border-2 border-border px-4 py-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">AI is typing...</p>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t-2 border-border bg-card">
            <div className="flex space-x-2">
              <Textarea
                placeholder="Ask me anything about FelLaw services or German law..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 min-h-[60px] max-h-[120px]"
                rows={2}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
