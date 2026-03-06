import React from 'react';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, appId } from '../../firebase/config';
import { Library, UserX, UserMinus, Check } from 'lucide-react';

export default function Biblioteca({ libraryQueue, usernameInput, showNotification }) {
  
  const handleLibraryAction = async (item, actionType) => {
    try {
      const now = new Date(); const ts = now.toLocaleString('pt-PT'); const raw = now.getTime();
      if (actionType === 'nao_apareceu') {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'history'), {
          alunoId: item.alunoId, alunoNome: item.alunoNome, turma: item.turma, categoria: 'ocorrencia', detalhe: `Faltou à biblioteca após encaminhamento.`, timestamp: ts, rawTimestamp: raw, professor: usernameInput
        });
        const { id, ...itemDataWithoutId } = item;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'coordinationQueue'), {
          ...itemDataWithoutId, motivo: "NÃO APARECEU NA BIBLIOTECA (REINCIDENTE)", timestamp: ts, professor: usernameInput
        });
      } else if (actionType === 'negativo') {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'history'), {
          alunoId: item.alunoId, alunoNome: item.alunoNome, turma: item.turma, categoria: 'ocorrencia', detalhe: `Comportamento negativo na biblioteca.`, timestamp: ts, rawTimestamp: raw, professor: usernameInput
        });
      }
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'history'), {
        alunoId: item.alunoId, alunoNome: item.alunoNome, turma: item.turma, categoria: 'medida', detalhe: `BIBLIOTECA: Resultado ${actionType.toUpperCase()}`, timestamp: ts, rawTimestamp: raw + 10, professor: usernameInput
      });
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'libraryQueue', item.id));
      if(showNotification) showNotification("Avaliação concluída!");
    } catch(e) { alert("Erro ao processar."); }
  };

  return (
    <div className="space-y-5 animate-in slide-in-from-left-4 duration-300">
       <div className="bg-white/90 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
          <h3 className="font-extrabold text-lg flex items-center gap-2 mb-6 text-slate-800"><Library size={20} className="text-emerald-600"/> Avaliação da Biblioteca</h3>
          <div className="space-y-4">
            {(libraryQueue || []).length === 0 ? <p className="text-center py-16 text-slate-400 font-bold bg-slate-50/80 rounded-[2rem] border-2 border-dashed border-slate-200 text-sm">Nenhum aluno em cumprimento de medida.</p> : libraryQueue.map(i => (
              <div key={i.id} className="p-5 rounded-[1.5rem] bg-white border border-emerald-100 shadow-md">
                <div className="flex justify-between items-start mb-2">
                    <p className="font-extrabold text-emerald-900 text-base">{i.alunoNome}</p>
                    <span className="text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">{i.turma}</span>
                </div>
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border mb-5">
                    <p className="text-[11px] font-medium text-slate-600 italic">"{i.obsCoord || "Sem observações da gestão."}"</p>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <button onClick={() => handleLibraryAction(i, 'nao_apareceu')} className="flex flex-col items-center gap-1.5 py-3.5 bg-red-50 text-red-600 rounded-xl border border-red-100"><UserX size={18}/><span className="text-[9px] font-extrabold uppercase">Faltou</span></button>
                  <button onClick={() => handleLibraryAction(i, 'negativo')} className="flex flex-col items-center gap-1.5 py-3.5 bg-orange-50 text-orange-600 rounded-xl border border-orange-100"><UserMinus size={18}/><span className="text-[9px] font-extrabold uppercase">Negativo</span></button>
                  <button onClick={() => handleLibraryAction(i, 'positivo')} className="flex flex-col items-center gap-1.5 py-3.5 bg-emerald-500 text-white rounded-xl shadow-md"><Check size={18}/><span className="text-[9px] font-extrabold uppercase">Positivo</span></button>
                </div>
              </div>
            ))}
          </div>
       </div>
    </div>
  );
}