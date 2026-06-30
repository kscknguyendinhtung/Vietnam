/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VocabModule from './components/VocabModule';
import GrammarModule from './components/GrammarModule';
import WhiteboardModule from './components/WhiteboardModule';
import ChatModule from './components/ChatModule';
import SyncModal from './components/SyncModal';

import { VocabItem, GrammarPuzzle, WhiteboardTab, ChatMessage } from './types';
import { DEFAULT_VOCAB_ITEMS, DEFAULT_GRAMMAR_PUZZLES } from './presets';
import { 
  BookOpen, Sparkles, MessageSquare, FileText, RefreshCw, HelpCircle, 
  Settings, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Navigation: 'vocab' | 'grammar' | 'whiteboard' | 'chat'
  const [activeTab, setActiveTab] = useState<'vocab' | 'grammar' | 'whiteboard' | 'chat'>('vocab');

  // Modal control
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Global State (persisted in localStorage)
  const [vocabItems, setVocabItems] = useState<VocabItem[]>([]);
  const [puzzles, setPuzzles] = useState<GrammarPuzzle[]>([]);
  const [whiteboardTabs, setWhiteboardTabs] = useState<WhiteboardTab[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sheetUrl, setSheetUrl] = useState('');
  const [syncSource, setSyncSource] = useState<'preset' | 'sheet'>('preset');

  // Load initial data
  useEffect(() => {
    // 1. Vocabulary
    const cachedVocab = localStorage.getItem('vietlearn_vocab');
    if (cachedVocab) {
      setVocabItems(JSON.parse(cachedVocab));
    } else {
      setVocabItems(DEFAULT_VOCAB_ITEMS);
    }

    // 2. Grammar Puzzles
    const cachedPuzzles = localStorage.getItem('vietlearn_puzzles');
    if (cachedPuzzles) {
      setPuzzles(JSON.parse(cachedPuzzles));
    } else {
      setPuzzles(DEFAULT_GRAMMAR_PUZZLES);
    }

    // 3. Whiteboard Notebook Pages
    const cachedWhiteboard = localStorage.getItem('vietlearn_whiteboard');
    if (cachedWhiteboard) {
      setWhiteboardTabs(JSON.parse(cachedWhiteboard));
    } else {
      // Default sample notebook tabs
      setWhiteboardTabs([
        {
          id: 'tab-1',
          title: 'Bài học 1: Chào hỏi',
          lines: [
            {
              id: 'l1',
              viText: 'Xin chào cô giáo, em tên là David.',
              fullEnText: 'Hello teacher, my name is David.',
              words: [
                { id: 'w1_1', vi: 'Xin chào', en: 'Hello' },
                { id: 'w1_2', vi: 'cô giáo', en: 'teacher' },
                { id: 'w1_3', vi: 'em', en: 'I (student)' },
                { id: 'w1_4', vi: 'tên là', en: 'named as' },
                { id: 'w1_5', vi: 'David', en: 'David' }
              ]
            },
            {
              id: 'l2',
              viText: 'Tôi rất vui được gặp bạn.',
              fullEnText: 'I am very happy to meet you.',
              words: [
                { id: 'w2_1', vi: 'Tôi', en: 'I' },
                { id: 'w2_2', vi: 'rất vui', en: 'very glad' },
                { id: 'w2_3', vi: 'được gặp', en: 'to get to meet' },
                { id: 'w2_4', vi: 'bạn', en: 'you' }
              ]
            }
          ]
        },
        {
          id: 'tab-2',
          title: 'Bài học 2: Ẩm thực',
          lines: [
            {
              id: 'l3',
              viText: 'Tôi muốn ăn một bát phở bò chín.',
              fullEnText: 'I want to eat a bowl of well-done beef Pho.',
              words: [
                { id: 'w3_1', vi: 'Tôi', en: 'I' },
                { id: 'w3_2', vi: 'muốn ăn', en: 'want to eat' },
                { id: 'w3_3', vi: 'một bát', en: 'a bowl of' },
                { id: 'w3_4', vi: 'phở bò', en: 'beef Pho' },
                { id: 'w3_5', vi: 'chín', en: 'cooked / well-done' }
              ]
            }
          ]
        }
      ]);
    }

    // 4. Chat history
    const cachedChat = localStorage.getItem('vietlearn_chat');
    if (cachedChat) {
      setChatMessages(JSON.parse(cachedChat));
    }

    // 5. Configs
    const cachedUrl = localStorage.getItem('vietlearn_sheet_url') || '';
    setSheetUrl(cachedUrl);
    setSyncSource(cachedUrl ? 'sheet' : 'preset');
  }, []);

  // Sync callbacks to state and LocalStorage
  const handleUpdateVocab = (updated: VocabItem[]) => {
    setVocabItems(updated);
    localStorage.setItem('vietlearn_vocab', JSON.stringify(updated));
  };

  const handleUpdatePuzzles = (updated: GrammarPuzzle[]) => {
    setPuzzles(updated);
    localStorage.setItem('vietlearn_puzzles', JSON.stringify(updated));
  };

  const handleUpdateWhiteboard = (updated: WhiteboardTab[]) => {
    setWhiteboardTabs(updated);
    localStorage.setItem('vietlearn_whiteboard', JSON.stringify(updated));
  };

  const handleAddChatMessage = (msg: ChatMessage) => {
    const updated = [...chatMessages, msg];
    setChatMessages(updated);
    localStorage.setItem('vietlearn_chat', JSON.stringify(updated));
  };

  const handleUpdateChatMessage = (id: string, updatedFields: Partial<ChatMessage>) => {
    setChatMessages(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...updatedFields } : m);
      localStorage.setItem('vietlearn_chat', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearChatHistory = () => {
    setChatMessages([]);
    localStorage.removeItem('vietlearn_chat');
  };

  const handleSyncComplete = (newVocab: VocabItem[], newPuzzles: GrammarPuzzle[], newWhiteboard: WhiteboardTab[], newSheetUrl: string) => {
    setVocabItems(newVocab);
    setPuzzles(newPuzzles.length > 0 ? newPuzzles : DEFAULT_GRAMMAR_PUZZLES);
    if (newWhiteboard && newWhiteboard.length > 0) {
      setWhiteboardTabs(newWhiteboard);
      localStorage.setItem('vietlearn_whiteboard', JSON.stringify(newWhiteboard));
    }
    setSheetUrl(newSheetUrl);
    setSyncSource('sheet');

    localStorage.setItem('vietlearn_vocab', JSON.stringify(newVocab));
    if (newPuzzles.length > 0) {
      localStorage.setItem('vietlearn_puzzles', JSON.stringify(newPuzzles));
    }
    localStorage.setItem('vietlearn_sheet_url', newSheetUrl);
  };

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col font-sans" id="app-root">
      {/* 1. Universal Top Header */}
      <Header 
        sheetSynced={!!sheetUrl} 
        onOpenSyncModal={() => setIsSyncModalOpen(true)} 
        syncSource={syncSource}
      />

      {/* 2. Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col">
        {/* Navigation Tabs for Modules */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <button
            onClick={() => setActiveTab('vocab')}
            className={`flex items-center justify-center space-x-2.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
              activeTab === 'vocab'
                ? 'bg-white text-slate-900 border-yellow-400 shadow-md font-black'
                : 'bg-white/60 hover:bg-white text-slate-500 border-transparent hover:text-slate-800 font-semibold'
            }`}
            id="tab-vocab"
          >
            <BookOpen className={`w-5 h-5 ${activeTab === 'vocab' ? 'text-orange-500' : 'text-slate-400'}`} />
            <span className="text-xs">1. Kho Từ Vựng</span>
          </button>

          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex items-center justify-center space-x-2.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
              activeTab === 'grammar'
                ? 'bg-white text-slate-900 border-yellow-400 shadow-md font-black'
                : 'bg-white/60 hover:bg-white text-slate-500 border-transparent hover:text-slate-800 font-semibold'
            }`}
            id="tab-grammar"
          >
            <Sparkles className={`w-5 h-5 ${activeTab === 'grammar' ? 'text-orange-500' : 'text-slate-400'}`} />
            <span className="text-xs">2. Ghép từ Ngữ pháp</span>
          </button>

          <button
            onClick={() => setActiveTab('whiteboard')}
            className={`flex items-center justify-center space-x-2.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
              activeTab === 'whiteboard'
                ? 'bg-white text-slate-900 border-yellow-400 shadow-md font-black'
                : 'bg-white/60 hover:bg-white text-slate-500 border-transparent hover:text-slate-800 font-semibold'
            }`}
            id="tab-whiteboard"
          >
            <FileText className={`w-5 h-5 ${activeTab === 'whiteboard' ? 'text-orange-500' : 'text-slate-400'}`} />
            <span className="text-xs">3. Bảng trắng dịch</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center justify-center space-x-2.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-slate-900 border-yellow-400 shadow-md font-black'
                : 'bg-white/60 hover:bg-white text-slate-500 border-transparent hover:text-slate-800 font-semibold'
            }`}
            id="tab-chat"
          >
            <MessageSquare className={`w-5 h-5 ${activeTab === 'chat' ? 'text-orange-500' : 'text-slate-400'}`} />
            <span className="text-xs">4. Chat cùng AI</span>
          </button>
        </div>

        {/* Modular Content Display with Fade animations */}
        <div className="flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              {activeTab === 'vocab' && (
                <VocabModule 
                  vocabItems={vocabItems} 
                  onUpdateVocab={handleUpdateVocab} 
                  onOpenSyncModal={() => setIsSyncModalOpen(true)}
                />
              )}

              {activeTab === 'grammar' && (
                <GrammarModule 
                  puzzles={puzzles}
                />
              )}

              {activeTab === 'whiteboard' && (
                <WhiteboardModule 
                  tabs={whiteboardTabs} 
                  onUpdateTabs={handleUpdateWhiteboard}
                />
              )}

              {activeTab === 'chat' && (
                <ChatModule 
                  messages={chatMessages} 
                  onAddMessage={handleAddChatMessage}
                  onUpdateMessage={handleUpdateChatMessage}
                  onClearHistory={handleClearChatHistory}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* 3. Global Spreadsheet Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncComplete={handleSyncComplete}
        currentSheetUrl={sheetUrl}
      />

      {/* 4. Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 select-none print:hidden">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-[11px] font-medium space-y-1">
          <p>© 2026 Vietnamese Learning Studio. Thiết kế riêng cho mô hình học tập song ngữ cao cấp.</p>
          <p>Tận dụng sức mạnh của Google Gemini-3.5-flash & Web Speech API để phát triển phản xạ tự nhiên.</p>
        </div>
      </footer>
    </div>
  );
}
