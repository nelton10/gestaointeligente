import React, { useState, useEffect } from 'react';
import { auth, db, appId } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

// COMPONENTES PRINCIPAIS
import LoginScreen from './components/auth/LoginScreen';
import PainelSaidas from './components/features/PainelSaidas';
import GestaoOcorrencias from './components/features/GestaoOcorrencias';
import DashboardAdmin from './components/features/DashboardAdmin';

// NOVOS COMPONENTES
import EntradasTardias from './components/features/EntradasTardias';
import FilaCoordenacao from './components/features/FilaCoordenacao';
import Biblioteca from './components/features/Biblioteca';
import PesquisaAlunos from './components/features/PesquisaAlunos';
import Historico from './components/features/Historico';

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
  const [coordinationQueue, setCoordinationQueue] = useState([]);
  const [libraryQueue, setLibraryQueue] = useState([]);

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

    const unsubHistory = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'history'), (s) => setRecords(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => (b.rawTimestamp || 0) - (a.rawTimestamp || 0))));
    const unsubExits = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'activeExits'), (s) => setActiveExits(s.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubSuspensions = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'suspensions'), (s) => setSuspensions(s.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubAvisos = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'avisos'), (s) => setAvisos(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => b.rawTimestamp - a.rawTimestamp)));
    const unsubCoord = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'coordinationQueue'), (s) => setCoordinationQueue(s.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubLibrary = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'libraryQueue'), (s) => setLibraryQueue(s.docs.map(d => ({ ...d.data(), id: d.id }))));

    return () => { unsubConfig(); unsubHistory(); unsubExits(); unsubSuspensions(); unsubAvisos(); unsubCoord(); unsubLibrary(); };
  }, [user]);

  const showNotification = (msg) => alert(msg);
  
  const saveConfig = async (newData) => {
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'main'), newData, { merge: true });
      showNotification("Configuração Guardada com sucesso!");
    } catch (e) {
      showNotification("Erro ao guardar configuração.");
    }
  };

  const turmasExistentes = [...new Set(alunos.map(a => a.turma))].sort();

  if (!isAuthenticated) {
    return <LoginScreen setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} config={config} setUsernameInput={setUsernameInput} />;
  }

  const renderNav = () => (
    <nav className="px-4 py-3 max-w-2xl mx-auto w-full overflow-x-auto no-scrollbar sticky top-0 z-40 bg-slate-50">
      <div className="flex bg-white p-1.5 rounded-xl shadow-sm border gap-1 min-w-max">
         <button onClick={() => setActiveTab('saidas')} className={`px-4 py-2 rounded-lg text-[11px] font-bold ${activeTab === 'saidas' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Saídas</button>
         <button onClick={() => setActiveTab('ocorrencias')} className={`px-4 py-2 rounded-lg text-[11px] font-bold ${activeTab === 'ocorrencias' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Ocorrências</button>
         <button onClick={() => setActiveTab('historico')} className={`px-4 py-2 rounded-lg text-[11px] font-bold ${activeTab === 'historico' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Histórico</button>
         <button onClick={() => setActiveTab('atrasos')} className={`px-4 py-2 rounded-lg text-[11px] font-bold ${activeTab === 'atrasos' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Entradas</button>
         <button onClick={() => setActiveTab('coord')} className={`px-4 py-2 rounded-lg text-[11px] font-bold relative ${activeTab === 'coord' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Coord. {coordinationQueue.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[9px]">{coordinationQueue.length}</span>}</button>
         <button onClick={() => setActiveTab('medidas')} className={`px-4 py-2 rounded-lg text-[11px] font-bold relative ${activeTab === 'medidas' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Biblioteca {libraryQueue.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[9px]">{libraryQueue.length}</span>}</button>
         <button onClick={() => setActiveTab('pesquisa')} className={`px-4 py-2 rounded-lg text-[11px] font-bold ${activeTab === 'pesquisa' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Pesquisa</button>
         {userRole === 'admin' && <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 rounded-lg text-[11px] font-bold ${activeTab === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Config</button>}
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {renderNav()}
      <main className="px-4 pb-28 pt-2 max-w-2xl mx-auto w-full mt-4">
        {activeTab === 'saidas' && <PainelSaidas alunos={alunos} config={config} userRole={userRole} usernameInput={usernameInput} activeExits={activeExits} suspensions={suspensions} avisos={avisos} records={records} showNotification={showNotification} />}
        {activeTab === 'ocorrencias' && <GestaoOcorrencias alunos={alunos} userRole={userRole} usernameInput={usernameInput} showNotification={showNotification} turmasExistentes={turmasExistentes} />}
        {activeTab === 'historico' && <Historico alunos={alunos} records={records} userRole={userRole} usernameInput={usernameInput} showNotification={showNotification} />}
        {activeTab === 'atrasos' && <EntradasTardias alunos={alunos} userRole={userRole} usernameInput={usernameInput} turmasExistentes={turmasExistentes} showNotification={showNotification} />}
        {activeTab === 'coord' && <FilaCoordenacao coordinationQueue={coordinationQueue} suspensions={suspensions} usernameInput={usernameInput} showNotification={showNotification} />}
        {activeTab === 'medidas' && <Biblioteca libraryQueue={libraryQueue} usernameInput={usernameInput} showNotification={showNotification} />}
        {activeTab === 'pesquisa' && <PesquisaAlunos alunos={alunos} records={records} turmasExistentes={turmasExistentes} />}
        {activeTab === 'admin' && <DashboardAdmin alunos={alunos} records={records} config={config} saveConfig={saveConfig} showNotification={showNotification} turmasExistentes={turmasExistentes} activeExits={activeExits} coordinationQueue={coordinationQueue} libraryQueue={libraryQueue} suspensions={suspensions} avisos={avisos} />}
      </main>
    </div>
  );
}
