import React, { useState, useMemo, useEffect } from 'react';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase/config';
import { UserCheck, Lock, AlertOctagon, Clock, ArrowRight, User, Check, Megaphone, Gavel, Trash2 } from 'lucide-react';

const LiveTimer = ({ startTime, limitSeconds }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const updateTimer = () => setElapsed(Math.floor((new Date().getTime() - (startTime || Date.now())) / 1000));
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  const isOvertime = elapsed > (limitSeconds || 900);
  return (
    <div className={`flex items-center gap-1.5 font-mono text-sm font-bold tracking-tight px-2 py-1 rounded-lg ${isOvertime ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100/50 text-slate-600'}`}>
      <span>{Math.floor(elapsed / 60).toString().padStart(2, '0')}:{(elapsed % 60).toString().padStart(2, '0')}</span>
    </div>
  );
};

export default function PainelSaidas({ alunos, config, userRole, usernameInput, activeExits, suspensions, avisos, records, showNotification, attemptReturn, activeBlock }) {
  const [selectedTurma, setSelectedTurma] = useState('');
  const [selectedAlunoSaidaId, setSelectedAlunoSaidaId] = useState('');
  const [destinoSaida, setDestinoSaida] = useState('Banheiro');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [novoAvisoTexto, setNovoAvisoTexto] = useState('');

  const locaisSaida = ["Banheiro", "Bebedouro", "Secretaria", "Coordenação", "Biblioteca", "Enfermaria"];
  const turmasExistentes = useMemo(() => Array.isArray(alunos) ? [...new Set(alunos.map(a => a.turma))].sort() : [], [alunos]);
  const suspendedInTurma = useMemo(() => suspensions.filter(s => s.turma === selectedTurma), [suspensions, selectedTurma]);

  const getTodayExitsCount = (alunoId) => {
    if (!alunoId) return 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    return (records || []).filter(r => r.alunoId === alunoId && r.categoria === 'saida' && (r.rawTimestamp || 0) >= today.getTime()).length;
  };

  const registrarSaida = async () => {
    const a = alunos.find(x => x.id === selectedAlunoSaidaId);
    if(!a) return alert("Selecione um aluno.");
    
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'activeExits'), { 
      alunoId: a.id, alunoNome: a.nome, turma: a.turma, destino: destinoSaida, startTime: Date.now(), professor: usernameInput,
      autorRole: userRole,
      isEmergency: activeBlock ? isEmergencyMode : false
    });
    setSelectedAlunoSaidaId(''); 
    setIsEmergencyMode(false);
    showNotification(activeBlock && isEmergencyMode ? "Emergência Registada!" : "Saída Autorizada!");
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className={`bg-white/90 backdrop-blur-sm p-6 rounded-[2rem] border border-white shadow-xl shadow-slate-200/40 space-y-5 transition-colors ${activeBlock ? 'bg-red-50/90 border-red-100 shadow-red-100/50' : ''}`}>
        <h3 className="text-sm font-extrabold flex items-center gap-2 text-indigo-600 tracking-tight"><UserCheck size={18} strokeWidth={2.5}/> Autorizar Saída</h3>
        
        {activeBlock && (
          <div className="p-4 bg-red-100/80 border border-red-200 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-red-800 font-extrabold"><Lock size={18}/> Bloqueio Ativo: {activeBlock.label}</div>
            <p className="text-xs text-red-700 font-medium">As saídas normais estão bloqueadas neste horário. Apenas emergências são permitidas.</p>
            <label className="flex items-center gap-3 cursor-pointer mt-2 bg-white/60 p-3 rounded-xl border border-red-100 hover:bg-white/80 transition-colors">
              <input type="checkbox" checked={isEmergencyMode} onChange={e => setIsEmergencyMode(e.target.checked)} className="w-5 h-5 accent-red-600" />
              <span className="text-sm font-bold text-red-800">Forçar Saída de Emergência</span>
            </label>
          </div>
        )}

        <select className="w-full p-4 bg-slate-50/80 rounded-2xl border outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700" onChange={e => {setSelectedTurma(e.target.value); setSelectedAlunoSaidaId('');}} value={selectedTurma}>
            <option value="">Escolher Turma...</option>
            {turmasExistentes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        
        {selectedTurma && suspendedInTurma.length > 0 && (
          <div className="p-4 bg-red-50/80 border border-red-200 rounded-2xl">
             <p className="text-xs font-extrabold text-red-700 flex items-center gap-2 mb-2"><AlertOctagon size={16}/> Alunos Suspensos nesta Turma (Não autorizar):</p>
             <ul className="ml-1 space-y-1.5">
               {suspendedInTurma.map(s => <li key={s.id} className="text-[11px] text-red-600 font-bold bg-white/50 px-2 py-1 rounded-md inline-block mr-1">• {s.alunoNome}</li>)}
             </ul>
          </div>
        )}

        <div className="space-y-2">
          <select className="w-full p-4 bg-slate-50/80 rounded-2xl border outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700 disabled:opacity-60 disabled:bg-slate-100" onChange={e => setSelectedAlunoSaidaId(e.target.value)} value={selectedAlunoSaidaId} disabled={!selectedTurma}>
            <option value="">Selecionar Aluno...</option>
            {alunos.filter(a => a.turma === selectedTurma).map(a => {
              const isSuspended = suspendedInTurma.some(s => s.alunoId === a.id);
              return <option key={a.id} value={a.id} disabled={isSuspended}>{a.nome} {isSuspended ? '(SUSPENSO)' : ''}</option>
            })}
          </select>
          {selectedAlunoSaidaId && (
              <div className="flex items-center gap-3 p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl">
                <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600"><Clock size={20}/></div>
                <p className="text-sm font-medium text-indigo-900">Este aluno já saiu <span className="font-extrabold text-lg text-indigo-600">{getTodayExitsCount(selectedAlunoSaidaId)}</span> vezes hoje.</p>
              </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
            {locaisSaida.map(l => (
                <button key={l} onClick={() => setDestinoSaida(l)} 
                  className={`py-3 rounded-xl text-[10px] font-extrabold uppercase border transition-all active:scale-95
                  ${destinoSaida === l ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  {l}
                </button>
            ))}
        </div>

        <button onClick={registrarSaida} className={`w-full py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 ${activeBlock && isEmergencyMode ? 'bg-gradient-to-r from-red-600 to-red-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white'} disabled:opacity-50`} disabled={!selectedAlunoSaidaId || (activeBlock && !isEmergencyMode)}>
          {activeBlock && isEmergencyMode ? 'CONFIRMAR EMERGÊNCIA' : 'CONFIRMAR SAÍDA'} <ArrowRight size={18}/>
        </button>
      </div>
      
      {/* LISTA DE SAÍDAS */}
      <div className="space-y-3">
          {activeExits.map(e => (
            <div key={e.id} className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-[14px] bg-indigo-50 text-indigo-500 flex items-center justify-center border group-hover:scale-105 transition-transform"><User size={20}/></div>
                  <div>
                      <h4 className="font-extrabold text-sm text-slate-800">{e.alunoNome}</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase flex items-center gap-1.5">
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">{e.turma}</span> • {e.destino} <span className="text-indigo-500">{e.autorRole === 'aluno' ? 'Aluno(a)' : 'Prof.'} {e.professor}</span>
                      </p>
                  </div>
              </div>
              <div className="flex flex-col items-end gap-2.5">
                  <LiveTimer startTime={e.startTime} limitSeconds={config.exitLimitMinutes * 60} />
                  <div className="flex gap-1.5">
                      <button onClick={() => attemptReturn(e, false)} className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1"><Check size={12}/> Voltou</button>
                      <button onClick={() => attemptReturn(e, true)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-red-200">Demorou</button>
                  </div>
              </div>
            </div>
          ))}
      </div>

      {/* MURAL DE AVISOS */}
      {userRole !== 'aluno' && (
         <div className="pt-6 border-t border-slate-200/60 mt-8 space-y-5">
           <div className="flex items-center gap-3 mb-2 px-2">
              <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><Megaphone size={18}/></div>
              <h3 className="font-extrabold text-sm text-slate-800">Mural de Avisos da Gestão</h3>
           </div>
            
           {userRole === 'admin' && (
             <div className="bg-white/90 p-5 rounded-[2rem] border shadow-lg space-y-3">
               <textarea className="w-full p-4 bg-slate-50/80 rounded-2xl border outline-none font-medium text-sm h-24" placeholder="Escreva um aviso para os professores..." value={novoAvisoTexto} onChange={e => setNovoAvisoTexto(e.target.value)} />
               <button onClick={async () => {
                   if(!novoAvisoTexto.trim()) return showNotification("Escreva uma mensagem.");
                   await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'avisos'), { texto: novoAvisoTexto, autor: usernameInput, timestamp: new Date().toLocaleString('pt-PT'), rawTimestamp: Date.now() });
                   setNovoAvisoTexto(''); showNotification("Aviso publicado!");
                 }} className="w-full py-3.5 bg-slate-800 text-white rounded-2xl font-bold text-xs">PUBLICAR AVISO</button>
             </div>
           )}
            
           <div className="space-y-3">
             {avisos.length === 0 && suspensions.length === 0 ? (
               <div className="text-center py-10 text-slate-400 font-bold bg-white/50 rounded-[2rem] border-2 border-dashed text-xs">Nenhum aviso importante no momento.</div>
             ) : (
               <>
                 {suspensions.map(s => (
                   <div key={`susp-${s.id}`} className="bg-red-50/90 p-5 rounded-[1.5rem] border border-red-200 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-red-600 to-red-500"></div>
                     <div className="flex justify-between items-start mb-2.5 ml-2">
                       <span className="font-extrabold text-xs text-red-900 bg-red-100 px-2 py-1 rounded-md flex items-center gap-1.5"><Gavel size={12}/> ALUNO SUSPENSO</span>
                       <span className="text-[10px] font-bold text-red-500 bg-red-100/50 px-1.5 py-0.5 rounded">Retorno: {s.returnDate.split('-').reverse().join('/')}</span>
                     </div>
                     <p className="text-sm text-slate-800 ml-2 font-bold">{s.alunoNome} <span className="text-xs text-slate-500 bg-white px-1.5 py-0.5 rounded border">{s.turma}</span></p>
                     <p className="text-xs text-red-600 ml-2 mt-1.5 font-medium">Entrada bloqueada até a coordenação encerrar o processo.</p>
                   </div>
                 ))}
                 {avisos.map(aviso => (
                   <div key={aviso.id} className="bg-white/90 p-5 rounded-[1.5rem] border border-indigo-100 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-indigo-400"></div>
                     <div className="flex justify-between items-start mb-3 ml-2">
                        <span className="font-extrabold text-xs text-indigo-900 bg-indigo-50 px-2 py-1 rounded-md">Gestão: {aviso.autor}</span>
                       <span className="text-[10px] font-bold text-slate-400">{aviso.timestamp}</span>
                     </div>
                     <p className="text-sm text-slate-700 ml-2 font-medium whitespace-pre-wrap">{aviso.texto}</p>
                     {userRole === 'admin' && (
                       <div className="mt-4 flex justify-end">
                          <button onClick={async () => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'avisos', aviso.id)); showNotification("Aviso removido."); }} className="text-red-400 hover:text-red-600 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 bg-red-50 rounded-lg"><Trash2 size={12}/> Apagar</button>
                       </div>
                     )}
                   </div>
                 ))}
               </>
             )}
           </div>
         </div>
      )}
    </div>
  );
}