/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { WhiteboardTab, WhiteboardLine, WhiteboardWord } from '../types';
import { 
  FileText, Plus, Trash2, Printer, Sparkles, Loader2, Edit2, Check, X, 
  BookOpen, FolderPlus, ArrowDown, ChevronRight, HelpCircle, FileSpreadsheet, Download, Copy, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WhiteboardModuleProps {
  tabs: WhiteboardTab[];
  onUpdateTabs: (updated: WhiteboardTab[]) => void;
}

export default function WhiteboardModule({ tabs, onUpdateTabs }: WhiteboardModuleProps) {
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);

  // CSV Export state
  const [isExportCsvOpen, setIsExportCsvOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState('');
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(localStorage.getItem('vietlearn_webhook_url') || '');
  const [syncing, setSyncing] = useState(false);

  // Loading indicator map for debounced calls (key: rowId)
  const [loadingLines, setLoadingLines] = useState<Record<string, boolean>>({});

  // Word translation editing state
  const [editingWord, setEditingWord] = useState<{ lineId: string; wordId: string; text: string } | null>(null);

  // Tab renaming state
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState('');

  // Set first tab as active initially
  useEffect(() => {
    if (tabs.length > 0 && !activeTabId) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs]);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Helper: debouncing or API triggering for translating rows
  const translateRow = async (lineId: string, viText: string) => {
    if (!viText.trim()) return;

    setLoadingLines(prev => ({ ...prev, [lineId]: true }));
    try {
      const response = await fetch('/api/translate-whiteboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: viText })
      });

      if (!response.ok) throw new Error("Biên dịch dòng bảng trắng thất bại");
      const data = await response.json();
 
      // Update that line inside active tab
      const updatedTabs = tabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            lines: tab.lines.map(line => {
              if (line.id === lineId) {
                return {
                  ...line,
                  viText: viText,
                  fullEnText: data.fullTranslation,
                  words: data.words.map((w: any, idx: number) => ({
                    id: `word-${idx}-${Date.now()}`,
                    vi: w.vi,
                    en: w.en
                  }))
                };
              }
              return line;
            })
          };
        }
        return tab;
      });
 
      onUpdateTabs(updatedTabs);
    } catch (err: any) {
      console.error(err);
      // Update the line in active tab with friendly error instructions
      const updatedTabs = tabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            lines: tab.lines.map(line => {
              if (line.id === lineId) {
                return {
                  ...line,
                  fullEnText: "Lỗi AI: Vui lòng kiểm tra phím GEMINI_API_KEY trong cấu hình Secrets.",
                  words: [
                    { id: `err-${Date.now()}-1`, vi: "Lỗi kết nối", en: "AI Connection Error" },
                    { id: `err-${Date.now()}-2`, vi: "Cấu hình", en: "Check API Key Secrets" }
                  ]
                };
              }
              return line;
            })
          };
        }
        return tab;
      });
      onUpdateTabs(updatedTabs);
    } finally {
      setLoadingLines(prev => ({ ...prev, [lineId]: false }));
    }
  };

  // Add line to active tab
  const handleAddLine = () => {
    if (!activeTabId) return;

    const newLine: WhiteboardLine = {
      id: `line-${Date.now()}`,
      viText: '',
      fullEnText: '',
      words: []
    };

    const updatedTabs = tabs.map(tab => {
      if (tab.id === activeTabId) {
        return {
          ...tab,
          lines: [...tab.lines, newLine]
        };
      }
      return tab;
    });

    onUpdateTabs(updatedTabs);
  };

  // Update line text (typing)
  const handleLineTextChange = (lineId: string, value: string) => {
    const updatedTabs = tabs.map(tab => {
      if (tab.id === activeTabId) {
        return {
          ...tab,
          lines: tab.lines.map(line => {
            if (line.id === lineId) {
              return { ...line, viText: value };
            }
            return line;
          })
        };
      }
      return tab;
    });
    onUpdateTabs(updatedTabs);
  };

  // Delete line
  const handleDeleteLine = (lineId: string) => {
    const updatedTabs = tabs.map(tab => {
      if (tab.id === activeTabId) {
        return {
          ...tab,
          lines: tab.lines.filter(line => line.id !== lineId)
        };
      }
      return tab;
    });
    onUpdateTabs(updatedTabs);
  };

  // Update Word segment (Vietnamese or English value)
  const handleWordSegmentChange = (lineId: string, wordId: string, field: 'vi' | 'en', value: string) => {
    const updatedTabs = tabs.map(tab => {
      if (tab.id === activeTabId) {
        return {
          ...tab,
          lines: tab.lines.map(line => {
            if (line.id === lineId) {
              return {
                ...line,
                words: line.words.map(w => {
                  if (w.id === wordId) {
                    return { ...w, [field]: value };
                  }
                  return w;
                })
              };
            }
            return line;
          })
        };
      }
      return tab;
    });
    onUpdateTabs(updatedTabs);
  };

  // Delete word from line
  const handleDeleteWord = (lineId: string, wordId: string) => {
    const updatedTabs = tabs.map(tab => {
      if (tab.id === activeTabId) {
        return {
          ...tab,
          lines: tab.lines.map(line => {
            if (line.id === lineId) {
              return {
                ...line,
                words: line.words.filter(w => w.id !== wordId)
              };
            }
            return line;
          })
        };
      }
      return tab;
    });
    onUpdateTabs(updatedTabs);
  };

  // Add empty word to line
  const handleAddWord = (lineId: string) => {
    const updatedTabs = tabs.map(tab => {
      if (tab.id === activeTabId) {
        return {
          ...tab,
          lines: tab.lines.map(line => {
            if (line.id === lineId) {
              return {
                ...line,
                words: [
                  ...line.words,
                  {
                    id: `word-added-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    vi: 'Từ mới',
                    en: 'New word'
                  }
                ]
              };
            }
            return line;
          })
        };
      }
      return tab;
    });
    onUpdateTabs(updatedTabs);
  };

  // Update line smooth english translation
  const handleLineFullEnChange = (lineId: string, value: string) => {
    const updatedTabs = tabs.map(tab => {
      if (tab.id === activeTabId) {
        return {
          ...tab,
          lines: tab.lines.map(line => {
            if (line.id === lineId) {
              return { ...line, fullEnText: value };
            }
            return line;
          })
        };
      }
      return tab;
    });
    onUpdateTabs(updatedTabs);
  };

  // Update line grammar note
  const handleLineGrammarChange = (lineId: string, value: string) => {
    const updatedTabs = tabs.map(tab => {
      if (tab.id === activeTabId) {
        return {
          ...tab,
          lines: tab.lines.map(line => {
            if (line.id === lineId) {
              return { ...line, grammar: value };
            }
            return line;
          })
        };
      }
      return tab;
    });
    onUpdateTabs(updatedTabs);
  };

  // AI suggest grammar explanation
  const handleSuggestGrammar = async (lineId: string, viSentence: string, enSentence: string) => {
    setLoadingLines(prev => ({ ...prev, [lineId]: true }));
    try {
      const response = await fetch('/api/explain-grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viSentence, enSentence })
      });
      if (!response.ok) throw new Error("Gợi ý ngữ pháp thất bại");
      const data = await response.json();

      const updatedTabs = tabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            lines: tab.lines.map(line => {
              if (line.id === lineId) {
                return { ...line, grammar: data.explanation };
              }
              return line;
            })
          };
        }
        return tab;
      });
      onUpdateTabs(updatedTabs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLines(prev => ({ ...prev, [lineId]: false }));
    }
  };

  // Quick split words helper based on Vietnamese spaces
  const handleAutoSplitWords = (lineId: string, viText: string) => {
    if (!viText.trim()) return;
    const splitWords = viText.split(/\s+/).filter(Boolean);
    const newWords = splitWords.map((word, idx) => ({
      id: `word-split-${idx}-${Date.now()}`,
      vi: word,
      en: 'Translate'
    }));

    const updatedTabs = tabs.map(tab => {
      if (tab.id === activeTabId) {
        return {
          ...tab,
          lines: tab.lines.map(line => {
            if (line.id === lineId) {
              return { ...line, words: newWords };
            }
            return line;
          })
        };
      }
      return tab;
    });
    onUpdateTabs(updatedTabs);
  };

  // Add new tab
  const handleAddTab = () => {
    const newTabId = `tab-${Date.now()}`;
    const newTab: WhiteboardTab = {
      id: newTabId,
      title: `Bài học ${tabs.length + 1}`,
      lines: [
        {
          id: `line-${Date.now()}`,
          viText: 'Hôm nay chúng ta học tiếng Việt',
          fullEnText: 'Today we learn Vietnamese',
          words: [
            { id: 'w1', vi: 'Hôm nay', en: 'Today' },
            { id: 'w2', vi: 'chúng ta', en: 'we' },
            { id: 'w3', vi: 'học', en: 'learn' },
            { id: 'w4', vi: 'tiếng Việt', en: 'Vietnamese' }
          ]
        }
      ]
    };

    onUpdateTabs([...tabs, newTab]);
    setActiveTabId(newTabId);
  };

  // Delete tab
  const handleDeleteTab = (tabId: string) => {
    if (tabs.length <= 1) return; // Prevent deleting last tab
    const updatedTabs = tabs.filter(t => t.id !== tabId);
    onUpdateTabs(updatedTabs);
    if (activeTabId === tabId) {
      setActiveTabId(updatedTabs[0].id);
    }
  };

  // Rename tab
  const startRenameTab = (tab: WhiteboardTab) => {
    setRenamingTabId(tab.id);
    setRenamingTitle(tab.title);
  };

  const saveRenameTab = () => {
    if (!renamingTitle.trim() || !renamingTabId) return;

    const updated = tabs.map(t => {
      if (t.id === renamingTabId) {
        return { ...t, title: renamingTitle.trim() };
      }
      return t;
    });

    onUpdateTabs(updated);
    setRenamingTabId(null);
  };

  // Export to Print / PDF layout trigger (Uses popup to bypass AI Studio iframe restrictions)
  const handleExportPdf = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Vietnamese Lesson Notebook - ${activeTab?.title || 'Bảng trắng'}</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                .header { border-bottom: 3px solid #0f172a; padding-bottom: 16px; margin-bottom: 32px; }
                .title { font-size: 24px; font-weight: 900; margin: 0; color: #0f172a; }
                .subtitle { font-size: 14px; color: #64748b; margin: 4px 0 0 0; }
                .line-container { border-bottom: 1px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 24px; }
                .line-num { font-size: 12px; font-weight: 800; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; }
                .vi-text { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
                .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; letter-spacing: 0.05em; }
                .words-flex { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
                .word-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 8px; text-align: center; }
                .word-vi { font-size: 12px; font-weight: 700; color: #0f172a; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px; }
                .word-en { font-size: 9px; font-weight: 700; color: #ea580c; text-transform: uppercase; margin-top: 4px; }
                .en-text { font-size: 14px; font-weight: 700; color: #ea580c; margin-bottom: 12px; }
                .grammar { font-size: 12px; color: #475569; background: #f8fafc; border-left: 3px solid #fbbf24; padding: 12px; border-radius: 4px; margin: 0; white-space: pre-wrap; font-family: inherit; }
                @media print {
                  body { padding: 20px; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1 class="title">Vietnamese Lesson Notebook</h1>
                <p class="subtitle">Giáo án học tiếng Việt song ngữ: ${activeTab?.title || 'Bài giảng mới'}</p>
              </div>
              <div class="space-y-8">
                ${activeTab?.lines.map((line, idx) => `
                  <div class="line-container">
                    <div class="line-num">#Dòng ${idx + 1}</div>
                    <div style="margin-bottom: 12px;">
                      <div class="section-title">Tiếng Việt</div>
                      <div class="vi-text">${line.viText || '<em>Trống</em>'}</div>
                    </div>
                    ${line.words && line.words.length > 0 ? `
                      <div style="margin-bottom: 12px;">
                        <div class="section-title">Dịch từng từ (Word by Word)</div>
                        <div class="words-flex">
                          ${line.words.map(w => `
                            <div class="word-card">
                              <div class="word-vi">${w.vi}</div>
                              <div class="word-en">${w.en}</div>
                            </div>
                          `).join('')}
                        </div>
                      </div>
                    ` : ''}
                    <div style="margin-bottom: 12px;">
                      <div class="section-title">Dịch mượt (Smooth Translation)</div>
                      <div class="en-text">"${line.fullEnText || '<em>Chưa dịch</em>'}"</div>
                    </div>
                    ${line.grammar ? `
                      <div>
                        <div class="section-title">Phân tích ngữ pháp (Grammar Notes)</div>
                        <pre class="grammar">${line.grammar}</pre>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        // Fallback if popup is blocked
        window.print();
      }
    } catch (e) {
      console.error("Popup window print blocked, falling back to window.print()", e);
      window.print();
    }
  };

  const generateWhiteboardCSV = () => {
    // Generate CSV headers
    let csv = "Tiêu đề Tab,Câu Tiếng Việt,Dịch mượt,Từ vựng bóc tách,Ngữ pháp\n";
    
    tabs.forEach(tab => {
      tab.lines.forEach(line => {
        const title = `"${tab.title.replace(/"/g, '""')}"`;
        const vi = `"${line.viText.replace(/"/g, '""')}"`;
        const en = `"${line.fullEnText.replace(/"/g, '""')}"`;
        
        // Serialize words: vi:en, vi:en
        const serializedWords = line.words.map(w => `${w.vi.replace(/[:,;]/g, ' ')}:${w.en.replace(/[:,;]/g, ' ')}`).join(', ');
        const words = `"${serializedWords.replace(/"/g, '""')}"`;
        
        const grammar = line.grammar ? `"${line.grammar.replace(/"/g, '""')}"` : '""';
        
        csv += `${title},${vi},${en},${words},${grammar}\n`;
      });
    });
    
    return csv;
  };

  const handleOpenExportCsv = () => {
    const csv = generateWhiteboardCSV();
    setCsvPreview(csv);
    setIsExportCsvOpen(true);
  };

  const handleDownloadCsv = () => {
    const csv = generateWhiteboardCSV();
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vietlearn_whiteboard_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCsv = () => {
    navigator.clipboard.writeText(csvPreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSyncToSheet = async () => {
    if (!webhookUrl) {
        alert("Vui lòng nhập Webhook URL của Google Apps Script");
        return;
    }
    setSyncing(true);
    try {
        const response = await fetch('/api/sync-to-sheet', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ webhookUrl, data: tabs, type: 'whiteboard' })
        });
        if (!response.ok) throw new Error("Sync failed");
        localStorage.setItem('vietlearn_webhook_url', webhookUrl);
        alert("Đồng bộ lên Sheet thành công!");
    } catch (e) {
        alert("Có lỗi xảy ra khi đồng bộ.");
    } finally {
        setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar for whiteboard */}
      <div className="bg-white rounded-2xl border-2 border-yellow-400/50 p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-700">
            <FileText className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-xs font-extrabold text-slate-900">Notebook Bảng trắng dịch nghĩa song ngữ</h3>
              <p className="text-[10px] text-slate-500 font-medium">Giáo viên soạn giáo án, dịch từ vựng song song theo thời gian thực.</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 flex-wrap gap-2">
            {/* Add notebook tab */}
            <button
              onClick={handleAddTab}
              className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Thêm Tab bài giảng</span>
            </button>

            {/* Sync to Sheet */}
            <button
              onClick={handleSyncToSheet}
              disabled={syncing}
              className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-sky-600/15 transition-all cursor-pointer disabled:opacity-50"
            >
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Đồng bộ lên Sheet</span>
            </button>

            {/* Delete All Whiteboards */}
            <button
              onClick={() => {
                if (confirm("Bạn có chắc chắn muốn xóa tất cả bảng trắng không? Hành động này không thể hoàn tác.")) {
                    const newTab: WhiteboardTab = {
                      id: `tab-${Date.now()}`,
                      title: 'Bài học 1',
                      lines: []
                    };
                    onUpdateTabs([newTab]);
                    setActiveTabId(newTab.id);
                }
              }}
              className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa hết</span>
            </button>

            {/* Export to CSV */}
            <button
              onClick={handleOpenExportCsv}
              className="flex items-center space-x-1.5 bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-green-600/15 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Lưu / Xuất Sheet (CSV)</span>
            </button>

            {/* Export to PDF */}
            <button
              onClick={handleExportPdf}
              className="flex items-center space-x-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-orange-500/15 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Xuất PDF / In ấn</span>
            </button>
          </div>
        </div>

        {/* Webhook URL Input */}
        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <input
            type="text"
            placeholder="Dán Webhook URL của Google Apps Script tại đây..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="flex-1 bg-transparent px-2 py-1 text-xs outline-none font-mono"
          />
        </div>
      </div>

      {/* 2. TAB NAVIGATION BAR */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1.5 px-2 select-none">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isRenaming = tab.id === renamingTabId;

          return (
            <div
              key={tab.id}
              className={`flex items-center space-x-2 border-t-2 border-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-white text-slate-900 border-yellow-400 border-b-white translate-y-[1.5px] z-10'
                  : 'bg-slate-50/50 text-slate-400 border-transparent hover:bg-slate-100/60 hover:text-slate-600 cursor-pointer'
              }`}
              onClick={() => !isRenaming && setActiveTabId(tab.id)}
            >
              {isRenaming ? (
                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={renamingTitle}
                    onChange={(e) => setRenamingTitle(e.target.value)}
                    className="border border-slate-300 rounded-md px-1.5 py-0.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 max-w-[100px]"
                    autoFocus
                  />
                  <button onClick={saveRenameTab} className="p-0.5 bg-orange-100 text-orange-700 rounded cursor-pointer">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => setRenamingTabId(null)} className="p-0.5 bg-rose-100 text-rose-700 rounded cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="truncate max-w-[120px]">{tab.title}</span>
                  <div className="flex items-center space-x-1">
                    {/* Rename icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startRenameTab(tab);
                      }}
                      className="p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                    {/* Delete tab */}
                    {tabs.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTab(tab.id);
                        }}
                        className="p-0.5 text-slate-300 hover:text-rose-500 rounded cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. MAIN WHITEBOARD CANVAS (Notebook Styled with Dot Grid) */}
      <div 
        id="print-section"
        className="bg-white rounded-3xl border-2 border-yellow-400 shadow-md relative p-6 md:p-8 min-h-[500px]"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      >
        {/* Notepad Red Margin Line */}
        <div className="absolute left-10 md:left-14 top-0 bottom-0 w-[1.5px] bg-red-300/80 pointer-events-none"></div>

        <div className="relative pl-10 md:pl-12 space-y-12">
          {activeTab && activeTab.lines.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              Bảng trắng chưa có dòng chữ nào. Hãy click "Thêm dòng bài học mới" bên dưới để bắt đầu soạn!
            </div>
          ) : (
            activeTab && activeTab.lines.map((line, lineIndex) => {
              const isLoading = loadingLines[line.id];

              return (
                <div 
                  key={line.id} 
                  className="relative group/line bg-white/65 border-2 border-slate-100 hover:border-orange-200/50 rounded-3xl p-5 md:p-7 space-y-6 shadow-xs transition-all relative z-10"
                >
                  {/* Header metadata row */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-slate-900 text-white rounded-xl font-mono text-xs font-black shadow-xs">
                        #{lineIndex + 1}
                      </span>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Cấu trúc giáo án lớp học</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Auto AI Translate */}
                      <button
                        onClick={() => translateRow(line.id, line.viText)}
                        disabled={isLoading || !line.viText.trim()}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          line.viText.trim() 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10' 
                            : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                        }`}
                        title="Tự động bóc tách từ vựng & dịch mượt bằng AI"
                      >
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>{isLoading ? "Đang xử lý..." : "Dịch tự động (AI)"}</span>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteLine(line.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Xóa dòng này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 4-ROW LESSON BOARD SCHEMATIC */}
                  <div className="space-y-5 font-sans">
                    
                    {/* DÒNG 1: CÂU TYPING TIẾNG VIỆT */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center space-x-1.5">
                        <span className="w-2 h-2 bg-slate-800 rounded-full"></span>
                        <span>Dòng 1: Câu Typing</span>
                      </div>
                      <div className="md:col-span-9">
                        <input
                          type="text"
                          placeholder="Nhập câu tiếng Việt giảng dạy ở đây..."
                          value={line.viText}
                          onChange={(e) => handleLineTextChange(line.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              translateRow(line.id, line.viText);
                            }
                          }}
                          className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500/20 rounded-2xl px-4 py-3 text-sm sm:text-base font-black text-slate-900 shadow-2xs outline-none transition-all placeholder-slate-300"
                        />
                      </div>
                    </div>

                    {/* DÒNG 2: DỊCH WORD BY WORD (GIÁO VIÊN TỰ DỊCH) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      <div className="md:col-span-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center space-x-1.5 pt-3">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span>Dòng 2: Dịch từng từ</span>
                      </div>
                      <div className="md:col-span-9 space-y-3">
                        {line.words && line.words.length > 0 ? (
                          <div className="flex flex-wrap gap-4 p-4 bg-slate-50/30 border border-slate-100 rounded-2xl shadow-2xs">
                            {line.words.map((word) => (
                              <div 
                                key={word.id} 
                                className="flex flex-col items-center bg-white hover:bg-amber-50/25 border border-slate-200/60 p-2 relative group/word shadow-2xs transition-all min-w-[90px] max-w-[140px]"
                              >
                                {/* Original word segment (Editable) */}
                                <input
                                  type="text"
                                  value={word.vi}
                                  onChange={(e) => handleWordSegmentChange(line.id, word.id, 'vi', e.target.value)}
                                  className="w-full bg-transparent text-center font-black text-slate-900 border-b border-dashed border-transparent focus:border-slate-300 text-xs py-0.5 outline-none font-sans px-1"
                                  placeholder="Từ gốc"
                                />

                                {/* English translation segment (Editable) */}
                                <input
                                  type="text"
                                  value={word.en}
                                  onChange={(e) => handleWordSegmentChange(line.id, word.id, 'en', e.target.value)}
                                  className="w-full bg-transparent text-center font-extrabold text-orange-600 border-b border-dashed border-transparent focus:border-orange-300 text-[9px] mt-1.5 uppercase tracking-wider outline-none font-sans px-1"
                                  placeholder="Nghĩa dịch"
                                />

                                {/* Delete Word Segment Button */}
                                <button
                                  onClick={() => handleDeleteWord(line.id, word.id)}
                                  className="absolute -top-1.5 -right-1.5 bg-slate-200 text-slate-500 hover:bg-rose-500 hover:text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover/word:opacity-100 transition-opacity text-[9px] cursor-pointer shadow-2xs"
                                  title="Xóa từ vựng này"
                                >
                                  ×
                                </button>
                              </div>
                            ))}

                            {/* Quick Add Custom Word bubble */}
                            <button
                              onClick={() => handleAddWord(line.id)}
                              className="flex flex-col items-center justify-center bg-white border border-dashed border-slate-300 hover:border-orange-400 hover:bg-orange-50/10 text-slate-400 hover:text-orange-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer h-[58px] min-w-[50px] shadow-2xs"
                              title="Thêm từ vựng mới"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="text-[8px] uppercase mt-1 tracking-wider font-extrabold">Thêm từ</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 gap-3">
                            <span>Chưa bóc tách từ vựng. Click "Dịch tự động" hoặc tự động phân tích:</span>
                            <button
                              onClick={() => handleAutoSplitWords(line.id, line.viText)}
                              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl text-xs transition-all shadow-2xs cursor-pointer shrink-0"
                            >
                              Tách từ nhanh theo dấu cách
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DÒNG 3: BẢN DỊCH EN MƯỢT (SMOOTH TRANSLATION) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center space-x-1.5">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span>Dòng 3: Dịch mượt</span>
                      </div>
                      <div className="md:col-span-9">
                        <input
                          type="text"
                          placeholder="Nhập hoặc để AI sinh bản dịch tiếng Anh mượt mà..."
                          value={line.fullEnText}
                          onChange={(e) => handleLineFullEnChange(line.id, e.target.value)}
                          className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500/20 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-orange-600 shadow-2xs outline-none transition-all placeholder-slate-300"
                        />
                      </div>
                    </div>

                    {/* DÒNG 4: GIẢI THÍCH NGỮ PHÁP NẾU CÓ */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      <div className="md:col-span-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center space-x-1.5 pt-3">
                        <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                        <span>Dòng 4: Ngữ pháp</span>
                      </div>
                      <div className="md:col-span-9 space-y-2">
                        <textarea
                          placeholder="Ghi chú phân tích ngữ pháp, cấu trúc câu cho học viên dễ ghi nhớ (nếu có)..."
                          value={line.grammar || ''}
                          onChange={(e) => handleLineGrammarChange(line.id, e.target.value)}
                          rows={2}
                          className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500/20 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-2xs outline-none transition-all placeholder-slate-300 resize-none leading-relaxed"
                        />
                        {line.viText.trim() && (
                          <button
                            onClick={() => handleSuggestGrammar(line.id, line.viText, line.fullEnText)}
                            disabled={isLoading}
                            className="flex items-center space-x-1.5 text-[10px] text-orange-600 font-extrabold hover:text-orange-700 hover:underline transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                            <span>Tự động phân tích ngữ pháp nhanh với AI</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Floating line-addition button */}
        <div className="flex justify-center mt-12 relative z-10 pl-10">
          <button
            onClick={handleAddLine}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all duration-200 cursor-pointer active:scale-95 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm dòng bài học mới</span>
          </button>
        </div>
      </div>

      {/* 4. Instructions Card */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 text-xs text-slate-600 leading-relaxed">
        <h4 className="font-bold text-slate-700 mb-2">💡 Hướng dẫn cho Giáo viên & Học sinh:</h4>
        <ul className="space-y-1.5 list-disc pl-4">
          <li>Nhập câu bất kỳ bằng tiếng Việt, sau đó nhấn biểu tượng <Sparkles className="w-3.5 h-3.5 inline text-orange-500" /> hoặc phím <strong>Enter</strong> để AI dịch.</li>
          <li>Hệ thống tự động liên kết nghĩa trọn vẹn cả câu (phía trên) và bóc tách từng từ/cụm từ word-by-word (phía dưới).</li>
          <li>Bạn có thể <strong>click trực tiếp vào nhãn tiếng Anh của từ vựng</strong> bên dưới để chỉnh sửa hoặc điều chỉnh nghĩa dịch theo ý muốn!</li>
          <li>Lưu lại tiến độ bằng cách click nút <strong>Lưu / Xuất Sheet (CSV)</strong> để lưu thành 1 sheet trong file Google Sheets của bạn.</li>
          <li>Click nút <strong>Xuất PDF</strong> để in bài giảng ra giấy hoặc lưu thành tài liệu học tập PDF hoàn chỉnh (đã được tối ưu hóa hiển thị trong AI Studio).</li>
        </ul>
      </div>

      {/* 5. CSV Export Modal Popup */}
      <AnimatePresence>
        {isExportCsvOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border-4 border-yellow-400 max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative"
            >
              {/* Close button */}
              <button
                onClick={() => setIsExportCsvOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 text-emerald-600">
                <FileSpreadsheet className="w-8 h-8 shrink-0" />
                <div>
                  <h3 className="text-base md:text-lg font-black text-slate-900">Sao lưu & Đồng bộ Bảng trắng</h3>
                  <p className="text-[11px] text-slate-500 font-bold">Lưu bài học bảng trắng của bạn vào Google Sheets để đồng bộ hóa bất kỳ lúc nào.</p>
                </div>
              </div>

              {/* Instructions on how to save / reopen */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 text-xs text-slate-600 leading-normal">
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[9px] font-black uppercase">Cách 1: Sao chép nhanh</span>
                  Dán trực tiếp vào Google Sheets
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-500">
                  <li>Click nút <strong>Sao chép CSV</strong> bên dưới.</li>
                  <li>Mở file Google Sheets của bạn, tạo hoặc chọn một tab trống <strong>(ví dụ: Trang tính thứ 3)</strong>.</li>
                  <li>Click chọn ô đầu tiên <strong>A1</strong>, rồi nhấn <strong>Ctrl+V</strong> (hoặc <strong>Cmd+V</strong> trên Mac). Google Sheets sẽ tự động phân chia dữ liệu thành các cột hoàn chỉnh!</li>
                </ol>

                <p className="font-bold text-slate-700 flex items-center gap-1.5 border-t border-slate-200/60 pt-3">
                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[9px] font-black uppercase">Cách 2: Nhập tệp .csv</span>
                  Tải xuống và nhập tệp tin vào Google Sheets
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed pl-1">
                  Click nút <strong>Tải xuống tệp .CSV</strong>. Sau đó tại Google Sheets, vào <strong>Tệp (File) {"->"} Nhập (Import) {"->"} Tải lên (Upload)</strong> và chọn tệp tin vừa tải về.
                </p>
              </div>

              {/* CSV Textarea Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Xem trước nội dung CSV:</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{tabs.reduce((acc, tab) => acc + tab.lines.length, 0)} dòng dữ liệu chuẩn hóa</span>
                </div>
                <textarea
                  readOnly
                  value={csvPreview}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 font-mono text-[10px] text-slate-600 outline-none leading-relaxed select-all"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 items-center justify-end">
                <button
                  type="button"
                  onClick={handleCopyCsv}
                  className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-black">Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao chép CSV</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/15 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải xuống tệp .CSV</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SPECIAL HIDDEN VIEW SPECIFICALLY FOR PRINT MEDIA STYLING */}
      <div className="hidden print:block absolute inset-0 bg-white z-50 p-10 font-sans" id="print-view-layout">
        <div className="border-b-2 border-slate-900 pb-4 mb-8">
          <h1 className="text-2xl font-black text-slate-900">Vietnamese Lesson Notebook</h1>
          <p className="text-sm text-slate-500">Giáo án học tiếng Việt song ngữ: {activeTab?.title}</p>
        </div>

        <div className="space-y-8">
          {activeTab?.lines.map((line, idx) => (
            <div key={line.id} className="border-b-2 border-slate-200 pb-6 space-y-4">
              <div className="text-xs text-slate-400 font-extrabold">#Dòng {idx + 1}</div>
              
              {/* Dòng 1 */}
              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-400 mr-2">Dòng 1 (Typing):</span>
                <span className="text-base font-black text-slate-900">{line.viText}</span>
              </div>

              {/* Dòng 2 */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-extrabold text-slate-400">Dòng 2 (Word by Word):</span>
                <div className="flex flex-wrap gap-4 pt-1">
                  {line.words.map(w => (
                    <div key={w.id} className="flex flex-col items-center bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                      <span className="text-xs font-bold text-slate-850 bg-yellow-100 px-1 border-b border-yellow-400">{w.vi}</span>
                      <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wide mt-1">{w.en}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dòng 3 */}
              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-400 mr-2">Dòng 3 (Dịch mượt):</span>
                <span className="text-sm font-bold text-orange-600">"{line.fullEnText}"</span>
              </div>

              {/* Dòng 4 */}
              {line.grammar && (
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Dòng 4 (Ngữ pháp):</span>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 p-3 rounded-lg whitespace-pre-wrap">{line.grammar}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
