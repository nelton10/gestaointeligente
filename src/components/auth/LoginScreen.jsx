import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

// SVG da Logo inserido direto no componente para não quebrar a tela
const EscolaLogo = ({ className }) => (
  <svg viewBox="0 0 200 240" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="100%" stopColor="#312e81" />
      </linearGradient>
    </defs>
    <text x="100" y="30" textAnchor="middle" fill="#1e3a8a" fontSize="22" fontWeight="900" fontFamily="sans-serif">EEFM</text>
    <path d="M 40 160 Q 10 100 45 40" fill="none" stroke="#166534" strokeWidth="4" />
    <path d="M 40 160 Q 20 130 15 110 Q 30 110 42 125" fill="#166534" />
    <path d="M 45 125 Q 20 90 25 70 Q 40 80 47 100" fill="#166534" />
    <path d="M 47 95 Q 30 60 40 40 Q 55 55 50 75" fill="#166534" />
    <path d="M 160 160 Q 190 100 155 40" fill="none" stroke="#166534" strokeWidth="4" />
    <path d="M 160 160 Q 180 130 185 110 Q 170 110 158 125" fill="#166534" />
    <path d="M 155 125 Q 180 90 175 70 Q 160 80 153 100" fill="#166534" />
    <path d="M 153 95 Q 170 60 160 40 Q 145 55 150 75" fill="#166534" />
    <path d="M 50 45 L 150 45 L 150 130 Q 150 190 100 210 Q 50 190 50 130 Z" fill="url(#shieldGrad)" />
    <path d="M 50 140 L 150 45 L 150 130 Q 150 190 100 210 Q 50 190 50 130 Z" fill="#ffffff" />
    <path d="M 50 45 L 150 45 L 150 130 Q 150 190 100 210 Q 50 190 50 130 Z" fill="none" stroke="#1e3a8a" strokeWidth="4" />
    <text x="75" y="110" textAnchor="middle" fill="#ffffff" fontSize="55" fontWeight="bold" fontStyle="italic" fontFamily="serif">A</text>
    <text x="125" y="160" textAnchor="middle" fill="#1e3a8a" fontSize="55" fontWeight="bold" fontStyle="italic" fontFamily="serif">T</text>
    <path d="M 20 180 Q 100 215 180 180 L 185 200 Q 100 240 15 200 Z" fill="#ffffff" stroke="#1e3a8a" strokeWidth="2" />
    <text x="100" y="212" textAnchor="middle" fill="#1e3a8a" fontSize="14" fontWeight="900" fontFamily="sans-serif">ANÍSIO TEIXEIRA</text>
    <text x="100" y="235" textAnchor="middle" fill="#1e3a8a" fontSize="10" fontWeight="bold" fontFamily="sans-serif">DESDE 1954</text>
  </svg>
);

export default function LoginScreen({ setIsAuthenticated, setUserRole, config, setUsernameInput }) {
  const [localUsername, setLocalUsername] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = () => {
    if (!localUsername) {
      alert("Introduza o seu nome.");
      return;
    }
    
    // Mantido com o erro de segurança por sua solicitação
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

    setUserRole(newRole);
    setUsernameInput(localUsername); // Sobe o nome para o App.jsx usar no banco
    setIsAuthenticated(true);

    if (rememberMe) {
      try {
        localStorage.setItem('anisio_auth', JSON.stringify({ role: newRole, name: localUsername }));
      } catch (e) {}
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-slate-50 to-emerald-50 flex items-center justify-center p-6 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl shadow-indigo-200/50 text-center border border-white">
        <EscolaLogo className="w-24 mx-auto mb-5 drop-shadow-md" />
        <h1 className="text-2xl font-bold mb-1 tracking-tight text-slate-800">Anísio Teixeira</h1>
        <p className="text-[10px] text-indigo-500 mb-8 uppercase font-extrabold tracking-widest">Gestão Inteligente</p>

        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Seu Nome (Prof/Aluno/Gestão)" 
            value={localUsername} 
            onChange={e => setLocalUsername(e.target.value)}
            className="w-full p-4 bg-slate-50/80 rounded-2xl border border-slate-200 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-medium text-slate-700" 
          />
          <input 
            type="password" 
            placeholder="PIN de Acesso" 
            value={passwordInput} 
            onChange={e => setPasswordInput(e.target.value)}
            className="w-full p-4 bg-slate-50/80 rounded-2xl border border-slate-200 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-medium text-slate-700" 
          />
          
          <label className="flex items-center gap-2.5 justify-center cursor-pointer group mt-2">
            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}>
              {rememberMe && <Check size={14} className="text-white" />}
            </div>
            <span className="text-xs font-semibold text-slate-500 transition-colors group-hover:text-slate-700">Manter sessão iniciada</span>
            <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
          </label>

          <button 
            onClick={handleLogin} 
            className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Entrar no Sistema <ArrowRight size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
}
