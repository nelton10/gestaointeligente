import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
// Supondo que você extraiu a logo para um componente visual isolado
import EscolaLogo from '../ui/EscolaLogo'; 

export default function LoginScreen({ setIsAuthenticated, setUserRole, config }) {
  // Esses estados saíram do App.jsx e vieram para onde pertencem:
  const [loginMode, setLoginMode] = useState('staff');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Removi o parentNomeInput e afins para focar no fluxo principal, 
  // mas você pode reintegrar a aba "portal-pais" aqui dentro do LoginScreen depois.

  const handleLogin = () => {
    if (!usernameInput) {
      alert("Introduza o seu nome.");
      return;
    }
    
    // AVISO: Movi a sua lógica original para cá temporariamente para não quebrar o app[cite: 82, 83].
    // Mas repito: ter 'gestao', 'prof' e 'apoio' no front-end é uma falha grave de segurança que vamos precisar arrancar depois[cite: 84, 85].
    const pass = passwordInput.trim().toLowerCase();
    const p = config.passwords || { admin: 'gestao', professor: 'prof', apoio: 'apoio' };

    let newRole = '';
    if (pass === p.admin.toLowerCase() || pass === 'gestão') newRole = 'admin';
    else if (pass === p.professor.toLowerCase()) newRole = 'professor';
    else if (pass === p.apoio.toLowerCase()) newRole = 'aluno';
    else {
      alert("PIN incorrecto.");
      return;
    }

    // Passa os dados para cima, para o App.jsx gerenciar a sessão
    setUserRole(newRole);
    setIsAuthenticated(true);

    if (rememberMe) {
      localStorage.setItem('anisio_auth', JSON.stringify({ role: newRole, name: usernameInput }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-emerald-50 flex items-center justify-center p-6">
      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center">
        <EscolaLogo className="w-24 mx-auto mb-5 drop-shadow-md" />
        <h1 className="text-2xl font-bold mb-1 text-slate-800">Anísio Teixeira</h1>
        <p className="text-[10px] text-indigo-500 mb-8 uppercase font-extrabold tracking-widest">Gestão Inteligente</p>

        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Seu Nome" 
            value={usernameInput} 
            onChange={e => setUsernameInput(e.target.value)}
            className="w-full p-4 bg-slate-50/80 rounded-2xl border outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-700" 
          />
          <input 
            type="password" 
            placeholder="PIN de Acesso" 
            value={passwordInput} 
            onChange={e => setPasswordInput(e.target.value)}
            className="w-full p-4 bg-slate-50/80 rounded-2xl border outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-700" 
          />
          
          <label className="flex items-center gap-2.5 justify-center cursor-pointer group mt-2">
            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
              {rememberMe && <Check size={14} className="text-white" />}
            </div>
            <span className="text-xs font-semibold text-slate-500">Manter sessão iniciada</span>
            <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
          </label>

          <button 
            onClick={handleLogin} 
            className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
          >
            Entrar no Sistema <ArrowRight size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
}