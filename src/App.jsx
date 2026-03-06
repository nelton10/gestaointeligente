import React, { useState, useEffect } from 'react';
import { auth, db, appId } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc } from 'firebase/firestore';

// IMPORTANDO OS SEUS ARQUIVOS ISOLADOS
import LoginScreen from './components/auth/LoginScreen';
import PainelSaidas from './components/features/PainelSaidas';
import GestaoOcorrencias from './components/features/GestaoOcorrencias';
import DashboardAdmin from './components/features/DashboardAdmin';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('professor');
  const [activeTab, setActiveTab] = useState('saidas');
  const [usernameInput, setUsernameInput] = useState('');
  
  const [alunos, setAlunos] = useState([]);
  const [config, setConfig] = useState({});
  const [records, setRecords] = useState([]);
  const [activeExits, setActiveExits] = useState([]);
  const [suspensions, setSuspensions] = useState([]);
  const [avisos, setAvisos] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const unsubConfig = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'main'), (d) => {
      if (d.exists()) {
        setConfig(prev => ({ ...prev, ...d.data() }));
        if (d.data().alunosList) setAlunos(d.data().alunosList);
      }
    });

    const unsubHistory = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'history'), (s) => {
        setRecords(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => (b.rawTimestamp || 0) - (a.rawTimestamp || 0)));
    });

    const unsubExits = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'activeExits'), (s) => {
        setActiveExits(s.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    const unsubSuspensions = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'suspensions'), (s) => {
        setSuspensions(s.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    const unsubAvisos = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'avisos'), (s) => {
        setAvisos(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => b.rawTimestamp - a.rawTimestamp));
    });

    return () => { unsubConfig(); unsubHistory(); unsubExits(); unsubSuspensions(); unsubAvisos(); };
  }, [user]);

  const showNotification = (msg) => alert(msg); // Mantido simples por enquanto

  if (!isAuthenticated) {
    return <LoginScreen setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} config={config} setUsernameInput={setUsernameInput} />;
  }

  // BOTÕES DA NAVBAR ADAPTADOS E SIMPLIFICADOS
  const renderNav = () => (
    <nav className="px-4 py-3 max-w-2xl mx-auto w-full overflow-x-auto no-scrollbar sticky top-0 z-40 bg-slate-50">
      <div className="flex bg-white p-1.5 rounded-xl shadow-sm border gap-1">
         <button onClick={() => setActiveTab('saidas')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${activeTab === 'saidas' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Saídas</button>
         <button onClick={() => setActiveTab('ocorrencias')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${activeTab === 'ocorrencias' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Ocorrências</button>
         {userRole === 'admin' && <button onClick={() => setActiveTab('admin')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${activeTab === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Gestão</button>}
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {renderNav()}
      <main className="px-4 pb-28 pt-2 max-w-2xl mx-auto w-full mt-4">
        {activeTab === 'saidas' && <PainelSaidas alunos={alunos} config={config} userRole={userRole} usernameInput={usernameInput} activeExits={activeExits} suspensions={suspensions} avisos={avisos} records={records} showNotification={showNotification} />}
        {activeTab === 'ocorrencias' && <GestaoOcorrencias alunos={alunos} userRole={userRole} usernameInput={usernameInput} showNotification={showNotification} turmasExistentes={[...new Set(alunos.map(a => a.turma))].sort()} />}
        {activeTab === 'admin' && <DashboardAdmin alunos={alunos} records={records} config={config} saveConfig={(newData) => console.log("Salvar Config: ", newData)} showNotification={showNotification} turmasExistentes={[...new Set(alunos.map(a => a.turma))].sort()} />}
      </main>
    </div>
  );
}
