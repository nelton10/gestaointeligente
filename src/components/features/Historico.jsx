import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase/config';
import { History, Search, AlertCircle, Clock, Camera, Edit, Trash2, X } from 'lucide-react';

export default function Historico({ alunos, records, userRole, usernameInput, showNotification }) {
  const [filtroBuscaNome, setFiltroBuscaNome] = useState('');
  const [filtroAlunoId, setFiltroAlunoId] = useState('');
  const [historicoFiltroCategoria, setHistoricoFiltroCategoria] = useState('ocorrencia');
  
  const [editRecordModal, setEditRecordModal] = useState(null);
  const [editRecordText, setEditRecordText] = useState('');
  const [fotoViewerModal, setFotoViewerModal] = useState(null);

  const ocorrenciasFiltradas = records.filter(r => {
    if (r.categoria !== historicoFiltroCategoria) return false;
    if (filtroAlunoId) return r.alunoId === filtroAlunoId;
    if (filtroBuscaNome) return r.alunoNome?.toLowerCase().includes(filtroBuscaNome.toLowerCase());
    return true;
  });

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-300">
      
      {fotoViewerModal && (
        <div className="fixed inset-0 z-[150] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full animate-in zoom-in-95">
            <button onClick={() => setFotoViewerModal(null)} className="absolute -top-12 right-0 text-white bg-white/10 p-2.5 rounded-full"><X size={24}/></button>
            <img src={fotoViewerModal} className="w-full rounded-[2rem] shadow-2xl" alt="Evidência" />
          </div>
        </div>
      )}

      {editRecordModal && (
        <div className="fixed inset-0 z-[140] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl">
            <h3 className="font-extrabold text-xl mb-2 text-slate-800">Editar Registo</h3>
            <textarea value={editRecordText} onChange={e => setEditRecordText(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-2xl mb-6 text-sm h-28" />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => {setEditRecordModal(null); setEditRecordText('');}} className="py-3.5 bg-slate-100 font-bold rounded-2xl">Cancelar</button>
              <button onClick={async () => {
                try {
                  await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'history', editRecordModal.id), { detalhe: editRecordText });
                  setEditRecordModal(null); setEditRecordText('');
                  if(showNotification) showNotification("Registo atualizado!");
                } catch(e) { alert("Erro ao atualizar o registo."); }
              }} className="py-3.5 bg-indigo-600 text-white font-bold rounded-2xl">Salvar</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/90 p-6 rounded-[2rem] shadow-xl space-y-5">
         <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2"><History size={18} className="text-indigo-600"/> Pesquisa de Histórico</h3>
         <div className="relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
             <input type="text" placeholder="Filtrar por nome exato do aluno..." className="w-full pl-11 pr-4 py-4 rounded-2xl border bg-slate-50 outline-none text-sm font-medium" value={filtroBuscaNome} onChange={e => setFiltroBuscaNome(e.target.value)}/>
         </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
          <button onClick={() => setHistoricoFiltroCategoria('ocorrencia')} className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${historicoFiltroCategoria === 'ocorrencia' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}><AlertCircle size={16}/> Ocorrências</button>
          <button onClick={() => setHistoricoFiltroCategoria('saida')} className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${historicoFiltroCategoria === 'saida' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Clock size={16}/> Saídas</button>
      </div>

      <div className="space-y-4">
        {ocorrenciasFiltradas.length === 0 ? <p className="text-center py-12 text-slate-400 font-bold bg-white/50 rounded-[2rem] border-2 border-dashed text-xs">Nenhum registo encontrado.</p> : ocorrenciasFiltradas.slice(0, 50).map(r => (
          <div key={r.id} className={`p-5 rounded-[1.5rem] bg-white border shadow-sm flex flex-col relative overflow-hidden ${historicoFiltroCategoria === 'ocorrencia' ? 'border-red-100' : 'border-indigo-100'}`}>
            <div className={`absolute top-0 left-0 w-1.5 h-full ${historicoFiltroCategoria === 'ocorrencia' ? 'bg-red-400' : 'bg-indigo-400'}`}></div>
            <div className="flex justify-between items-start mb-2.5 ml-2">
              <span className="font-extrabold text-sm text-slate-800 pr-2">{r.alunoNome}</span>
              <span className={`px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase border ${historicoFiltroCategoria === 'ocorrencia' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>{r.categoria}</span>
            </div>
            <p className="text-sm text-slate-600 mb-3 font-medium ml-2">{r.detalhe}</p>
            {r.fotoUrl && (
              <div className="ml-2 mb-3">
                  <button onClick={() => setFotoViewerModal(r.fotoUrl)} className={`text-[10px] flex items-center gap-1.5 font-bold w-fit px-3 py-1.5 rounded-xl border ${historicoFiltroCategoria === 'ocorrencia' ? 'text-red-600 bg-red-50' : 'text-indigo-600 bg-indigo-50'}`}><Camera size={14}/> Ver Evidência</button>
              </div>
            )}
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t pt-3 mt-1 ml-2">
              <span className="flex items-center gap-1.5"><Clock size={12}/> {r.timestamp} • {r.turma} • {r.professor}</span>
              <div className="flex items-center gap-1">
                 {historicoFiltroCategoria === 'ocorrencia' && (userRole === 'admin' || r.professor === usernameInput) && (
                     <button onClick={() => {setEditRecordModal(r); setEditRecordText(r.detalhe);}} className="text-slate-300 hover:text-indigo-500 p-1.5"><Edit size={14}/></button>
                 )}
                 {(userRole === 'admin' || r.professor === usernameInput) && (
                    <button onClick={async () => {
                      if(window.confirm("Deseja eliminar este registo?")) {
                        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'history', r.id));
                        if(showNotification) showNotification("Removido com sucesso.");
                      }
                    }} className="text-slate-300 hover:text-red-500 p-1.5"><Trash2 size={14}/></button>
                 )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}