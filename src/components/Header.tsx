/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, RefreshCw, FileSpreadsheet, Globe } from 'lucide-react';

interface HeaderProps {
  sheetSynced: boolean;
  onOpenSyncModal: () => void;
  syncSource: 'preset' | 'sheet';
}

export default function Header({ sheetSynced, onOpenSyncModal, syncSource }: HeaderProps) {
  return (
    <header className="bg-white border-b-4 border-yellow-400 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg text-white">
            <span className="text-white font-black text-lg tracking-tighter">VN</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              HọcTiếngViệt <span className="text-orange-500">Pro</span>
              <span className="text-[10px] bg-orange-50 text-orange-700 font-bold px-2 py-0.5 rounded-full border border-orange-100">
                Bilingual v2.5
              </span>
            </h1>
            <p className="text-[11px] font-bold text-slate-500 hidden sm:block">
              Phát triển ngôn ngữ cho Giáo viên & Học sinh Việt - Anh
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Status badge for source */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 ${
              syncSource === 'sheet' 
                ? 'bg-green-100 text-green-700 border-green-400' 
                : 'bg-yellow-50 text-amber-700 border-yellow-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${syncSource === 'sheet' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
              <span>{syncSource === 'sheet' ? 'Google Sheet Connected' : 'Preset Lesson Data'}</span>
            </div>
          </div>

          {/* Sync Button */}
          <button
            onClick={onOpenSyncModal}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all duration-200 cursor-pointer active:scale-95"
            id="sync-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Đồng bộ Sheet</span>
          </button>
        </div>
      </div>
    </header>
  );
}
