
import React, { useState } from 'react';
import { SheetConfig, UserRole, User } from '../types';

interface AdminSettingsProps {
  config: SheetConfig;
  onSave: (config: SheetConfig) => void;
  onSync: () => void;
  onPull: () => void;
  theme: 'light' | 'dark';
  t: (key: string) => string;
  user: User;
  users: User[];
  onAddUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ 
  config, onSave, onSync, onPull, theme, t, user, users, onAddUser, onDeleteUser 
}) => {
  const [url, setUrl] = useState(config.scriptUrl);
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [pullLock, setPullLock] = useState(config.pullLock || false);

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    username: '',
    password: '',
    role: UserRole.STAFF
  });

  // VERSI FINAL APPS SCRIPT - WAJIB DISALIN KE GOOGLE SHEETS
  const appsScriptCode = `function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Inventory");
  
  // Inisialisasi sheet jika belum ada
  if (!sheet) {
    sheet = ss.insertSheet("Inventory");
    sheet.appendRow(["id", "name", "category", "size", "expectedQty", "actualQty", "minStockThreshold", "dailyUsage", "unit", "location", "usageType", "status", "condition", "lastUpdated", "updatedBy", "notes"]);
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var params = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Kelola Tab Logs (Audit Trail)
  var logSheet = ss.getSheetByName("Logs");
  if (!logSheet) {
    logSheet = ss.insertSheet("Logs");
    logSheet.appendRow(["Timestamp", "User", "Role", "Activity", "Details"]);
    logSheet.getRange("A1:E1").setFontWeight("bold").setBackground("#f3f3f3").setBorder(true, true, true, true, true, true);
  }
  
  // Catat aktivitas jika ada dalam payload
  if (params.log) {
    logSheet.appendRow([
      params.log.timestamp,
      params.log.user,
      params.log.role,
      params.log.activity,
      params.log.details
    ]);
  }

  // 2. Kelola Tab Inventory (Data Utama)
  var invSheet = ss.getSheetByName("Inventory");
  if (!invSheet) invSheet = ss.insertSheet("Inventory");

  if (params.action === 'sync') {
    invSheet.clear();
    var headers = ["id", "name", "category", "size", "expectedQty", "actualQty", "minStockThreshold", "dailyUsage", "unit", "location", "usageType", "status", "condition", "lastUpdated", "updatedBy", "notes"];
    invSheet.appendRow(headers);
    
    if (params.payload && params.payload.length > 0) {
      params.payload.forEach(function(item) {
        var row = headers.map(function(h) { return item[h] || ""; });
        invSheet.appendRow(row);
      });
    }
  }
  
  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}`;

  const handleSave = () => {
    onSave({ scriptUrl: url, isConnected: url.length > 10, autoSync, pullLock });
    alert("Konfigurasi Cloud & Proteksi Database Berhasil Disimpan!");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    alert("KODE SKRIP TERBARU DISALIN!\n\nSilakan hapus kode lama di Apps Script Anda dan tempel kode ini.");
  };

  const handleCopyLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = config.scriptUrl 
      ? `${baseUrl}?script=${encodeURIComponent(config.scriptUrl)}`
      : baseUrl;
      
    navigator.clipboard.writeText(shareUrl);
    alert("LINK SISTEM DISALIN!");
  };

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-800';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';
  const cardClass = `p-8 rounded-3xl shadow-sm border transition-all ${
    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
  }`;

  const isLeaderOrAdmin = user.role === UserRole.LEADER || user.role === UserRole.ADMIN;

  const inputClass = `w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className={`text-3xl font-extrabold ${textPrimary}`}>Integrasi & Keamanan Cloud</h2>
          <p className={textSecondary}>Audit Log akan mencatat setiap aktivitas di tab "Logs" Spreadsheet Anda.</p>
        </div>
        <button 
          onClick={handleCopyLink}
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <i className="fas fa-share-nodes"></i>
          <span>BAGIKAN LINK SISTEM</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cloud Connection Panel */}
        <div className={cardClass}>
          <div className="flex justify-between items-start mb-6">
            <h3 className={`text-xl font-bold flex items-center ${textPrimary}`}>
              <div className="bg-green-500/10 p-3 rounded-2xl mr-4">
                <i className="fab fa-google-drive text-green-500"></i>
              </div>
              Database Google Sheets
            </h3>
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[9px] font-black rounded-full border border-indigo-500/20">
              <i className="fas fa-history mr-1"></i> AUDIT LOG ACTIVE
            </span>
          </div>
          
          <div className="space-y-6">
            {isLeaderOrAdmin ? (
              <>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${textSecondary}`}>Web App URL (Apps Script)</label>
                  <input 
                    type="text" 
                    placeholder="https://script.google.com/macros/s/..."
                    className={inputClass}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                    <div>
                      <p className={`text-sm font-bold ${textPrimary}`}>Auto-Sync (Real-time Push)</p>
                      <p className="text-[10px] text-slate-500">Setiap perubahan langsung dicatat ke Cloud & Logs.</p>
                    </div>
                    <button 
                      onClick={() => setAutoSync(!autoSync)}
                      className={`w-12 h-6 rounded-full transition-all relative ${autoSync ? 'bg-green-500' : 'bg-slate-400'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoSync ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                    <div>
                      <p className={`text-sm font-bold ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`}>Database Safety Lock</p>
                      <p className="text-[10px] text-slate-500">Cegah Cloud menghapus data Web App jika sheet kosong.</p>
                    </div>
                    <button 
                      onClick={() => setPullLock(!pullLock)}
                      className={`w-12 h-6 rounded-full transition-all relative ${pullLock ? 'bg-rose-500' : 'bg-slate-400'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${pullLock ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>

                <button onClick={handleSave} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-indigo-700 transition-all active:scale-95">SIMPAN KONFIGURASI</button>
              </>
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <i className="fas fa-lock text-3xl text-slate-400 mb-4"></i>
                <p className="text-sm font-bold opacity-60">Hanya Admin atau Leader yang dapat mengatur koneksi Cloud.</p>
              </div>
            )}
          </div>
        </div>

        {/* Audit Info Panel */}
        <div className={cardClass}>
           <h3 className={`text-xl font-bold mb-6 flex items-center ${textPrimary}`}>
            <i className="fas fa-shield-halved text-indigo-500 mr-3"></i>
            Keamanan & Persistensi
          </h3>
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
              <p className="text-xs font-bold mb-2">Manfaat Pembaruan Skrip:</p>
              <ul className="text-[11px] space-y-2 text-slate-500 list-disc pl-4">
                <li><b>Audit Trail:</b> Riwayat siapa yang Login, Push, dan Pull tercatat di tab <i>Logs</i>.</li>
                <li><b>Anti-Wipe:</b> Data Web App tidak akan hilang meskipun spreadsheet dihapus orang lain.</li>
                <li><b>Menu Persistence:</b> Aplikasi mengingat menu terakhir Anda meskipun browser direfresh.</li>
              </ul>
            </div>
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
              <p className="text-[10px] text-amber-600 font-bold uppercase mb-1"><i className="fas fa-triangle-exclamation mr-1"></i> INSTRUKSI PENTING</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">Setelah menyalin skrip di bawah, klik <b>"Deploy" > "New Deployment"</b> di Google Sheets, pilih <b>"Web App"</b>, dan pastikan akses disetel ke <b>"Anyone"</b>.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Script Database Section */}
      <div className={cardClass}>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h3 className={`text-xl font-bold flex items-center ${textPrimary}`}>
            <i className="fas fa-code text-indigo-500 mr-3"></i>
            Apps Script Bridge (Versi Audit Log)
          </h3>
          <button onClick={handleCopyCode} className="mt-4 md:mt-0 flex items-center space-x-2 px-4 py-2 bg-indigo-600/10 text-indigo-500 rounded-xl font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all">
            <i className="fas fa-copy"></i>
            <span>SALIN KODE SKRIP</span>
          </button>
        </div>
        
        <div className={`p-6 rounded-2xl font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre ${
          theme === 'dark' ? 'bg-slate-950 text-indigo-300' : 'bg-gray-900 text-indigo-400'
        }`}>
          {appsScriptCode}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
