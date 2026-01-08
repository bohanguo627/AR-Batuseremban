import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { getGroundedKnowledge } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext'; // 1. Import Hook

const Chat: React.FC = () => {
  const { t, lang } = useLanguage(); // 2. Get Lang & Translator
  
  // 3. Initialize message state with translated welcome
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Effect to reset/translate welcome message when language changes
  useEffect(() => {
    setMessages([{ 
        id: 'init', 
        role: 'model', 
        text: t('chat_welcome') 
    }]);
  }, [lang, t]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (query?: string) => {
    const messageToSend = query || input;
    if (!messageToSend.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: messageToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!query) {
      setInput('');
    }
    setLoading(true);

    // 4. Pass 'lang' to the service
    const response = await getGroundedKnowledge(messageToSend, lang);

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: response.text,
      sources: response.sources,
      followUpQuestions: response.followUpQuestions
    };

    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-24 bg-heritage-black flex flex-col items-center">
      <div className="w-full max-w-4xl px-6 flex-1 flex flex-col">
        <div className="text-center mb-10 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-serif text-heritage-orange">{t('chat_title')}</h1>
          <p className="text-heritage-gray mt-2">{t('chat_subtitle')}</p>
        </div>

        <div className="flex-1 w-full bg-heritage-dark border border-heritage-gray/10 flex flex-col shadow-2xl rounded-t-lg overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-message-in">
                <div className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 bg-heritage-orange rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white font-serif font-bold text-lg">B</span>
                    </div>
                  )}
                  <div className={`max-w-[85%] p-4 rounded-lg text-sm leading-relaxed shadow-md ${
                    msg.role === 'user' 
                      ? 'bg-heritage-orange text-white rounded-br-none' 
                      : 'bg-zinc-800 text-heritage-cream rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
                {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 ml-12 text-xs text-heritage-gray flex flex-wrap gap-2">
                      <span className="font-bold text-heritage-orange self-center">{t('chat_sources')}</span>
                      {msg.sources.map((source, i) => (
                        <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="underline hover:text-heritage-orange transition-colors bg-zinc-900/50 px-2 py-0.5 rounded border border-white/5">
                          {source.title}
                        </a>
                      ))}
                  </div>
                )}
                 {msg.role === 'model' && msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                  <div className="mt-4 ml-12 text-sm flex flex-col items-start gap-2">
                      {msg.followUpQuestions.map((q, i) => (
                        <button key={i} onClick={() => handleSend(q)} className="text-left text-heritage-gold hover:text-white transition-colors bg-heritage-gold/10 hover:bg-heritage-gold/20 px-4 py-2 rounded-full w-auto border border-heritage-gold/20">
                          {q}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-4 justify-start animate-message-in">
                  <div className="w-8 h-8 bg-heritage-orange rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-serif font-bold text-lg animate-pulse">B</span>
                  </div>
                  <div className="bg-zinc-800 p-4 rounded-lg rounded-bl-none text-sm text-heritage-orange animate-pulse">
                      {t('chat_loading')}
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
          <div className="p-4 border-t border-heritage-gray/10 bg-zinc-900/50 backdrop-blur-sm">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
                placeholder={t('chat_placeholder')}
                className="flex-1 bg-black border border-zinc-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-heritage-orange transition-all font-sans text-sm placeholder-zinc-500"
              />
              <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="bg-heritage-orange text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider">
                {t('chat_send')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
