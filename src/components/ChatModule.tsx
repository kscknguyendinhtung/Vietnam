/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Sparkles, Loader2, MessageSquare, Volume2, Globe, Bot, User, HelpCircle, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatModuleProps {
  messages: ChatMessage[];
  onAddMessage: (msg: ChatMessage) => void;
  onUpdateMessage: (id: string, updatedFields: Partial<ChatMessage>) => void;
  onClearHistory: () => void;
}

export default function ChatModule({ messages, onAddMessage, onUpdateMessage, onClearHistory }: ChatModuleProps) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLang, setRecordingLang] = useState<'vi-VN' | 'en-US'>('vi-VN');
  const [recognition, setRecognition] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;

        rec.onstart = () => {
          setIsRecording(true);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(prev => prev ? prev + ' ' + transcript : transcript);
        };

        setRecognition(rec);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      alert("Trình duyệt của bạn không hỗ trợ ghi âm nhận diện giọng nói (Web Speech API). Hãy dùng thử Google Chrome hoặc Microsoft Edge.");
      return;
    }
    if (isRecording) {
      recognition.stop();
    } else {
      // Load current chosen language
      recognition.lang = recordingLang;
      recognition.start();
    }
  };

  const isTextVietnamese = (text: string) => {
    return /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i.test(text);
  };

  const handleSpeak = (text: string, lang: 'vi' | 'en') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userRawText = inputText.trim();
    setInputText('');

    // Guess if input is Vietnamese
    const isInputVi = isTextVietnamese(userRawText);
    
    const userMsg: ChatMessage = {
      id: `chat-u-${Date.now()}`,
      role: 'user',
      content: userRawText,
      translation: 'Translating...'
    };

    onAddMessage(userMsg);
    setLoading(true);

    try {
      // 1. Fire quick translation for the user's typed sentence
      let userTranslation = '';
      try {
        const transRes = await fetch('/api/translate-whiteboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: userRawText })
        });
        if (transRes.ok) {
          const transData = await transRes.json();
          userTranslation = transData.fullTranslation;
        } else {
          userTranslation = isInputVi ? 'Translating to English...' : 'Dịch sang Tiếng Việt...';
        }
      } catch (e) {
        userTranslation = isInputVi ? 'Translating to English...' : 'Dịch sang Tiếng Việt...';
      }

      // Update the user message translation reactively
      onUpdateMessage(userMsg.id, { translation: userTranslation });

      // 2. Query server API /api/chat with full history
      const history = [...messages, { ...userMsg, translation: userTranslation }];
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });

      if (!response.ok) throw new Error("Không thể kết nối với máy chủ AI.");
      const data = await response.json();

      // 3. Create the assistant's bilingual message
      const assistantMsg: ChatMessage = {
        id: `chat-a-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        translation: data.translation
      };

      onAddMessage(assistantMsg);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `chat-err-${Date.now()}`,
        role: 'assistant',
        content: "Đã xảy ra lỗi khi trao đổi với trợ lý AI. Vui lòng đảm bảo bạn đã điền đầy đủ và chính xác mã GEMINI_API_KEY trong cấu hình Secrets panel.",
        translation: "An error occurred with the AI companion. Please ensure you have configured your GEMINI_API_KEY inside the Secrets panel."
      };
      onAddMessage(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
      {/* Sidebar: AI Information & Prompts */}
      <div className="bg-white rounded-2xl border-2 border-yellow-400/60 p-5 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="text-center pb-4 border-b border-slate-100">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-600 rounded-2xl mx-auto flex items-center justify-center mb-3 border border-orange-100">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-extrabold text-slate-900">Đại lý Giáo viên AI</h3>
            <p className="text-[10px] text-slate-500">Người bạn đồng hành học song ngữ Anh - Việt 24/7</p>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gợi ý chủ đề hỏi:</span>
            
            <button
              onClick={() => setInputText("Giải thích sự khác nhau giữa 'được' và 'bị' trong tiếng Việt.")}
              className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/50 text-[11px] font-semibold text-slate-600 cursor-pointer transition-colors"
            >
              "Sự khác nhau giữa 'được' và 'bị'?"
            </button>

            <button
              onClick={() => setInputText("How do I order a bowl of beef Pho politely in Vietnamese?")}
              className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/50 text-[11px] font-semibold text-slate-600 cursor-pointer transition-colors"
            >
              "How to order Pho politely?"
            </button>

            <button
              onClick={() => setInputText("Phân biệt cách xưng hô: anh, chị, em, cô, dì, chú, bác.")}
              className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/50 text-[11px] font-semibold text-slate-600 cursor-pointer transition-colors"
            >
              "Cách xưng hô gia đình Việt Nam?"
            </button>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="w-full border border-slate-200 hover:bg-slate-50 text-slate-500 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
        >
          Xóa lịch sử trò chuyện
        </button>
      </div>

      {/* Main Conversation Window */}
      <div className="lg:col-span-3 flex flex-col bg-white rounded-3xl border-2 border-yellow-400 shadow-sm overflow-hidden h-full">
        {/* Active conversation bubble area */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
              <MessageSquare className="w-12 h-12 text-slate-300 animate-bounce" />
              <div>
                <h3 className="text-sm font-bold text-slate-700">Trò chuyện song ngữ với Trí tuệ Nhân tạo</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Nhập câu hỏi bằng tiếng Việt hoặc tiếng Anh. Trợ lý sẽ phản hồi kèm dịch nghĩa trực tiếp ngay bên trên mỗi tin nhắn để bạn học tập liên tục!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                // Detect translation language to speak
                const isTranslationVietnamese = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i.test(msg.translation);

                return (
                  <div key={msg.id} className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isUser ? 'bg-slate-800 text-white' : 'bg-orange-500 text-white shadow-sm'
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Chat Bubble card */}
                    <div className="space-y-1.5 max-w-[80%]">
                      {/* BILINGUAL TRANSLATION OVERLAY (Shown above/below) */}
                      {msg.translation && (
                        <div className={`text-[10px] font-extrabold tracking-wide px-3 py-1.5 rounded-xl border flex items-center justify-between gap-2.5 ${
                          isUser 
                            ? 'text-slate-400 bg-slate-100/50 border-slate-200/50' 
                            : 'text-orange-700 bg-orange-50 border-orange-100 shadow-3xs'
                        }`}>
                          <span className="leading-relaxed">{msg.translation}</span>
                          <button
                            type="button"
                            onClick={() => handleSpeak(msg.translation!, isTextVietnamese(msg.translation!) ? 'vi' : 'en')}
                            className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
                            title="Nghe phát âm bản dịch"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Primary Content bubble */}
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed shadow-xs relative group ${
                        isUser 
                          ? 'bg-slate-800 text-white rounded-tr-none' 
                          : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                      }`}>
                        {msg.content}

                        {/* Speech Synthesis Trigger */}
                        <button
                          type="button"
                          onClick={() => handleSpeak(msg.content, isTextVietnamese(msg.content) ? 'vi' : 'en')}
                          className={`absolute bottom-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                            isUser ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'
                          }`}
                          title="Đọc to tin nhắn gốc"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Spinner when loading */}
              {loading && (
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-xs text-xs text-slate-500 flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    <span>Đại lý AI đang soạn câu trả lời song ngữ...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </div>

        {/* Input box form with Mic Recording Toolbar */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex flex-col md:flex-row md:items-center gap-3">
          {/* Voice recording toolbar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRecordingLang(prev => prev === 'vi-VN' ? 'en-US' : 'vi-VN')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black border border-slate-200 shadow-3xs cursor-pointer select-none shrink-0"
              title="Nhấp để chuyển đổi ngôn ngữ ghi âm"
            >
              🎤 {recordingLang === 'vi-VN' ? 'VI (Tiếng Việt)' : 'EN (English)'}
            </button>

            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                isRecording 
                  ? 'bg-rose-500 border-rose-600 text-white animate-pulse shadow-md shadow-rose-500/20' 
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500'
              }`}
              title={isRecording ? "Dừng ghi âm" : "Ghi âm giọng nói (Speech-to-Text)"}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex-grow flex items-center gap-2">
            <input
              type="text"
              required
              disabled={loading}
              placeholder={isRecording ? "Đang ghi âm, hãy nói..." : "Nhập câu hỏi bằng tiếng Việt hoặc tiếng Anh..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className={`p-3 rounded-xl shadow-md transition-all cursor-pointer shrink-0 ${
                !inputText.trim() || loading
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none border border-slate-200'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
