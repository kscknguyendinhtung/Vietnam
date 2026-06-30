/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, FileSpreadsheet, ExternalLink, HelpCircle, Check, Loader2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { extractSpreadsheetId, fetchVocabFromSheet, fetchGrammarFromSheet, fetchWhiteboardFromSheet, SAMPLE_SHEET_URL } from '../utils/sheetParser';
import { VocabItem, GrammarPuzzle, WhiteboardTab } from '../types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: (vocab: VocabItem[], puzzles: GrammarPuzzle[], whiteboard: WhiteboardTab[], sheetUrl: string) => void;
  currentSheetUrl: string;
}

export default function SyncModal({ isOpen, onClose, onSyncComplete, currentSheetUrl }: SyncModalProps) {
  const [sheetUrl, setSheetUrl] = useState(currentSheetUrl || 'https://docs.google.com/spreadsheets/d/1iUyG9kxnwH3L5wqoS9xurfyeZtq4Mjs9v8BGYUN3_Iw/edit?usp=sharing');
  const [vocabSheetName, setVocabSheetName] = useState('vocabulary'); 
  const [grammarSheetName, setGrammarSheetName] = useState('sentence');
  const [whiteboardSheetName, setWhiteboardSheetName] = useState('whiteboard');
  
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleUseSample = () => {
    setSheetUrl('https://docs.google.com/spreadsheets/d/1iUyG9kxnwH3L5wqoS9xurfyeZtq4Mjs9v8BGYUN3_Iw/edit?usp=sharing');
    setVocabSheetName('vocabulary');
    setGrammarSheetName('sentence');
    setWhiteboardSheetName('whiteboard');
    setError(null);
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl) return;

    const id = extractSpreadsheetId(sheetUrl);
    if (!id) {
      setError("Đường dẫn Google Sheet không hợp lệ. Vui lòng kiểm tra lại cấu trúc URL.");
      return;
    }

    setSyncing(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Fetch Vocab (Sheet 1)
      const vocabItems = await fetchVocabFromSheet(id, vocabSheetName);
      
      // 2. Fetch Grammar (Sheet 2)
      let grammarItems: GrammarPuzzle[] = [];
      try {
        grammarItems = await fetchGrammarFromSheet(id, grammarSheetName);
      } catch (err) {
        console.warn("Could not load grammar sheets, using empty list or falling back", err);
        // Sometimes spreadsheet only has 1 sheet, we allow it gracefully
      }

      // 3. Fetch Whiteboard (Sheet 3)
      let whiteboardItems: WhiteboardTab[] = [];
      try {
        whiteboardItems = await fetchWhiteboardFromSheet(id, whiteboardSheetName);
      } catch (err) {
        console.warn("Could not load whiteboard sheets, using empty list", err);
      }

      onSyncComplete(vocabItems, grammarItems, whiteboardItems, sheetUrl);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đồng bộ hóa thất bại. Đảm bảo trang tính đã được Chia sẻ ở chế độ công khai (Bất kỳ ai có liên kết đều có thể xem).");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-yellow-400 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="bg-orange-500/10 text-orange-600 p-2 rounded-xl border border-orange-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Đồng bộ dữ liệu từ Google Sheets</h3>
              <p className="text-[11px] text-slate-500 font-medium">Thiết lập kho từ vựng và câu hỏi ngữ pháp của giáo án riêng bạn</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSync} className="p-6 space-y-6 flex-grow">
          {/* Instructions checklist */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <h4 className="font-extrabold text-slate-700 flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-orange-500" />
              Hướng dẫn cấu hình Google Sheet:
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
              <li>
                Tạo một file Google Sheets mới. Thiết lập <strong>3 Trang tính (Sheets)</strong> theo đúng thứ tự:
              </li>
              <li>
                <strong>Trang tính 1 (whiteboard)</strong>: Có các cột tiêu đề ở dòng 1:
                <div className="font-mono text-[10px] text-slate-500 bg-slate-100/80 p-1.5 rounded-lg mt-1 border border-slate-200/40">
                  Tiêu đề Tab | Câu Tiếng Việt | Dịch mượt | Từ vựng bóc tách | Ngữ pháp
                </div>
              </li>
              <li>
                <strong>Trang tính 2 (vocabulary)</strong>: Có các cột tiêu đề ở dòng 1:
                <div className="font-mono text-[10px] text-slate-500 bg-slate-100/80 p-1.5 rounded-lg mt-1 border border-slate-200/40">
                  Tiếng Việt | Tiếng Anh | Chủ đề | Ví dụ | Dịch ví dụ
                </div>
              </li>
              <li>
                <strong>Trang tính 3 (sentence)</strong>: Có các cột tiêu đề ở dòng 1:
                <div className="font-mono text-[10px] text-slate-500 bg-slate-100/80 p-1.5 rounded-lg mt-1 border border-slate-200/40">
                  Câu Tiếng Việt | Nghĩa Tiếng Anh | Bài
                </div>
              </li>
              <li>
                Nhấn <strong>Chia sẻ (Share)</strong> ở góc phải Google Sheets {"->"} Đổi thành <strong>'Bất kỳ ai có liên kết đều có thể xem' (Anyone with link can view)</strong>. Sao chép link trình duyệt và dán vào ô dưới đây.
              </li>
            </ol>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleUseSample}
                className="text-[11px] font-black text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nhấp vào đây để dùng thử trang tính mẫu có sẵn của chúng tôi</span>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Liên kết Google Sheet (Spreadsheet URL) *</label>
              <input
                type="url"
                required
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
              />

              {/* Dynamic GID Helper */}
              {(() => {
                const match = sheetUrl.match(/[#&]gid=([0-9]+)/);
                const detectedGid = match ? match[1] : null;
                if (!detectedGid) return null;
                return (
                  <div className="mt-2.5 p-3 bg-orange-50 border border-orange-100/70 rounded-2xl text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-orange-800 shadow-3xs animate-fade-in">
                    <span className="font-semibold leading-relaxed">
                      💡 Phát hiện mã GID <code className="bg-orange-100 px-1.5 py-0.5 rounded font-mono text-xs font-black">{detectedGid}</code> từ liên kết của bạn. Gán GID này cho:
                    </span>
                    <div className="flex gap-1.5 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setVocabSheetName(detectedGid)}
                        className="px-2.5 py-1 bg-white hover:bg-orange-100/50 border border-orange-200 rounded-lg font-extrabold text-[10px] cursor-pointer transition-all active:scale-95"
                      >
                        Trang Từ vựng
                      </button>
                      <button
                        type="button"
                        onClick={() => setGrammarSheetName(detectedGid)}
                        className="px-2.5 py-1 bg-white hover:bg-orange-100/50 border border-orange-200 rounded-lg font-extrabold text-[10px] cursor-pointer transition-all active:scale-95"
                      >
                        Trang Ngữ pháp
                      </button>
                      <button
                        type="button"
                        onClick={() => setWhiteboardSheetName(detectedGid)}
                        className="px-2.5 py-1 bg-white hover:bg-orange-100/50 border border-orange-200 rounded-lg font-extrabold text-[10px] cursor-pointer transition-all active:scale-95"
                      >
                        Trang Bảng trắng
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên / GID Trang tính 1 (Từ vựng)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Sheet1 hoặc 0"
                  value={vocabSheetName}
                  onChange={(e) => setVocabSheetName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Mặc định: "0" đại diện cho trang tính đầu tiên.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên / GID Trang tính 2 (Ngữ pháp)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Sheet2 hoặc 1"
                  value={grammarSheetName}
                  onChange={(e) => setGrammarSheetName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Sử dụng để tạo trò chơi sắp xếp câu.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên / GID Trang tính 3 (Bảng trắng)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Sheet3 hoặc 2"
                  value={whiteboardSheetName}
                  onChange={(e) => setWhiteboardSheetName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Sử dụng để đồng bộ hóa bài giảng trên bảng trắng.</p>
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="space-y-3">
              {error.includes('404') ? (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 space-y-4 text-rose-950 text-xs leading-relaxed shadow-xs">
                  <div className="flex items-center space-x-2 pb-2.5 border-b border-rose-100 text-rose-800">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <span className="font-black text-[13px]">Lỗi kết nối Google Sheet (Mã lỗi: 404)</span>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-700">Mã lỗi 404 thường xảy ra do một trong hai nguyên nhân chính sau đây. Vui lòng kiểm tra kỹ và làm theo hướng dẫn sau:</p>
                    
                    <div className="bg-white/90 p-4 rounded-xl border border-rose-100 space-y-2.5">
                      <h5 className="font-black text-rose-700 flex items-center gap-1.5 text-xs">
                        <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">Nguyên nhân 1</span>
                        Trang tính chưa được chia sẻ công khai
                      </h5>
                      <p className="text-slate-600 text-[11px] leading-normal pl-1">
                        Tài liệu Google Sheet của bạn đang ở chế độ <strong>Riêng tư (Chỉ mình tôi)</strong>. Google sẽ trả về lỗi 404 để bảo mật tệp tin.
                      </p>
                      <p className="text-rose-800 font-bold text-[11px] pl-1 leading-normal">
                        👉 <strong>Cách sửa đổi:</strong> Mở file Google Sheet của bạn {"->"} Nhấp nút <strong>Chia sẻ (Share)</strong> ở góc phải {"->"} Đổi quyền truy cập chung từ "Hạn chế" sang <strong>"Bất kỳ ai có liên kết đều có thể xem" (Anyone with the link can view)</strong>.
                      </p>
                    </div>

                    <div className="bg-white/90 p-4 rounded-xl border border-rose-100 space-y-2.5">
                      <h5 className="font-black text-rose-700 flex items-center gap-1.5 text-xs">
                        <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">Nguyên nhân 2</span>
                        Sai mã GID hoặc tên Trang tính
                      </h5>
                      <p className="text-slate-600 text-[11px] leading-normal pl-1">
                        Mặc định trang tính thứ 2 <strong>không bao giờ có GID là 1</strong>. Nếu nhập sai mã GID, Google Sheets sẽ trả về lỗi 404 không tìm thấy.
                      </p>
                      <p className="text-rose-800 font-bold text-[11px] pl-1 leading-normal">
                        👉 <strong>Cách sửa đổi:</strong> Nhấp vào tab trang tính thứ 2 trên trình duyệt của bạn (Trang Ngữ pháp), sao chép phần dãy số cuối link có dạng <code>#gid=XXXXXX</code> (ví dụ: <code>198302198</code>) và dán chính xác vào ô GID bên trên, hoặc nhập đúng tên tab (ví dụ: <code>Sheet2</code> hoặc <code>Ngữ pháp</code>).
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start space-x-2 text-rose-800 text-xs leading-relaxed">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center space-x-2 text-green-800 text-xs font-bold">
              <Check className="w-5 h-5 text-green-500 shrink-0" />
              <span>Đồng bộ hóa thành công! Dữ liệu mới đã sẵn sàng.</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex justify-end space-x-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={syncing}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/15 flex items-center space-x-1.5 cursor-pointer disabled:bg-slate-300 disabled:shadow-none"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tải và phân tích...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Cập nhật Đồng bộ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
