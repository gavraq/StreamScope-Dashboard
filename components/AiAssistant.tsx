import React, { useState, useEffect, useRef } from 'react';
import { MessageSquareMore, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Channel, WatchedVideo } from '../types';
import { createChatSession } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";

interface AiAssistantProps {
  channels: Channel[];
  history: WatchedVideo[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ channels, history }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hi! I\'m your StreamScope Assistant. I have analyzed your subscriptions and watch history. Ask me anything about your viewing habits!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session on mount with fresh data
    const session = createChatSession(channels, history);
    setChatSession(session);
  }, [channels, history]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const result = await chatSession.sendMessageStream({ message: userMessage });
      
      let fullResponse = "";
      setMessages(prev => [...prev, { role: 'model', text: "" }]);

      for await (const chunk of result) {
         const c = chunk as GenerateContentResponse;
         const text = c.text;
         if (text) {
             fullResponse += text;
             // Update the last message with the streaming chunk
             setMessages(prev => {
                 const newArr = [...prev];
                 newArr[newArr.length - 1] = { role: 'model', text: fullResponse };
                 return newArr;
             });
         }
      }
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please check your API key." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in pb-4">
      <header className="mb-6 flex-shrink-0">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Sparkles className="text-blue-500" size={32} />
          AI Assistant
        </h2>
        <p className="text-gray-400">Powered by Gemini 3 Flash • Context-aware of your library</p>
      </header>

      {/* Chat Container */}
      <div className="flex-1 bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden flex flex-col">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div 
                key={idx} 
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-600 to-purple-600'
                }`}>
                    {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' 
                    ? 'bg-gray-800 text-white rounded-tr-sm' 
                    : 'bg-blue-900/20 border border-blue-900/40 text-blue-100 rounded-tl-sm'
                }`}>
                    {msg.text}
                </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot size={20} />
                  </div>
                  <div className="bg-blue-900/20 border border-blue-900/40 px-5 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-blue-400" />
                      <span className="text-xs text-blue-300">Thinking...</span>
                  </div>
              </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-900/50 border-t border-gray-800">
            <div className="relative">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                    placeholder="Ask about your history, specific videos, or channel recommendations..."
                    className="w-full bg-[#0f0f0f] border border-gray-700 text-white rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                    disabled={isLoading}
                />
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
                >
                    <Send size={18} />
                </button>
            </div>
            <p className="text-[10px] text-center text-gray-600 mt-2">
                Gemini may display inaccurate info, including about people, so double-check its responses.
            </p>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;