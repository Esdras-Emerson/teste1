
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, Download, FileUp, ShieldCheck, ClipboardCheck, Search, Info, HardHat, FileSpreadsheet, FileDown, MapPin, Compass, Lock, Mail, LogOut, ArrowRight, Activity, Zap, ShieldAlert, XCircle, RefreshCw, LayoutDashboard, TableProperties, PieChart, BarChart3, Filter, Globe, BookOpen, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { extractRelevantText, extractStandardText, extractAuditSections } from './services/pdfService';
import { analyzeReport, performConsistencyAudit } from './services/geminiService';
import { parseRoutineInspection } from './services/excelService';
import { AnalysisResult, ClassificationStatus, ConsistencyAuditResult, User, RoutineInspectionResult } from './types';
import { DEFAULT_STANDARD_PLACEHOLDER } from './constants';

type TabType = 'especiais' | 'rotineiras';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('especiais');

  const [terapiaFiles, setTerapiaFiles] = useState<File[]>([]);
  const [terapiaResults, setTerapiaResults] = useState<AnalysisResult[]>([]);
  const [isProcessingTerapia, setIsProcessingTerapia] = useState(false);
  
  const [patologiaFiles, setPatologiaFiles] = useState<File[]>([]);
  const [auditResults, setAuditResults] = useState<ConsistencyAuditResult[]>([]);
  const [isProcessingPatologia, setIsProcessingPatologia] = useState(false);

  const [rotineiraFiles, setRotineiraFiles] = useState<File[]>([]);
  const [rotineiraResults, setRotineiraResults] = useState<RoutineInspectionResult[]>([]);
  const [isProcessingRotineira, setIsProcessingRotineira] = useState(false);

  const [standardText, setStandardText] = useState<string>("");
  const [standardFileName, setStandardFileName] = useState<string | null>(null);
  const [currentFileLabel, setCurrentFileLabel] = useState<string>("");

  const terapiaInputRef = useRef<HTMLInputElement>(null);
  const patologiaInputRef = useRef<HTMLInputElement>(null);
  const standardInputRef = useRef<HTMLInputElement>(null);
  const rotineiraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('artesp_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (authForm.email === 'gir@oae.com' && authForm.password === 'oae1234') {
      const loggedUser = { email: authForm.email };
      setUser(loggedUser);
      localStorage.setItem('artesp_user', JSON.stringify(loggedUser));
    } else {
      setAuthError('Credenciais inválidas.');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('artesp_user');
  };

  const handleStandardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setStandardFileName(file.name);
      try {
        const text = await extractStandardText(file);
        setStandardText(text);
      } catch (err) { alert("Erro ao carregar norma."); }
    }
  };

  const processTerapia = async () => {
    if (terapiaFiles.length === 0) return;
    setIsProcessingTerapia(true);
    setTerapiaResults([]);
    for (const file of terapiaFiles) {
      setCurrentFileLabel(file.name);
      try {
        const { text, workNameCandidate, kmCandidate, sentidoCandidate } = await extractRelevantText(file);
        const result = await analyzeReport(text, file.name, workNameCandidate, kmCandidate, sentidoCandidate, standardText || DEFAULT_STANDARD_PLACEHOLDER);
        setTerapiaResults(prev => [...prev, result]);
      } catch (err: any) { 
        alert(err.message);
      }
    }
    setIsProcessingTerapia(false);
    setCurrentFileLabel("");
  };

  const processAuditoria = async () => {
    if (patologiaFiles.length === 0) return;
    setIsProcessingPatologia(true);
    setAuditResults([]);
    for (const file of patologiaFiles) {
      setCurrentFileLabel(file.name);
      try {
        const sections = await extractAuditSections(file);
        const result = await performConsistencyAudit(sections);
        setAuditResults(prev => [...prev, result]);
      } catch (err) { console.error(err); }
    }
    setIsProcessingPatologia(false);
    setCurrentFileLabel("");
  };

  const handleProcessRotineiras = async () => {
    if (rotineiraFiles.length === 0) return;
    setIsProcessingRotineira(true);
    setRotineiraResults([]);
    for (const file of rotineiraFiles) {
      try {
        const res = await parseRoutineInspection(file);
        setRotineiraResults(prev => [...prev, res]);
      } catch (err) { console.error(err); }
    }
    setIsProcessingRotineira(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl border border-slate-200">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-xl mb-6">
              <ShieldCheck size={48} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 text-center uppercase tracking-tight">AUDITOR ARTESP</h1>
            <p className="text-slate-400 text-xs font-bold uppercase mt-2">Sistema de Análise Técnica</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="E-mail corporativo" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700" />
            <input type="password" placeholder="Senha de acesso" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700" />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-lg uppercase tracking-widest transition-all">AUTENTICAR</button>
          </form>
          {authError && <p className="mt-6 text-center text-red-500 font-bold text-xs uppercase">{authError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER PROFISSIONAL */}
        <header className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-xl"><ShieldCheck className="w-10 h-10 text-white" /></div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">PORTAL DE AUDITORIA ARTESP</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{user.email} • <button onClick={logout} className="text-red-500 hover:text-red-700 transition-colors">Encerrar Sessão</button></p>
            </div>
          </div>
          <div className="bg-slate-100 p-1.5 rounded-2xl flex border border-slate-200">
            <button onClick={() => setActiveTab('especiais')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'especiais' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Inspeções Especiais</button>
            <button onClick={() => setActiveTab('rotineiras')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'rotineiras' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}>Inspeções Rotineiras</button>
          </div>
        </header>

        {activeTab === 'especiais' && (
           <div className="space-y-8 animate-in fade-in duration-700">
              
              {/* CARGA DE NORMA */}
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"><BookOpen size={18} className="text-blue-600"/> 0. Manual Técnico Artesp (Contexto)</h3>
                 <div onClick={() => standardInputRef.current?.click()} className="border-3 border-dashed border-slate-100 rounded-[1.5rem] p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group">
                   <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform"><FileUp className="text-blue-600" size={32} /></div>
                   <p className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{standardFileName || "Clique para injetar a norma de referência (PDF)"}</p>
                 </div>
                 <input type="file" accept=".pdf" className="hidden" ref={standardInputRef} onChange={handleStandardUpload} />
              </div>

              {/* GRIDS DE AÇÃO */}
              <div className="grid lg:grid-cols-2 gap-8">
                 <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"><Search size={18} className="text-blue-600"/> 1. Auditoria Cap. III (Consistência)</h3>
                    <div onClick={() => patologiaInputRef.current?.click()} className="border-3 border-dashed border-slate-100 rounded-[1.5rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 min-h-[160px] transition-all">
                      <HardHat className="text-slate-300 mb-3" size={40} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{patologiaFiles.length} Relatórios Pendentes</p>
                    </div>
                    <input type="file" multiple accept=".pdf" className="hidden" ref={patologiaInputRef} onChange={(e) => e.target.files && setPatologiaFiles(Array.from(e.target.files))} />
                    <button disabled={isProcessingPatologia || patologiaFiles.length === 0} onClick={processAuditoria} className="mt-8 w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:bg-black transition-all disabled:opacity-50">
                      {isProcessingPatologia ? <><Loader2 className="animate-spin" /> Auditando {currentFileLabel}...</> : 'Iniciar Auditoria de Consistência'}
                    </button>
                 </div>

                 <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"><ClipboardCheck size={18} className="text-emerald-600"/> 2. Extração Cap. IV (Terapia)</h3>
                    <div onClick={() => terapiaInputRef.current?.click()} className="border-3 border-dashed border-slate-100 rounded-[1.5rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 min-h-[160px] transition-all">
                      <FileText className="text-slate-300 mb-3" size={40} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{terapiaFiles.length} Relatórios Pendentes</p>
                    </div>
                    <input type="file" multiple accept=".pdf" className="hidden" ref={terapiaInputRef} onChange={(e) => e.target.files && setTerapiaFiles(Array.from(e.target.files))} />
                    <button disabled={isProcessingTerapia || terapiaFiles.length === 0} onClick={processTerapia} className="mt-8 w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:bg-emerald-700 transition-all disabled:opacity-50">
                      {isProcessingTerapia ? <><Loader2 className="animate-spin" /> Extraindo {currentFileLabel}...</> : 'Extrair Parâmetros da Conclusão'}
                    </button>
                 </div>
              </div>

              {/* RESULTADOS AUDITORIA */}
              {auditResults.map(res => (
                <div key={res.id} className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-500">
                  <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{res.workName}</h4>
                      <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">{res.km} | {res.sentido} • {res.fileName}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Auditado</span>
                    </div>
                  </div>
                  <div className="p-10 space-y-8">
                    {res.criticalInconsistencies.length > 0 && (
                      <div className="bg-red-50 border-3 border-red-100 rounded-[1.5rem] p-8">
                        <h5 className="text-red-700 text-xs font-black uppercase mb-6 flex items-center gap-3"><ShieldAlert size={20}/> Inconsistências Críticas Detectadas (Texto vs Quadros)</h5>
                        <ul className="space-y-4">
                          {res.criticalInconsistencies.map((inc, i) => (
                            <li key={i} className="text-xs text-red-600 font-bold flex gap-4 bg-white/50 p-4 rounded-xl border border-red-200/50 shadow-sm"><div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 shrink-0 animate-pulse"/> {inc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="overflow-x-auto border border-slate-100 rounded-[1.5rem] shadow-inner">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest">
                          <tr>
                            <th className="p-6">Anomalia Analisada</th>
                            <th className="p-6 text-center">Menção Texto</th>
                            <th className="p-6 text-center">Vistoria (II)</th>
                            <th className="p-6 text-center">Quadro (VII)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {res.categories.flatMap(c => c.items).map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-6 font-black text-slate-700">{item.title}</td>
                              <td className="p-6 text-center italic text-slate-400 text-[10px] leading-relaxed">"{item.foundInCap3 || "Omitido"}"</td>
                              <td className="p-6 text-center">{item.foundInAnnexII ? <CheckCircle size={20} className="text-green-500 mx-auto"/> : <XCircle size={20} className="text-slate-200 mx-auto"/>}</td>
                              <td className="p-6 text-center">{item.foundInAnnexVII ? <CheckCircle size={20} className="text-green-500 mx-auto"/> : <XCircle size={20} className="text-slate-200 mx-auto"/>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}

              {/* RESULTADOS TERAPIA */}
              {terapiaResults.map(r => (
                <div key={r.id} className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                  <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{r.workName}</h4>
                      <p className="text-blue-600 text-[11px] font-black uppercase tracking-widest">{r.km} | {r.sentido} • Relatório de Terapia</p>
                    </div>
                    <div className={`px-6 py-2 rounded-2xl border text-[11px] font-black uppercase tracking-widest shadow-sm ${r.complianceStatus === ClassificationStatus.COMPATIBLE ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{r.complianceStatus}</div>
                  </div>
                  <div className="p-10 grid md:grid-cols-3 gap-8">
                    {[
                      { label: 'Estructural', val: r.structural, mot: r.structuralMotivation, color: 'blue' },
                      { label: 'Funcional', val: r.functional, mot: r.functionalMotivation, color: 'emerald' },
                      { label: 'Durabilidade', val: r.durability, mot: r.durabilityMotivation, color: 'purple' }
                    ].map(p => (
                      <div key={p.label} className={`bg-slate-50 p-8 rounded-[1.5rem] border border-slate-100 hover:border-blue-400 transition-all shadow-sm`}>
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg`}>{p.val}</div>
                          <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.1em]">{p.label}</span>
                        </div>
                        <p className="text-xs text-slate-600 italic leading-relaxed font-medium">"{p.mot}"</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-10 pb-10">
                     <div className="bg-slate-900 text-white p-8 rounded-[1.5rem] shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                           <Activity size={18} className="text-blue-400"/>
                           <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400">Transcrição Integral (Capítulo IV)</h5>
                        </div>
                        <p className="text-[13px] leading-[1.8] text-slate-300 font-medium selection:bg-blue-500 selection:text-white">{r.summary}</p>
                     </div>
                  </div>
                </div>
              ))}
           </div>
        )}

        {activeTab === 'rotineiras' && (
          <div className="space-y-8 animate-in fade-in duration-700">
             <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div onClick={() => rotineiraInputRef.current?.click()} className="border-3 border-dashed border-slate-100 rounded-[2rem] p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group">
                  <div className="bg-slate-100 p-6 rounded-3xl mb-6 group-hover:scale-110 transition-transform"><FileSpreadsheet className="text-slate-400" size={48} /></div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{rotineiraFiles.length} Fichas de Rotina Selecionadas</p>
                </div>
                <input type="file" multiple accept=".xlsx,.xls" className="hidden" ref={rotineiraInputRef} onChange={(e) => e.target.files && setRotineiraFiles(Array.from(e.target.files))} />
                <button disabled={isProcessingRotineira || rotineiraFiles.length === 0} onClick={handleProcessRotineiras} className="mt-8 w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:bg-blue-700 transition-all">
                  {isProcessingRotineira ? <Loader2 className="animate-spin" /> : 'Consolidar Planilhas de Rotina'}
                </button>
            </div>
            
            {rotineiraResults.length > 0 && (
               <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-10 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                       <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-widest">
                          <th className="p-6">Identificação OAE</th>
                          <th className="p-6">Localização</th>
                          <th className="p-6 text-center">EST.</th>
                          <th className="p-6 text-center">FUN.</th>
                          <th className="p-6 text-center">DUR.</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {rotineiraResults.map(r => (
                         <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-6 font-black text-slate-900">{r.obra}</td>
                            <td className="p-6 text-slate-500 font-bold uppercase text-[10px]">{r.km} • {r.rodovia}</td>
                            <td className="p-6 text-center"><span className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-black shadow-md">{r.estrutural}</span></td>
                            <td className="p-6 text-center"><span className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg font-black shadow-md">{r.funcional}</span></td>
                            <td className="p-6 text-center"><span className="px-4 py-1.5 bg-purple-500 text-white rounded-lg font-black shadow-md">{r.durability}</span></td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
