import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, appId } from '../../firebase/config';
import { GraduationCap, ArrowRight, Library, Gavel, Camera, CheckCircle2, AlertOctagon, X } from 'lucide-react';

export default function FilaCoordenacao({ coordinationQueue, suspensions, usernameInput, showNotification }) {
  const [coordObs, setCoordObs] = useState('');
  const [suspensionModal, setSuspensionModal] = useState(null);
  const [suspensionReturnDate, setSuspensionReturnDate] = useState('');
  const [endSuspensionModal, setEndSuspensionModal] = useState(null);
  const [endSuspensionObs, setEndSuspensionObs] = useState('');
  const [fotoViewerModal, setFotoViewerModal] = useState(null);

  const handleCoordinationAction = async (item, type) => {
    try {
      const now = new Date(); const ts = now.toLocaleString('pt-PT'); const raw = now.getTime();
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'history'), {
        alunoId: item.alunoId, alunoNome: item.alunoNome, turma: item.turma,
        categoria: 'coordenação', detalhe: `Ação de Coordenação: ${type.toUpperCase()}. OBS: ${coordObs || 'Nenhuma'}`,
        timestamp: ts, rawTimestamp: raw, professor: usernameInput, fotoUrl: item.fotoUrl || null
      });
      if (type === 'biblioteca') {
        const { id, ...itemDataWithoutId } = item;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'libraryQueue'), {
          ...itemDataWithoutId, timestamp: ts, rawTimestamp: raw, professorCoord: usernameInput, obsCoord: coordObs
        });
      }
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'coordinationQueue', item.id));
      setCoordObs('');
      if(showNotification) showNotification(`Ação registada: ${type.toUpperCase()}!`);
    } catch(e) { alert("Erro ao processar ação."); }
  };

  const handleSuspendAction = async () => {
    if (!suspensionReturnDate) return alert("Insira a data de retorno!");
    try {
      const ts = new Date().toLocaleString('pt-PT'); const raw = Date.now();
      const formatRetorno = suspensionReturnDate.split('-').reverse().join('/');
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'history'), {
        alunoId: suspensionModal.alunoId, alunoNome: suspensionModal.alunoNome, turma: suspensionModal.turma,
        categoria: 'coordenação', detalhe: `SUSPENSÃO. Retorna dia: ${formatRetorno}. OBS: ${coordObs || 'Nenhuma'}`,
        timestamp: ts, rawTimestamp: raw, professor: usernameInput, fotoUrl: suspensionModal.fotoUrl || null
      });
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'suspensions'), {
        alunoId: suspensionModal.alunoId, alunoNome: suspensionModal.alunoNome, turma: suspensionModal.turma,
        returnDate: suspensionReturnDate, timestamp: ts
      });
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'coordinationQueue', suspensionModal.id));
      setCoordObs(''); setSuspensionModal(null); setSuspensionReturnDate(''); 
      if(showNotification) showNotification("Suspensão aplicada com sucesso!");
    } catch(e) { alert("Erro ao suspender."); }
  };

  return (
    <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-300">
       
       {fotoViewerModal && (
        <div className="fixed inset-0 z-[150] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full animate-in zoom-in-95">
            <button onClick={() => setFotoViewerModal(null)} className="absolute -top-12 right-0 text-white bg-white/10 p-2.5 rounded-full"><X size={24}/></button>
            <img src={fotoViewerModal} className="w-full rounded-[2rem] shadow-2xl" alt="Evidência" />
          </div>
        </div>
       )}

       {/* Modais de Suspensão mantidos com a mesma lógica do seu código original */}
       {suspensionModal && (
          <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl border-2 border-slate-800">
              <h3 className="font-extrabold text-xl mb-2 text-slate-800">Aplicar Suspensão</h3>
              <p className="text-sm text-slate-500 mb-6">Dia do retorno do aluno <span className="font-bold">{suspensionModal.alunoNome}</span>.</p>
              <input type="date" value={suspensionReturnDate} onChange={e => setSuspensionReturnDate(e.target.value)} className="w-full p-4 bg-slate-50 border outline-none mb-6 text-center font-bold text-lg" />
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setSuspensionModal(null)} className="py-3.5 bg-slate-100 rounded-2xl font-bold text-slate-600">Cancelar</button>
                <button onClick={handleSuspendAction} className="py-3.5 bg-slate-800 text-white rounded-2xl font-bold">Confirmar</button>
              </div>
            </div>
          </div>
       )}

       <div className="bg-white/90 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
          <h3 className="font-extrabold text-lg flex items-center gap-2 mb-6 text-slate-800"><GraduationCap size={20} className="text-indigo-600"/> Fila da Coordenação</h3>
          <div className="space-y-4">
            {(coordinationQueue || []).length === 0 ? <p className="text-center py-16 text-slate-400 font-bold bg-slate-50/80 rounded-[2rem] border-2 border-dashed border-slate-200 text-sm">Nenhum aluno encaminhado.</p> : coordinationQueue.map(i => (
              <div key={i.id} className="p-5 rounded-[1.5rem] bg-white border border-indigo-100 shadow-md">
                <div className="flex justify-between items-start mb-3">
                    <p className="font-extrabold text-indigo-900 text-base leading-tight pr-2">{i.alunoNome}</p>
                    <span className="text-[10px] font-extrabold uppercase text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">{i.turma}</span>
                </div>
                {i.fotoUrl && (
                  <div className="mb-3">
                     <button onClick={() => setFotoViewerModal(i.fotoUrl)} className="text-[10px] flex items-center gap-1.5 text-red-600 font-bold bg-red-50 w-fit px-3 py-1.5 rounded-xl border border-red-100"><Camera size={14}/> Ver Evidência</button>
                  </div>
                )}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border mb-4">
                    <p className="text-xs text-slate-600 font-medium"><span className="font-bold">Motivo:</span> {i.motivo}</p>
                </div>
                <textarea placeholder="Observações da gestão..." className="w-full p-4 text-xs bg-white rounded-2xl border h-20 mb-4 outline-none" value={coordObs} onChange={e => setCoordObs(e.target.value)} />
                <div className="grid grid-cols-3 gap-2.5">
                  <button onClick={() => handleCoordinationAction(i, 'sala')} className="py-3 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-bold flex flex-col justify-center items-center gap-1.5 border border-indigo-100"><ArrowRight size={16}/> Para Sala</button>
                  <button onClick={() => handleCoordinationAction(i, 'biblioteca')} className="py-3 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white rounded-xl text-[10px] font-bold shadow-md flex flex-col justify-center items-center gap-1.5"><Library size={16}/> Biblioteca</button>
                  <button onClick={() => setSuspensionModal(i)} className="py-3 bg-slate-800 text-white rounded-xl text-[10px] font-bold flex flex-col justify-center items-center gap-1.5"><Gavel size={16}/> Suspensão</button>
                </div>
              </div>
            ))}
          </div>

          {suspensions.length > 0 && (
             <div className="mt-8 pt-8 border-t space-y-4">
                <h4 className="font-extrabold text-sm flex items-center gap-2 text-red-600 uppercase"><Gavel size={16}/> Suspensões Vigentes</h4>
                {suspensions.map(s => (
                  <div key={s.id} className="p-5 rounded-[1.5rem] bg-red-50/50 border border-red-100 shadow-sm">
                     <div className="flex justify-between items-start mb-3">
                         <p className="font-extrabold text-red-900 text-base">{s.alunoNome}</p>
                         <span className="text-[10px] font-extrabold uppercase text-red-700 bg-red-100 px-2 py-1 rounded-lg">{s.turma}</span>
                     </div>
                     <div className="bg-white/90 p-3.5 rounded-2xl border mb-4">
                         <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 mb-1.5"><AlertOctagon size={16}/> Responsável ainda não compareceu</p>
                         <p className="text-[11px] text-slate-500 font-medium">Data limite: <span className="font-bold">{s.returnDate.split('-').reverse().join('/')}</span></p>
                     </div>
                     <button onClick={async () => {
                         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suspensions', s.id));
                         if(showNotification) showNotification("Suspensão encerrada!");
                     }} className="w-full py-3 bg-red-600 text-white rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5"><CheckCircle2 size={16}/> Finalizar e Libertar Acesso</button>
                  </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
}