import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase/config';

export default function PainelSaidas({ alunos, config, userRole }) {
  // Estados que SÓ interessam a essa tela vêm para cá. O App.jsx não precisa saber disso.
  const [selectedTurma, setSelectedTurma] = useState('');
  const [selectedAlunoSaidaId, setSelectedAlunoSaidaId] = useState('');
  const [destinoSaida, setDestinoSaida] = useState('Banheiro');

  const turmasExistentes = [...new Set(alunos.map(a => a.turma))].sort();
  const locaisSaida = ["Banheiro", "Bebedouro", "Secretaria", "Coordenação", "Biblioteca", "Enfermaria"];

  const registrarSaida = async () => {
    const a = alunos.find(x => x.id === selectedAlunoSaidaId);
    if (!a) return alert("Selecione um aluno.");
    
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'activeExits'), { 
      alunoId: a.id, 
      alunoNome: a.nome, 
      turma: a.turma, 
      destino: destinoSaida, 
      startTime: Date.now(),
      autorRole: userRole
    });
    
    setSelectedAlunoSaidaId('');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl">
      <h3 className="font-bold mb-4">Autorizar Saída</h3>
      
      <select 
        className="w-full p-4 mb-4 border rounded-xl"
        onChange={e => { setSelectedTurma(e.target.value); setSelectedAlunoSaidaId(''); }} 
        value={selectedTurma}
      >
        <option value="">Escolher Turma...</option>
        {turmasExistentes.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      {/* O resto do seu layout de saídas entra aqui... */}
    </div>
  );
}