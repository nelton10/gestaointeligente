import React, { useState, useEffect } from 'react';
import { auth, db, appId } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc } from 'firebase/firestore';

// Importação dos seus novos componentes fatiados
import LoginScreen from './components/auth/LoginScreen';
import PainelSaidas from './components/features/PainelSaidas';
import GestaoOcorrencias from './components/features/GestaoOcorrencias';
import NavBar from './components/ui/NavBar';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('professor');
  const [activeTab, setActiveTab] = useState('saidas');
  
  // Estados Globais (Os que precisam ser compartilhados entre abas)
  const [alunos, setAlunos] = useState([]);
  const [config, setConfig] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Suas escutas do Firestore vêm para cá
    const unsubConfig = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'main'), (d) => {
      if (d.exists()) {
        setConfig(prev => ({ ...prev, ...d.data() }));
        if (d.data().alunosList) setAlunos(d.data().alunosList);
      }
    });

    return () => unsubConfig();
  }, [user]);

  // Se não estiver logado, exibe APENAS o componente de Login
  if (!isAuthenticated) {
    return <LoginScreen setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} config={config} />;
  }

  // Renderização Condicional Limpa
  const renderTab = () => {
    switch (activeTab) {
      case 'saidas':
        return <PainelSaidas alunos={alunos} config={config} userRole={userRole} />;
      case 'ocorrencias':
        return <GestaoOcorrencias alunos={alunos} userRole={userRole} />;
      default:
        return <PainelSaidas alunos={alunos} config={config} userRole={userRole} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />
      <main className="px-4 pb-28 pt-2 max-w-2xl mx-auto w-full">
        {renderTab()}
      </main>
    </div>
  );
}