/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  Calculator, 
  Leaf, 
  Settings2, 
  DollarSign, 
  PoundSterling,
  TrendingDown,
  TrendingUp,
  Info,
  ChevronRight,
  ArrowRightLeft,
  Save,
  Download,
  Trash2,
  CheckCircle2,
  History,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

// --- Types ---

interface Scenario {
  id: string;
  timestamp: string;
  retailPrice: number;
  robustaPercent: number;
  arabicaPercent: number;
  profitBag: number;
  landedCostBag: number;
  carbonBag: number;
  margin: number;
}

interface BlendResults {
  landedCost: number;
  profit: number;
  margin: number;
  carbon: number;
}

interface Toast {
  id: string;
  message: string;
}

export default function App() {
  // --- State ---
  
  // Financial Inputs (Sidebar)
  const [retailPrice, setRetailPrice] = useState('4.50');
  const [exchangeRate, setExchangeRate] = useState('1.25');
  const [arabicaUsdKg, setArabicaUsdKg] = useState('5.00');
  const [robustaUsdKg, setRobustaUsdKg] = useState('2.50');

  // Blend Configuration (Main)
  const [originalRobusta, setOriginalRobusta] = useState('15');
  const [proposedRobusta, setProposedRobusta] = useState('40');

  // Modules
  const [enableCarbon, setEnableCarbon] = useState(false);
  
  // Scenario History
  const [history, setHistory] = useState<Scenario[]>([]);
  
  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  // --- Logic ---

  const calculateResults = (robustaStr: string): BlendResults => {
    const robP = parseFloat(robustaStr) || 0;
    const araP = Math.max(0, 100 - robP);
    const rate = parseFloat(exchangeRate) || 1;
    const retail = parseFloat(retailPrice) || 0;
    
    // Landed cost calculation
    const aGbp = (parseFloat(arabicaUsdKg) || 0) / rate;
    const rGbp = (parseFloat(robustaUsdKg) || 0) / rate;

    const costKg = (robP * rGbp + araP * aGbp) / 100;
    const landedCost = costKg * 0.25; // 250g bag
    
    const profit = retail - landedCost;
    const margin = retail > 0 ? (profit / retail) * 100 : 0;
    
    // Carbon Footprint: Arabica (1.2), Robusta (0.4)
    const carbonKg = (araP * 1.2 + robP * 0.4) / 100;
    const carbon = carbonKg * 0.25;

    return { landedCost, profit, margin, carbon };
  };

  const original = useMemo(() => calculateResults(originalRobusta), [originalRobusta, retailPrice, exchangeRate, arabicaUsdKg, robustaUsdKg]);
  const proposed = useMemo(() => calculateResults(proposedRobusta), [proposedRobusta, retailPrice, exchangeRate, arabicaUsdKg, robustaUsdKg]);

  const chartData = [
    {
      name: 'Original',
      'Landed Cost': parseFloat(original.landedCost.toFixed(3)),
      'Gross Margin': parseFloat(original.profit.toFixed(3)),
    },
    {
      name: 'Proposed',
      'Landed Cost': parseFloat(proposed.landedCost.toFixed(3)),
      'Gross Margin': parseFloat(proposed.profit.toFixed(3)),
    },
  ];

  // --- Handlers ---

  const addToast = (message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const saveScenario = () => {
    const newScenario: Scenario = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      retailPrice: parseFloat(retailPrice) || 0,
      robustaPercent: parseFloat(proposedRobusta) || 0,
      arabicaPercent: 100 - (parseFloat(proposedRobusta) || 0),
      landedCostBag: proposed.landedCost,
      profitBag: proposed.profit,
      carbonBag: proposed.carbon,
      margin: proposed.margin,
    };
    setHistory([newScenario, ...history]);
    addToast('Scenario Saved Successfully!');
  };

  const clearHistory = () => {
    if (confirm('Clear all saved scenarios?')) setHistory([]);
  };

  const downloadCSV = () => {
    if (history.length === 0) return;
    
    const headers = ['Time', 'Retail Price (£)', 'Robusta %', 'Arabica %', 'Landed Cost (£)', 'Profit (£)', 'Margin %', 'Carbon (kg)'];
    const rows = history.map(s => [
      s.timestamp,
      s.retailPrice.toFixed(2),
      s.robustaPercent,
      s.arabicaPercent,
      s.landedCostBag.toFixed(3),
      s.profitBag.toFixed(3),
      s.margin.toFixed(1),
      s.carbonBag.toFixed(3)
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `coffee_scenarios_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex font-sans overflow-x-hidden">
      
      {/* Sidebar Inputs */}
      <aside className="w-80 bg-bg-soft border-r border-border sticky top-0 h-screen shrink-0 overflow-y-auto flex flex-col shadow-sm">
        <div className="p-8 border-b border-border bg-navy text-white">
          <div className="flex items-center gap-3 mb-1">
            <Settings2 className="w-5 h-5 text-accent-gold" />
            <h2 className="text-xs font-black uppercase tracking-widest">Global Inputs</h2>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <SidebarInput 
            label="Retail Price (£ / 250g)" 
            value={retailPrice} 
            onChange={setRetailPrice} 
            icon={PoundSterling}
            help="The fixed shelf price of a 250g bag in the UK market."
          />
          <SidebarInput 
            label="GBP/USD Exchange Rate" 
            value={exchangeRate} 
            onChange={setExchangeRate} 
            icon={ArrowRightLeft}
            help="The manual rate used to convert global USD commodity prices to British Pounds."
          />
          <SidebarInput label="Arabica Cost (USD/kg)" value={arabicaUsdKg} onChange={setArabicaUsdKg} icon={DollarSign} />
          <SidebarInput label="Robusta Cost (USD/kg)" value={robustaUsdKg} onChange={setRobustaUsdKg} icon={DollarSign} />
        </div>

        <div className="mt-8 p-8 border-t border-border space-y-4">
           <label className="flex items-center gap-3 cursor-pointer group">
             <input 
              type="checkbox" 
              checked={enableCarbon} 
              onChange={(e) => setEnableCarbon(e.target.checked)}
              className="w-4 h-4 accent-navy rounded cursor-pointer"
             />
             <span className="text-xs font-bold text-slate-500 group-hover:text-navy transition-colors">Enable Carbon Analysis</span>
           </label>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="grow">
        <div className="max-w-5xl mx-auto p-12 lg:p-20 space-y-16">
          
          <header className="border-b-4 border-navy pb-10">
            <h1 className="text-4xl font-black text-navy tracking-tighter">Coffee Blend Checker</h1>
          </header>

          {/* Blend Config Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-focus-within:bg-navy transition-colors" />
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Original Blend</h3>
               <BlendSetter robusta={originalRobusta} onChange={setOriginalRobusta} />
            </div>
            <div className="p-8 rounded-[2.5rem] bg-bg-soft border border-navy/20 shadow-md relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-1 h-full bg-navy shadow-lg shadow-navy/20" />
               <h3 className="text-xs font-black text-navy/40 uppercase tracking-[0.2em] mb-8">Proposed Blend</h3>
               <BlendSetter robusta={proposedRobusta} onChange={setProposedRobusta} accent />
            </div>
          </section>

          {/* Commercial Performance */}
          <section className="bg-bg-soft rounded-[3rem] p-10 border border-border shadow-sm space-y-12">
            <div className="flex justify-between items-end">
               <div>
                  <h2 className="text-2xl font-black text-navy">Commercial Results</h2>
                  <p className="text-sm text-slate-500 font-medium">Comparison of landed material costs and predicted margins.</p>
               </div>
               <div className="flex gap-8">
                 <MetricDisplay label="Original Profit" value={`£${original.profit.toFixed(3)}`} />
                 <MetricDisplay 
                  label="Proposed Profit" 
                  value={`£${proposed.profit.toFixed(3)}`} 
                  accent 
                  delta={`£${(proposed.profit - original.profit).toFixed(3)}`}
                  deltaPositive={proposed.profit >= original.profit}
                 />
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-6">
              {/* Stacked Chart */}
              <div className="lg:col-span-2 h-[350px]">
                 <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Financial Composition Analysis</h4>
                    <div className="flex gap-4">
                       <LegendItem color="#E5E7EB" label="Landed Cost" help="The total cost per bag including raw materials, freight, and conversion, converted to GBP." />
                       <LegendItem color="#001F3F" label="Gross Margin" />
                    </div>
                 </div>
                 <ResponsiveContainer width="100%" height="90%">
                   <BarChart data={chartData} margin={{ left: 0, right: 0 }}>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#001F3F' }} />
                     <YAxis hide />
                     <RechartsTooltip 
                      cursor={{ fill: 'transparent' }} 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                     />
                     <Bar dataKey="Landed Cost" stackId="a" fill="#E5E7EB" />
                     <Bar dataKey="Gross Margin" stackId="a" fill="#001F3F" radius={[15, 15, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
              </div>

              {/* Action Sidebar */}
              <div className="flex flex-col justify-center space-y-6">
                 <div className="bg-white p-8 rounded-3xl border border-border shadow-inner">
                    <div className="space-y-4">
                       <ImpactRow label="Margin Growth" value={`${(proposed.margin - original.margin).toFixed(1)}%`} />
                       <ImpactRow label="Cost Variation" value={`£${(proposed.landedCost - original.landedCost).toFixed(3)}`} inverse />
                       <div className="pt-4 border-t border-slate-50">
                         <button 
                          onClick={saveScenario}
                          className="w-full bg-navy text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-navy-light transition-all shadow-lg active:scale-95"
                         >
                           <Save className="w-4 h-4 text-accent-gold" />
                           Save Scenario
                         </button>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </section>

          {/* Carbon Footprint Toggle - Conditional */}
          <AnimatePresence>
            {enableCarbon && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-emerald-50 rounded-[3rem] p-10 border border-emerald-100 space-y-10"
              >
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-xl">
                        <Leaf className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-emerald-900 tracking-tight flex items-center gap-2">
                           Carbon Analysis
                           <Tooltip content="Carbon Dioxide Equivalent—measures the total greenhouse gas impact per bag based on origin-specific LCA data.">
                             <Info className="w-4 h-4 text-emerald-300" />
                           </Tooltip>
                        </h3>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-600/40 uppercase tracking-widest mb-1">Impact Delta</p>
                      <div className={`text-2xl font-black flex items-center gap-2 justify-end ${(proposed.carbon - original.carbon) <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {(proposed.carbon - original.carbon) <= 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                         {Math.abs(proposed.carbon - original.carbon).toFixed(4)} <span className="text-xs">kg CO2e</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-white/50 p-6 rounded-2xl border border-emerald-50 text-center">
                    <p className="text-[10px] font-black text-emerald-900/30 uppercase tracking-widest mb-2">Original Impact</p>
                    <p className="text-lg font-black text-emerald-900">{original.carbon.toFixed(4)} kg <span className="text-[10px]">CO2e</span></p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-emerald-900/30 uppercase tracking-widest mb-2">Proposed Impact</p>
                    <p className="text-lg font-black text-emerald-900">{proposed.carbon.toFixed(4)} kg <span className="text-[10px]">CO2e</span></p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[10px] font-bold text-emerald-600/40 uppercase tracking-widest">
                    Reference: Arabica (1.2kg CO2e/kg), Robusta (0.4kg CO2e/kg). <br />
                    Source: IDH Sustainable Trade (https://bit.ly)
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Scenario Tracker (History) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-navy opacity-30" />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Scenario History</h3>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={downloadCSV} 
                  disabled={history.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 hover:bg-navy hover:text-white transition-all disabled:opacity-30"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Download CSV
                </button>
                <button 
                  onClick={clearHistory}
                  disabled={history.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-300 hover:text-rose-500 transition-all disabled:opacity-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
              {history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="p-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Time</th>
                        <th className="p-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Proposed Mix</th>
                        <th className="p-6 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">Unit Profit</th>
                        <th className="p-6 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">Margin</th>
                        <th className="p-6 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">Carbon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {history.map((s) => (
                        <tr key={s.id} className="hover:bg-bg-soft transition-colors text-xs font-bold text-navy/70">
                          <td className="p-6 text-slate-300 font-medium">{s.timestamp}</td>
                          <td className="p-6">
                            <span className="text-navy">{s.robustaPercent}%</span> / {s.arabicaPercent}%
                          </td>
                          <td className="p-6 text-right font-black">£{s.profitBag.toFixed(3)}</td>
                          <td className="p-6 text-right">
                             <span className={`px-2 py-0.5 rounded-full ${s.margin > 20 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                               {s.margin.toFixed(1)}%
                             </span>
                          </td>
                          <td className="p-6 text-right text-slate-400 font-medium">{s.carbonBag.toFixed(3)} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-20 text-center">
                   <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">No scenarios saved yet.</p>
                </div>
              )}
            </div>
          </section>

          <footer className="pt-20 pb-10 border-t border-border flex justify-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
             Coffee Blend Checker | Commercial Decision Support Tool for UK FMCG
          </footer>

        </div>
      </main>

      {/* Toast Notifications */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="bg-navy text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Sub-Components ---

function SidebarInput({ label, value, onChange, icon: Icon, help }: { label: string; value: string; onChange: (v: string) => void; icon: any; help?: string }) {
  return (
    <div className="space-y-1.5 transition-transform">
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
        {help && (
          <Tooltip content={help}>
             <Info className="w-3 h-3 text-slate-300 cursor-help" />
          </Tooltip>
        )}
      </div>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none group-focus-within:text-navy transition-colors text-slate-300">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <input 
          type="number" 
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-navy outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 transition-all shadow-sm"
        />
      </div>
    </div>
  );
}

function BlendSetter({ robusta, onChange, accent = false }: { robusta: string; onChange: (v: string) => void; accent?: boolean }) {
  const robNum = parseFloat(robusta) || 0;
  const araNum = Math.max(0, 100 - robNum);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none">Robusta %</p>
           <input 
            type="number" 
            value={robusta} 
            onChange={(e) => onChange(e.target.value)}
            className={`text-4xl font-black w-20 outline-none bg-transparent transition-colors ${accent ? 'text-navy' : 'text-slate-400 text-focus:navy'}`}
           />
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none">Arabica %</p>
           <p className="text-4xl font-black text-slate-200">{araNum.toFixed(0)}</p>
        </div>
      </div>
      <div className="relative pt-2">
         <input 
          type="range" 
          min="0" 
          max="100" 
          value={robNum} 
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-1.5 rounded-full appearance-none transition-all cursor-pointer bg-slate-100 ${accent ? 'accent-navy' : 'accent-slate-400'}`}
         />
      </div>
    </div>
  );
}

function MetricDisplay({ label, value, accent = false, delta, deltaPositive }: { label: string; value: string; accent?: boolean; delta?: string; deltaPositive?: boolean }) {
  return (
    <div className="text-right">
       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{label}</p>
       <div className={`text-3xl font-black tabular-nums transition-colors ${accent ? 'text-navy' : 'text-slate-400'}`}>
         {value}
       </div>
       {delta && (
         <p className={`text-[10px] font-black mt-1 flex items-center justify-end gap-1 ${deltaPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
           {deltaPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
           {delta}
         </p>
       )}
    </div>
  );
}

function ImpactRow({ label, value, inverse = false }: { label: string; value: string; inverse?: boolean }) {
  const valNum = parseFloat(value.replace(/[^0-9.-]/g, ''));
  const isPositive = valNum >= 0;
  
  let colorClass = "text-navy";
  if (!inverse) {
    colorClass = isPositive ? "text-emerald-600" : "text-rose-600";
  } else {
    colorClass = isPositive ? "text-rose-600" : "text-emerald-600";
  }

  return (
    <div className="flex justify-between items-center">
       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
       <span className={`text-sm font-black tabular-nums ${colorClass}`}>{value}</span>
    </div>
  );
}

function LegendItem({ color, label, help }: { color: string; label: string; help?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      {help && (
        <Tooltip content={help}>
          <Info className="w-3 h-3 text-slate-300 cursor-help" />
        </Tooltip>
      )}
    </div>
  );
}

function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] font-bold rounded-xl shadow-2xl leading-relaxed text-center"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
