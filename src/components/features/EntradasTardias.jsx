import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase/config';
import { DoorOpen, CheckCircle2 } from 'lucide-react';

export default function EntradasTardias({ alunos, userRole, usernameInput, turmasExistentes, showNotification }) {
  const [selectedTurma, setSelectedTurma] = useState('');
  const [selectedAlunosIds, setSelectedAlunosIds] = useState([]);

  const registarEntradas = async () => {
    for (const id of selectedAlunosIds) {
      const al = alunos.find(a => a.id === id);
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'history'), { 
        alunoId: al.id, alunoNome: al.nome, turma: al.turma, categoria: 'atraso', 
        detalhe: 'Entrada tardia na escola', timestamp: new Date().toLocaleString('pt-PT'), 
        rawTimestamp: Date.now(), professor: usernameInput, autorRole: userRole 
      });
    }
    setSelectedAlunosIds([]); 
    if(showNotification) showNotification("Entradas registadas!");
    else alert("Entradas registadas!");
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[2rem] border border-white shadow-xl shadow-slate-200/40 space-y-6 animate-in fade-in duration-300">
       <div className="flex items-center gap-3">
         <div className="bg-orange-100 p-2.5 rounded-xl text-orange-500 shadow-sm"><DoorOpen size={20} strokeWidth={2.5}/></div>
         <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">Registar Entradas Tardias</h3>
       </div>
       <select className="w-full p-4 bg-slate-50/80 rounded-2xl border border-slate-200 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700 appearance-none" onChange={e => {setSelectedTurma(e.target.value); setSelectedAlunosIds([]);}} value={selectedTurma}>
           <option value="">Escolher Turma...</option>
           {turmasExistentes.map(t => <option key={t} value={t}>{t}</option>)}
       </select>
       
       <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 no-scrollbar">
         {alunos.filter(a => a.turma === selectedTurma).map(a => (
           <button key={a.id} onClick={() => setSelectedAlunosIds(p => p.includes(a.id) ? p.filter(x => x !== a.id) : [...p, a.id])} 
              className={`p-3.5 rounded-2xl text-[11px] font-bold border text-left transition-all active:scale-95 flex justify-between items-center
              ${selectedAlunosIds.includes(a.id) ? 'bg-gradient-to-r from-orange-500 to-orange-400 border-orange-500 text-white shadow-md' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}>
              <span className="truncate pr-2">{a.nome}</span>
              {selectedAlunosIds.includes(a.id) && <CheckCircle2 size={16} className="shrink-0 text-white/80"/>}
           </button>
         ))}
       </div>
       
       <button onClick={registarEntradas} className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl font-extrabold shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50" disabled={!selectedAlunosIds.length}>
           CONFIRMAR ({selectedAlunosIds.length})
       </button>
    </div>
  );
}