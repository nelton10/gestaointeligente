import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

export default function PesquisaAlunos({ alunos, records, turmasExistentes }) {
  const [filtroBuscaNome, setFiltroBuscaNome] = useState('');
  const [selectedTurma, setSelectedTurma] = useState('');
  const [filtroAlunoId, setFiltroAlunoId] = useState('');

  const studentSummaryTable = useMemo(() => {
    const summaryMap = {};
    records.forEach(r => {
      if (!r.alunoId) return;
      if (!summaryMap[r.alunoId]) summaryMap[r.alunoId] = { id: r.alunoId, nome: r.alunoNome || "Desconhecido", turma: r.turma, saidas: 0, ocorrencias: 0, meritos: 0, atrasos: 0 };
      if (r.categoria === 'saida') summaryMap[r.alunoId].saidas++;
      if (r.categoria === 'ocorrencia') summaryMap[r.alunoId].ocorrencias++;
      if (r.categoria === 'merito') summaryMap[r.alunoId].meritos++;
      if (r.categoria === 'atraso') summaryMap[r.alunoId].atrasos++;
    });
    return Object.values(summaryMap).sort((a, b) => b.ocorrencias - a.ocorrencias || (a.nome || "").localeCompare(b.nome || ""));
  }, [records]);

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-300">
      <div className="bg-white/90 p-6 rounded-[2.5rem] shadow-xl">
         <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 mb-4"><Search size={18} className="text-indigo-600"/> Diretório de Alunos</h3>
         <div className="relative group mb-3">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
             <input type="text" placeholder="Pesquisar por nome..." className="w-full pl-11 pr-4 py-4 rounded-2xl border bg-white outline-none text-sm font-medium" value={filtroBuscaNome} onChange={e => setFiltroBuscaNome(e.target.value)}/>
         </div>
         <div className="grid grid-cols-2 gap-3 mb-6">
           <select className="bg-white border rounded-2xl p-4 text-xs font-bold outline-none text-slate-600 appearance-none" value={selectedTurma} onChange={e => {setSelectedTurma(e.target.value); setFiltroAlunoId('');}}>
               <option value="">Todas as Turmas</option>
               {turmasExistentes.map(t => <option key={t} value={t}>{t}</option>)}
           </select>
           <select className="bg-white border rounded-2xl p-4 text-xs font-bold outline-none text-slate-600 appearance-none" value={filtroAlunoId} onChange={e => setFiltroAlunoId(e.target.value)}>
               <option value="">Todos os Alunos</option>
               {alunos.filter(a => !selectedTurma || a.turma === selectedTurma).map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
           </select>
         </div>

         <div className="overflow-x-auto no-scrollbar">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="text-[10px] font-extrabold uppercase text-slate-400 border-b">
                   <th className="px-5 py-4">Aluno</th>
                   <th className="px-2 py-4 text-center">Saídas</th>
                   <th className="px-2 py-4 text-center text-red-400">Ocorr.</th>
                   <th className="px-2 py-4 text-center text-emerald-400">Méritos</th>
                   <th className="px-2 py-4 text-center text-orange-400">Entr.</th>
               </tr>
             </thead>
             <tbody className="text-xs">
               {studentSummaryTable.filter(s => (!selectedTurma || s.turma === selectedTurma) && (!filtroAlunoId || s.id === filtroAlunoId) && (!filtroBuscaNome || s.nome?.toLowerCase().includes(filtroBuscaNome.toLowerCase()))).map((s, idx) => (
                 <tr key={idx} className="hover:bg-slate-50 border-b">
                   <td className="px-5 py-4">
                       <span className="font-extrabold block">{s.nome}</span>
                       <span className="font-bold text-slate-400 text-[10px]">{s.turma}</span>
                   </td>
                   <td className="px-2 py-4 text-center font-bold text-slate-600">{s.saidas || '-'}</td>
                   <td className="px-2 py-4 text-center font-bold text-red-500">{s.ocorrencias || '-'}</td>
                   <td className="px-2 py-4 text-center font-bold text-emerald-500">{s.meritos || '-'}</td>
                   <td className="px-2 py-4 text-center font-bold text-orange-500">{s.atrasos || '-'}</td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}