import React, { useState, useRef } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase/config';
import { AlertCircle, Star, CheckCircle2, Camera, Trash2 } from 'lucide-react';

export default function GestaoOcorrencias({ alunos, userRole, usernameInput, turmasExistentes }) {
  // Estes estados são EXCLUSIVOS da aba de ocorrências. Não poluem mais o App.jsx[cite: 41, 42, 44].
  const [registoSubTab, setRegistoSubTab] = useState('disciplina');
  const [selectedTurma, setSelectedTurma] = useState('');
  const [selectedAlunosIds, setSelectedAlunosIds] = useState([]);
  const [permanenciaStatus, setPermanenciaStatus] = useState('Continuará em sala');
  const [ocorenciasSelecionadas, setOcorenciasSelecionadas] = useState([]);
  const [meritosSelecionados, setMeritosSelecionados] = useState([]);
  const [customTextoRegisto, setCustomTextoRegisto] = useState('');
  const [fotoOcorrencia, setFotoOcorrencia] = useState(null);
  
  const fotoInputRef = useRef(null);

  const botoesOcorrencia = [{ label: 'Passear no corredor' }, { label: 'Saída sem autorização' }, { label: 'Não faz a atividade' }, { label: 'Sem material' }, { label: 'Uso de Telemóvel' }];
  const botoesMerito = [{ label: 'Excelente Participação' }, { label: 'Ajudou o Colega' }, { label: 'Superação de Dificuldade' }];

  const handleFotoUpload = (e) => {
    // A mesma lógica de compressão de imagem que você escreveu, isolada aqui.
    // ...
  };

  const gravarRegisto = async () => {
    if (selectedAlunosIds.length === 0) return alert("Selecione pelo menos um aluno.");
    
    const ts = new Date().toLocaleString('pt-PT');
    const raw = Date.now();

    for (const id of selectedAlunosIds) {
      const al = alunos.find(a => a.id === id);
      const items = registoSubTab === 'disciplina' ? ocorenciasSelecionadas : meritosSelecionados;
      
      // Lógica de inserção no banco de dados isolada no componente correto
      for (let i = 0; i < items.length; i++) {
         await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'history'), { 
             alunoId: al.id, 
             alunoNome: al.nome, 
             turma: al.turma, 
             categoria: registoSubTab === 'disciplina' ? 'ocorrencia' : 'merito', 
             detalhe: `${items[i]} [${permanenciaStatus}]`, 
             timestamp: ts, 
             rawTimestamp: raw + i, 
             professor: usernameInput,
             autorRole: userRole,
             fotoUrl: fotoOcorrencia || null 
         });
      }
    }

    // Resetando os estados APENAS deste componente
    setOcorenciasSelecionadas([]);
    setMeritosSelecionados([]); 
    setSelectedAlunosIds([]); 
    setCustomTextoRegisto(''); 
    setFotoOcorrencia(null);
    alert("Ocorrências guardadas com sucesso!");
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-xl space-y-6">
       {/* Toggle Disciplina / Mérito */}
       <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
          <button onClick={() => setRegistoSubTab('disciplina')} className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${registoSubTab === 'disciplina' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>
            <AlertCircle size={16}/> Disciplina
          </button>
          <button onClick={() => setRegistoSubTab('merito')} className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${registoSubTab === 'merito' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
            <Star size={16}/> Mérito
          </button>
       </div>
       
       {/* O resto da sua UI de seleção de turmas, alunos, botões de ocorrência e upload de fotos vem aqui */}
       {/* ... */}
       
       <button 
         onClick={gravarRegisto} 
         disabled={selectedAlunosIds.length === 0}
         className="w-full py-4 rounded-2xl font-extrabold text-white shadow-lg disabled:opacity-50 bg-gradient-to-r from-red-600 to-red-500"
       >
           GRAVAR REGISTO
       </button>
    </div>
  );
}