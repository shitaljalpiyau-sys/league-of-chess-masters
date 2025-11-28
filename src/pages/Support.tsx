import { useState, useEffect, useRef } from 'react';
import { Send, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'admin';
  timestamp: Date;
}

const DUMMY_ADMIN_RESPONSES = [
  "Thanks for reaching out! How can I help you today?",
  "I understand your concern. Let me look into that for you.",
  "That's a great question! Here's what I can tell you...",
  "I've noted your feedback. Our team will review it shortly.",
  "Your class upgrade request is under review. You'll hear back within 24 hours.",
  "Have you tried refreshing the page? That often resolves display issues.",
  "I see you're interested in premium themes. Those unlock at Class C and above!",
  "Great job on your recent wins! Keep up the excellent gameplay.",
  "Is there anything else I can help you with today?",
  "Thank you for being part of our chess community!"
];

export default function Support() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello ${profile?.username || 'Player'}! Welcome to support chat. How can I assist you today?`,
      sender: 'admin',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulate admin response after 1-2 seconds
    setTimeout(() => {
      const randomResponse = DUMMY_ADMIN_RESPONSES[Math.floor(Math.random() * DUMMY_ADMIN_RESPONSES.length)];
      const adminMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'admin',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, adminMessage]);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen pb-20 pt-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-accent"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-rajdhani text-primary">
              SUPPORT CHAT
            </h1>
            <p className="text-sm text-muted-foreground">
              Private chat with admin team
            </p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col h-[calc(100vh-240px)]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {message.sender === 'admin' && (
                    <div className="text-xs font-bold text-primary mb-1">
                      ADMIN TEAM
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <div className={`text-xs mt-2 ${
                    message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4 bg-background">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Demo mode: Admin responses are automated for testing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
