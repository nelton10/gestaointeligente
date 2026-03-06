import React, { useState, useRef, useMemo } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase/config';
import { AlertCircle, Star, CheckCircle2, Camera, Trash2 } from 'lucide-react';

export default function GestaoOcorrencias({ alunos, userRole, usernameInput, showNotification }) {
  const [registoSubTab, setRegistoSubTab] = useState('disciplina');
  const [selectedTurma, setSelectedTurma] = useState('');
  const [selectedAlunosIds, setSelectedAlunosIds] = useState([]);
  const [permanenciaStatus, setPermanenciaStatus] = useState('Continuará em sala');
  const [ocorenciasSelecionadas, setOcorenciasSelecionadas] = useState([]);
  const [meritosSelecionados, setMeritosSelecionados] = useState([]);
  const [customTextoRegisto, setCustomTextoRegisto] = useState('');
  const [fotoOcorrencia, setFotoOcorrencia] = useState(null);
  const fotoInputRef = useRef(null);

  const locaisSaida = ["Banheiro", "Bebedouro", "Secretaria", "Coordenação", "Biblioteca", "Enfermaria"];
  const botoesOcorrencia = [{ label: 'Passear no corredor' }, { label: 'Saída sem autorização' }, { label: 'Não faz a atividade' }, { label: 'Sem material' }, { label: 'Uso de Telemóvel' }, { label: 'Entrou em sala atrasado' }, { label: 'Conflito verbal' }, { label: 'Atrapalhando a aula' }];
  const botoesMerito = [{ label: 'Excelente Participação' }, { label: 'Ajudou o Colega' }, { label: 'Superação de Dificuldade' }, { label: 'Liderança Positiva' }];

  const turmasExistentes = useMemo(() => {
    return Array.isArray(alunos) ? [...new Set(alunos.map(a => a.turma))].sort() : [];
  }, [alunos]);

  const handleFotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) { 
          height = height * (MAX_WIDTH / width);
          width = MAX_WIDTH; 
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setFotoOcorrencia(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  const gravarRegisto = async () => {
    const ts = new Date().toLocaleString('pt-PT');
    const raw = Date.now();
    for (const id of selectedAlunosIds) {
      const al = alunos.find(a => a.id === id);
      const items = registoSubTab === 'disciplina' ? ocorenciasSelecionadas : meritosSelecionados;
      
      for (let i = 0; i < items.length; i++) {
         await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'history'), { 
             alunoId: al.id, alunoNome: al.nome, turma: al.turma, 
             categoria: registoSubTab === 'disciplina' ? 'ocorrencia' : 'merito', 
             detalhe: `${items[i]} [${permanenciaStatus}]`, timestamp: ts, rawTimestamp: raw + i, professor: usernameInput,
             autorRole: userRole,
             fotoUrl: fotoOcorrencia || null 
         });
      }
      
      if (customTextoRegisto) {
         await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'history'), { 
             alunoId: al.id, alunoNome: al.nome, turma: al.turma, 
             categoria: registoSubTab === 'disciplina' ? 'ocorrencia' : 'merito', 
             detalhe: `${customTextoRegisto} [${permanenciaStatus}]`, timestamp: ts, rawTimestamp: raw + items.length, professor: usernameInput,
             autorRole: userRole,
             fotoUrl: fotoOcorrencia || null 
         });
      }

      if (items.length === 0 && !customTextoRegisto) {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'history'), { 
             alunoId: al.id, alunoNome: al.nome, turma: al.turma, categoria: registoSubTab === 'disciplina' ? 'ocorrencia' : 'merito', 
             detalhe: `Registo s/ detalhe [${permanenciaStatus}]`, timestamp: ts, rawTimestamp: raw, professor: usernameInput,
             autorRole: userRole,
             fotoUrl: fotoOcorrencia || null 
         });
      }

      if (registoSubTab === 'disciplina' && permanenciaStatus === 'Retirado de sala') {
        const motivos = [...items];
        if (customTextoRegisto) motivos.push(customTextoRegisto);
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'coordinationQueue'), { 
          alunoId: al.id, alunoNome: al.nome, turma: al.turma, motivo: motivos.join(', ') || 'Retirado de sala', timestamp: ts, professor: usernameInput,
          fotoUrl: fotoOcorrencia || null 
        });
      }
    }
    setOcorenciasSelecionadas([]);
    setMeritosSelecionados([]); setSelectedAlunosIds([]); setCustomTextoRegisto(''); setFotoOcorrencia(null); 
    if(showNotification) showNotification("Ocorrências guardadas com sucesso!");
    else alert("Ocorrências guardadas com sucesso!");
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[2rem] border border-white shadow-xl shadow-slate-200/40 space-y-6 animate-in slide-in-from-bottom-4 duration-300">
       <div className="flex bg-slate-100/80 p-1.5 rounded-2xl gap-1">
          <button onClick={() => setRegistoSubTab('disciplina')} className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${registoSubTab === 'disciplina' ? 'bg-white text-red-600 shadow-sm border border-slate-200/50 scale-[1.02]' : 'text-slate-500 hover:bg-slate-200/50'}`}><AlertCircle size={16} strokeWidth={2.5}/> Disciplina</button>
          <button onClick={() => setRegistoSubTab('merito')} className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${registoSubTab === 'merito' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50 scale-[1.02]' : 'text-slate-500 hover:bg-slate-200/50'}`}><Star size={16} strokeWidth={2.5}/> Mérito</button>
       </div>
       
       <select className="w-full p-4 bg-slate-50/80 rounded-2xl border border-slate-200 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-semibold text-slate-700 appearance-none" onChange={e => {setSelectedTurma(e.target.value); setSelectedAlunosIds([]);}} value={selectedTurma}>
           <option value="">Filtrar Turma...</option>
           {turmasExistentes.map(t => <option key={t} value={t}>{t}</option>)}
       </select>
       
       <div className="grid grid-cols-2 gap-2.5 max-h-52 overflow-y-auto no-scrollbar pr-1">
         {alunos.filter(a => a.turma === selectedTurma).map(a => (
           <button key={a.id} onClick={() => setSelectedAlunosIds(p => p.includes(a.id) ? p.filter(x => x !== a.id) : [...p, a.id])} 
              className={`p-3.5 rounded-2xl text-xs font-bold border text-left transition-all active:scale-95 flex justify-between items-center ${selectedAlunosIds.includes(a.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}>
              <span className="truncate pr-2">{a.nome}</span>
              {selectedAlunosIds.includes(a.id) && <CheckCircle2 size={16} className="shrink-0 text-indigo-200"/>}
           </button>
         ))}
       </div>

       {registoSubTab === 'disciplina' && selectedAlunosIds.length > 0 && (
         <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
           <button onClick={() => setPermanenciaStatus('Retirado de sala')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${permanenciaStatus === 'Retirado de sala' ? 'bg-red-500 text-white shadow-md shadow-red-200 scale-[1.02]' : 'text-slate-500 hover:bg-slate-200/50'}`}>Foi Retirado</button>
           <button onClick={() => setPermanenciaStatus('Continuará em sala')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${permanenciaStatus === 'Continuará em sala' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-[1.02]' : 'text-slate-500 hover:bg-slate-200/50'}`}>Mantido em Sala</button>
         </div>
       )}
       
       <div className="grid grid-cols-2 gap-2.5">
         {(registoSubTab === 'disciplina' ? botoesOcorrencia : botoesMerito).map(b => {
           const isActive = (registoSubTab === 'disciplina' ? ocorenciasSelecionadas : meritosSelecionados).includes(b.label);
           const activeBg = registoSubTab === 'disciplina' ? 'bg-red-50 border-red-300 text-red-700 shadow-sm' : 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm';
           return (
               <button key={b.label} onClick={() => { 
                 const list = registoSubTab === 'disciplina' ? ocorenciasSelecionadas : meritosSelecionados; 
                 const setter = registoSubTab === 'disciplina' ? setOcorenciasSelecionadas : setMeritosSelecionados;
                 setter(list.includes(b.label) ? list.filter(i => i !== b.label) : [...list, b.label]); 
               }} className={`p-3.5 rounded-2xl text-[11px] font-bold border text-left transition-all active:scale-95 leading-tight ${isActive ? activeBg : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                  {b.label}
               </button>
           )
         })}
       </div>

       <textarea placeholder="Observações adicionais (opcional)..." className="w-full p-4 bg-slate-50/80 rounded-2xl border border-slate-200 h-24 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all resize-none font-medium text-sm text-slate-700" value={customTextoRegisto} onChange={e => setCustomTextoRegisto(e.target.value)}></textarea>
       
       {/* SISTEMA DE ANEXO FOTOGRÁFICO */}
       <div className="pt-4 border-t border-slate-100">
         {!fotoOcorrencia ? (
           <button onClick={() => fotoInputRef.current?.click()} className="flex items-center gap-2.5 text-xs font-bold text-slate-600 bg-slate-100/80 hover:bg-slate-200 border border-slate-200 px-4 py-4 rounded-2xl transition-all w-full justify-center group active:scale-[0.98]">
             <Camera size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" strokeWidth={2.5}/> Anexar Evidência Fotográfica (Opcional)
           </button>
         ) : (
           <div className="relative inline-block w-full rounded-2xl border-2 border-indigo-100 bg-indigo-50 overflow-hidden group">
             <img src={fotoOcorrencia} className="w-full object-contain max-h-56 rounded-xl" alt="Evidência selecionada" />
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <button onClick={() => setFotoOcorrencia(null)} className="bg-red-500 text-white rounded-full p-3 shadow-lg hover:scale-110 hover:bg-red-600 transition-all">
                 <Trash2 size={20}/>
               </button>
             </div>
           </div>
         )}
         <input type="file" accept="image/*" capture="environment" ref={fotoInputRef} onChange={handleFotoUpload} className="hidden" />
       </div>

       <button onClick={gravarRegisto} disabled={selectedAlunosIds.length === 0} className={`w-full py-4 rounded-2xl font-extrabold text-white shadow-lg active:scale-[0.98] transition-all tracking-wide text-sm ${registoSubTab === 'disciplina' ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/30 hover:shadow-red-500/40 hover:-translate-y-0.5' : 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5'} disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none`}>
           GRAVAR REGISTO
       </button>
    </div>
  );
}
