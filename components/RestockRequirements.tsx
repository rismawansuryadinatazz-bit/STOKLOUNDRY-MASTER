
import React, { useMemo, useState } from 'react';
import { InventoryItem, UserRole, Transaction } from '../types';
import { generatePdfReport } from '../services/pdfService';

interface RestockRequirementsProps {
  items: InventoryItem[];
  theme: 'light' | 'dark';
  t: (key: string) => string;
  onAddTransaction: (tr: Transaction) => void;
  user: { name: string; role: UserRole };
}

type WarehouseFilter = 'Gudang Singles' | 'Gudang Nugget';
type Period = '1D' | '1W' | '1M';

const RestockRequirements: React.FC<RestockRequirementsProps> = ({ items, theme, t, onAddTransaction, user }) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseFilter>('Gudang Singles');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1W');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [manualQuantities, setManualQuantities] = useState<Record<string, string>>({});

  const getDays = (p: Period) => {
    switch(p) {
      case '1D': return 1;
      case '1W': return 7;
      case '1M': return 30;
      default: return 7;
    }
  };

  const masterCatalog = useMemo(() => {
    const uniqueDefs = new Map<string, InventoryItem>();
    items.forEach(item => {
      const key = `${item.name}-${item.size}`;
      if (!uniqueDefs.has(key) || item.location === 'Gudang Utama') {
        uniqueDefs.set(key, item);
      }
    });

    return Array.from(uniqueDefs.values()).map(def => {
      const targetItem = items.find(i => 
        i.name === def.name && 
        i.size === def.size && 
        i.location === selectedWarehouse
      );

      return {
        ...def,
        id: targetItem ? targetItem.id : def.id,
        expectedQty: targetItem ? targetItem.expectedQty : 0,
        location: selectedWarehouse
      };
    });
  }, [items, selectedWarehouse]);

  const filteredCatalog = useMemo(() => {
    if (!searchTerm) return masterCatalog;
    const lower = searchTerm.toLowerCase();
    return masterCatalog.filter(i => 
      i.name.toLowerCase().includes(lower) || 
      i.category.toLowerCase().includes(lower) ||
      i.size.toLowerCase().includes(lower)
    );
  }, [masterCatalog, searchTerm]);

  const calculateRequirement = (item: InventoryItem) => {
    const days = getDays(selectedPeriod);
    // Formula Permintaan User: (Daily Usage * Period Days) * 2
    return Math.ceil((item.dailyUsage || 0) * days * 2);
  };

  const handleManualQtyChange = (itemId: string, val: string) => {
    setManualQuantities(prev => ({ ...prev, [itemId]: val }));
  };

  const handleQuickRestock = (item: InventoryItem) => {
    const manualVal = parseInt(manualQuantities[item.id] || "0");
    const target = calculateRequirement(item);
    const suggested = Math.max(target - item.expectedQty, 0);
    
    const finalAmount = manualVal > 0 ? manualVal : suggested;
    if (finalAmount <= 0) return;

    processTransaction(item, finalAmount);
    
    setManualQuantities(prev => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  const handleBulkSubmit = () => {
    const itemsToProcess = filteredCatalog.filter(item => {
      const val = parseInt(manualQuantities[item.id] || "0");
      return val > 0;
    });

    if (itemsToProcess.length === 0) {
      alert("Masukkan jumlah kebutuhan pada setidaknya satu barang.");
      return;
    }

    itemsToProcess.forEach(item => {
      const val = parseInt(manualQuantities[item.id]);
      processTransaction(item, val);
    });

    setManualQuantities({});
    alert(`${itemsToProcess.length} item berhasil diajukan ke Gudang Utama.`);
  };

  const processTransaction = (item: InventoryItem, amount: number) => {
    const newTr: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      itemId: item.id,
      itemName: item.name,
      type: 'SHIFT',
      quantity: amount,
      workShift: 'ADMIN',
      itemCondition: 'GOOD',
      fromLocation: 'Gudang Utama',
      toLocation: selectedWarehouse,
      notes: `Permintaan Restock (Safety x2). Periode: ${selectedPeriod}. Dihitung dari Pemakaian x ${getDays(selectedPeriod)} hari x 2.`,
      date: new Date().toISOString(),
      performedBy: user.name,
    };
    onAddTransaction(newTr);
  };

  const handleExportPdf = () => {
    const headers = ["Barang", "Size", "Stok Sekarang", "Target (Formula x2)", "Status", "Saran Order"];
    const data = filteredCatalog.map(item => {
      const target = calculateRequirement(item);
      const gap = Math.max(target - item.expectedQty, 0);
      const req = calculateRequirement(item);
      let status = "AMAN";
      if (item.expectedQty === 0) status = "KOSONG";
      else if (item.expectedQty <= (req / 2)) status = "KRITIS";
      else if (item.expectedQty < req) status = "RENDAH";

      return [
        item.name,
        item.size,
        item.expectedQty.toString(),
        target.toString(),
        status,
        gap.toString()
      ];
    });

    generatePdfReport({
      title: "LAPORAN PERENCANAAN KEBUTUHAN BARANG (SAFETY FACTOR x2)",
      subtitle: `Lokasi: ${selectedWarehouse} | Periode Perhitungan: ${selectedPeriod} | Target: (Harian x Hari) x 2`,
      userName: user.name,
      headers,
      data,
      fileName: `Kebutuhan_Stok_${selectedWarehouse.replace(/\s/g, '_')}`
    });
  };

  const getStatusBadge = (item: InventoryItem) => {
    const req = calculateRequirement(item);
    if (item.expectedQty === 0) {
      return <span className="px-2 py-0.5 rounded text-[9px] font-black bg-slate-500/10 text-slate-500 uppercase tracking-tighter">Kosong</span>;
    }
    if (item.expectedQty <= (req / 2)) {
      return <span className="px-2 py-0.5 rounded text-[9px] font-black bg-rose-500/10 text-rose-500 uppercase tracking-tighter">Kritis</span>;
    }
    if (item.expectedQty < req) {
      return <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500/10 text-amber-500 uppercase tracking-tighter">Rendah</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[9px] font-black bg-green-500/10 text-green-500 uppercase tracking-tighter">Aman</span>;
  };

  const cardClass = `p-8 rounded-3xl shadow-sm border transition-all ${
    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
  }`;

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-800';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';
  
  const inputClass = `w-24 px-3 py-1.5 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs font-bold text-center ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className={`text-3xl font-extrabold ${textPrimary}`}>Perencanaan Stok (Safety x2)</h2>
          <p className={textSecondary}>Menghitung kebutuhan agar stok di {selectedWarehouse} selalu aman.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl shadow-inner border border-slate-300 dark:border-slate-700">
            {(['1D', '1W', '1M'] as Period[]).map(p => (
              <button 
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedPeriod === p ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
              >
                {p === '1D' ? 'Harian' : p === '1W' ? 'Mingguan' : 'Bulanan'}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl shadow-inner border border-slate-300 dark:border-slate-700">
            <button 
              onClick={() => setSelectedWarehouse('Gudang Singles')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedWarehouse === 'Gudang Singles' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              Singles
            </button>
            <button 
              onClick={() => setSelectedWarehouse('Gudang Nugget')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedWarehouse === 'Gudang Nugget' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              Nugget
            </button>
          </div>
        </div>
      </header>

      <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center space-x-4">
        <div className="bg-indigo-600 p-3 rounded-xl text-white">
          <i className="fas fa-info-circle"></i>
        </div>
        <p className="text-xs font-bold text-indigo-600">
          Formula Kebutuhan: <span className="underline italic">(Pemakaian Harian × {getDays(selectedPeriod)} hari) × 2</span>. 
          Pengali x2 digunakan untuk menjamin ketersediaan stok cadangan.
        </p>
      </div>

      <div className={cardClass}>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3 w-full max-w-md">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                placeholder="Cari item katalog..."
                className={`w-full pl-11 pr-4 py-3 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200'
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={handleExportPdf}
              className="flex items-center justify-center p-3.5 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
              title="Download Laporan Kebutuhan (PDF)"
            >
              <i className="fas fa-file-pdf"></i>
            </button>
          </div>
          
          <button 
            onClick={handleBulkSubmit}
            className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
          >
            <i className="fas fa-paper-plane"></i>
            <span>Ajukan Restock Massal</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`uppercase text-[10px] font-black tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
              <tr>
                <th className="px-4 py-4">Item Katalog</th>
                <th className="px-4 py-4">Harian</th>
                <th className="px-4 py-4 text-center">Stok {selectedWarehouse.split(' ')[1]}</th>
                <th className="px-4 py-4 text-center">Target Kebutuhan (x2)</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-center">Input Pengajuan</th>
                <th className="px-4 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-gray-100'}`}>
              {filteredCatalog.map(item => {
                const requirement = calculateRequirement(item);
                const manualVal = manualQuantities[item.id] || '';
                const gap = Math.max(requirement - item.expectedQty, 0);

                return (
                  <tr key={`${item.name}-${item.size}`} className={`group transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-5">
                      <p className="font-bold text-sm">{item.name}</p>
                      <p className="text-[10px] opacity-50 uppercase font-black tracking-tighter">{item.size} • {item.category}</p>
                    </td>
                    <td className="px-4 py-5">
                      <span className="font-mono text-xs font-bold text-slate-500">{item.dailyUsage} {item.unit}</span>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-black text-sm ${item.expectedQty === 0 ? 'text-slate-400' : item.expectedQty < (requirement/2) ? 'text-rose-500' : 'text-indigo-500'}`}>
                          {item.expectedQty}
                        </span>
                        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                           <div 
                             className={`h-full ${item.expectedQty < (requirement/2) ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                             style={{ width: `${requirement > 0 ? Math.min((item.expectedQty/requirement)*100, 100) : 0}%` }}
                           ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center font-bold text-indigo-600 text-sm">
                      {requirement} <span className="text-[10px] opacity-40">{item.unit}</span>
                    </td>
                    <td className="px-4 py-5 text-center">
                      {getStatusBadge(item)}
                    </td>
                    <td className="px-4 py-5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <input 
                          type="number" 
                          min="0"
                          className={inputClass}
                          placeholder={gap > 0 ? gap.toString() : '0'}
                          value={manualVal}
                          onChange={(e) => handleManualQtyChange(item.id, e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <button 
                        onClick={() => handleQuickRestock(item)}
                        disabled={!manualVal && gap <= 0}
                        className={`p-2.5 rounded-xl transition-all ${
                          manualVal || gap > 0 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95' 
                            : 'bg-slate-100 text-slate-300 dark:bg-slate-800 cursor-not-allowed'
                        }`}
                        title="Proses Mutasi dari Gudang Utama"
                      >
                        <i className="fas fa-truck-ramp-box text-xs"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCatalog.length === 0 && (
          <div className="py-24 text-center opacity-30">
            <i className="fas fa-database text-6xl mb-4"></i>
            <p className="text-sm font-bold">Data Katalog Master tidak ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestockRequirements;
