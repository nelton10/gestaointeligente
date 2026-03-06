import React, { useState, useMemo, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase/config';
import { Search, Download, Lock, KeyRound, UserPlus, Trash2, DatabaseBackup, FileUp, Activity, UserX, BarChart3, PlusCircle } from 'lucide-react';

export default function DashboardAdmin({ 
  alunos, records, config, saveConfig, showNotification, turmasExistentes,
  activeExits, coordinationQueue, libraryQueue, suspensions, avisos // <-- Props vitais para o backup
}) {
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroBuscaNome, setFiltroBuscaNome] = useState('');
  const [selectedTurma, setSelectedTurma] = useState('');
  const [tipoRelatorioExport, setTipoRelatorioExport] = useState('todos');
  
  const [nomeNovoAluno, setNomeNovoAluno] = useState('');
  const [turmaNovoAluno, setTurmaNovoAluno] = useState('');
  const [modoNovaTurma, setModoNovaTurma] = useState(false);
  const [adminTurmaFiltro, setAdminTurmaFiltro] = useState('');
  const [selectedAdminAlunos, setSelectedAdminAlunos] = useState([]);
  
  const [novoBlockStart, setNovoBlockStart] = useState('');
  const [novoBlockEnd, setNovoBlockEnd] = useState('');
  const [novoBlockLabel, setNovoBlockLabel] = useState('');
  
  const [editPasswords, setEditPasswords] = useState(config.passwords || { admin: '', professor: '', apoio: '' });

  const fileInputRef = useRef(null);
  const backupInputRef = useRef(null);

  const filteredHistory = useMemo(() => {
    return (records || []).filter(r => {
      const matchesTurma = !selectedTurma || r.turma === selectedTurma;
      const matchesNome = !filtroBuscaNome || r.alunoNome?.toLowerCase().includes(filtroBuscaNome.toLowerCase());
      let matchesData = true;
      if (filtroDataInicio || filtroDataFim) {
        const rDate = new Date(r.rawTimestamp); rDate.setHours(0,0,0,0);
        if (filtroDataInicio) { const dIni = new Date(filtroDataInicio); dIni.setHours(0,0,0,0); if (rDate.getTime() < dIni.getTime()) matchesData = false; }
        if (filtroDataFim) { const dFim = new Date(filtroDataFim); dFim.setHours(23,59,59,999); if (rDate.getTime() > dFim.getTime()) matchesData = false; }
      }
      return matchesTurma && matchesNome && matchesData;
    });
  }, [records, selectedTurma, filtroBuscaNome, filtroDataInicio, filtroDataFim]);

  const dashboardData = useMemo(() => {
    const occTypes = {}; const infratoresCount = {}; const turmaStats = {};
    filteredHistory.forEach(r => {
      if (r.categoria === 'ocorrencia') {
         const tipo = r.detalhe.split(' [')[0] || "Desconhecido";
         occTypes[tipo] = (occTypes[tipo] || 0) + 1;
         if (r.alunoNome) infratoresCount[r.alunoNome] = (infratoresCount[r.alunoNome] || 0) + 1;
         if (r.turma) turmaStats[r.turma] = (turmaStats[r.turma] || 0) + 1;
      }
    });
    const occTypesArray = Object.entries(occTypes).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 6);
    const topInfratores = Object.entries(infratoresCount).map(([nome, count]) => ({ nome, count })).sort((a,b) => b.count - a.count).slice(0, 10);
    const turmasArray = Object.entries(turmaStats).map(([turma, count]) => ({ turma, count })).sort((a,b) => b.count - a.count).slice(0, 5);
    return { occTypesArray, maxOccTypeCount: occTypesArray[0]?.count || 1, topInfratores, turmasArray, maxTurmaCount: turmasArray[0]?.count || 1 };
  }, [filteredHistory]);

  const addManualStudent = async () => {
    if (!nomeNovoAluno || !turmaNovoAluno) return showNotification("Preencha nome e turma.");
    const novo = { id: Date.now().toString(), nome: nomeNovoAluno.toUpperCase(), turma: turmaNovoAluno.toUpperCase() };
    await saveConfig({ alunosList: [...(alunos || []), novo] });
    setNomeNovoAluno(''); setTurmaNovoAluno(''); setModoNovaTurma(false); showNotification("Aluno adicionado!");
  };

  // --- LÓGICAS DE ARQUIVO RESTAURADAS ---
  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const lines = evt.target.result.split('\n');
      const newAlunos = [];
      lines.forEach((line, index) => {
        if (index === 0 && line.toLowerCase().includes('turma')) return;
        const parts = line.split(',');
        if (parts.length >= 2) {
          const t = parts[0].trim().toUpperCase();
          const n = parts[1].trim().toUpperCase();
          if (t && n) newAlunos.push({ id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9), nome: n, turma: t });
        }
      });
      if (newAlunos.length) saveConfig({ alunosList: [...(alunos || []), ...newAlunos] });
    };
    reader.readAsText(file);
  };

  const handleExcelBackupUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      try {
        const backupMatch = text.match(/<Worksheet ss:Name="SYSTEM_BACKUP">[\s\S]*?<Data ss:Type="String">([\s\S]*?)<\/Data>/);
        if (backupMatch && backupMatch[1]) {
           const backupData = JSON.parse(decodeURIComponent(escape(atob(backupMatch[1]))));
           if(backupData.history) for(const rec of backupData.history) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'history', rec.id), rec);
           if(backupData.activeExits) for(const rec of backupData.activeExits) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'activeExits', rec.id), rec);
           if(backupData.coordinationQueue) for(const rec of backupData.coordinationQueue) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'coordinationQueue', rec.id), rec);
           if(backupData.libraryQueue) for(const rec of backupData.libraryQueue) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'libraryQueue', rec.id), rec);
           if(backupData.suspensions) for(const rec of backupData.suspensions) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suspensions', rec.id), rec);
           if(backupData.avisos) for(const rec of backupData.avisos) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'avisos', rec.id), rec);
           showNotification("Backup restaurado com sucesso!");
        } else {
           showNotification("Ficheiro inválido ou não contém backup de sistema.");
        }
      } catch(err) {
        showNotification("Erro na leitura do backup.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const downloadSmartReport = () => {
    const cats = ['ocorrencia', 'merito', 'saida', 'atraso', 'coordenação'];
    if (!records?.length) return showNotification("Sem dados!");
    
    let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="h"><Font ss:Bold="1"/><Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/></Style></Styles>`;
    const categoriesToGen = tipoRelatorioExport === 'todos' ? cats : [tipoRelatorioExport];
    
    categoriesToGen.forEach(c => {
      const ds = filteredHistory.filter(r => r.categoria === c);
      xml += `<Worksheet ss:Name="${c.toUpperCase()}"><Table><Column ss:Width="100"/><Column ss:Width="80"/><Column ss:Width="200"/><Column ss:Width="300"/><Row ss:StyleID="h"><Cell><Data ss:Type="String">DATA</Data></Cell><Cell><Data ss:Type="String">TURMA</Data></Cell><Cell><Data ss:Type="String">NOME</Data></Cell><Cell><Data ss:Type="String">DESCRIÇÃO</Data></Cell></Row>`;
      ds.forEach(r => xml += `<Row><Cell><Data ss:Type="String">${r.timestamp}</Data></Cell><Cell><Data ss:Type="String">${r.turma || ""}</Data></Cell><Cell><Data ss:Type="String">${r.alunoNome || ""}</Data></Cell><Cell><Data ss:Type="String">${r.detalhe || ""}</Data></Cell></Row>`);
      xml += `</Table></Worksheet>`;
    });

    const backupData = { history: records, activeExits, coordinationQueue, libraryQueue, suspensions, avisos };
    const backupString = btoa(unescape(encodeURIComponent(JSON.stringify(backupData))));
    xml += `<Worksheet ss:Name="SYSTEM_BACKUP"><Table><Row><Cell><Data ss:Type="String">${backupString}</Data></Cell></Row></Table></Worksheet></Workbook>`;
    
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([xml], { type: 'application/vnd.ms-excel' }));
    link.download = `Relatorio_Anisio.xls`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-10">
       
       <div className="bg-white/90 p-6 rounded-[2rem] shadow-xl">
         <h3 className="font-extrabold text-sm flex items-center gap-2 mb-4"><Search size={18} className="text-indigo-600"/> Filtros de Análise e Exportação</h3>
         <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-extrabold text-slate-500 uppercase">Data Início</label><input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)}/></div>
            <div><label className="text-[10px] font-extrabold text-slate-500 uppercase">Data Fim</label><input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)}/></div>
         </div>
         <select className="w-full mt-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold appearance-none outline-none" value={tipoRelatorioExport} onChange={e => setTipoRelatorioExport(e.target.value)}>
             <option value="todos">Relatório Completo (Múltiplas Abas)</option>
             <option value="ocorrencia">Apenas Tabela de Ocorrências</option>
             <option value="saida">Apenas Tabela de Saídas</option>
         </select>
         <button onClick={downloadSmartReport} className="w-full bg-indigo-600 text-white py-4 rounded-xl mt-4 font-bold flex items-center justify-center gap-2">
            <Download size={18}/> GERAR FICHEIRO .XLS
         </button>
       </div>

       <div className="grid grid-cols-1 gap-5">
           <div className="bg-gradient-to-br from-red-50 to-white rounded-[2rem] border border-red-100 shadow-md p-6">
              <h3 className="text-sm font-extrabold text-red-800 mb-5 flex items-center gap-2"><UserX size={18}/> Top 10 Infratores</h3>
              <div className="grid grid-cols-2 gap-3">
                 {dashboardData.topInfratores.length === 0 ? <p className="text-xs text-red-400">Sem dados.</p> : dashboardData.topInfratores.map((aluno, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-red-100 shadow-sm">
                       <span className="text-xs font-bold text-slate-700 truncate pr-2"><span className="text-red-400 font-black mr-1">{i+1}º</span> {aluno.nome}</span>
                       <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-2 py-1 rounded-lg">{aluno.count}</span>
                    </div>
                 ))}
              </div>
           </div>
       </div>

       <div className="bg-white/90 p-6 rounded-[2rem] shadow-xl space-y-5 border-t-4 border-indigo-500 mt-10">
         <h3 className="font-extrabold text-sm flex items-center gap-2 text-slate-800"><UserPlus size={18} className="text-indigo-600"/> Gestão de Alunos</h3>
         <input type="text" placeholder="Nome Completo do Novo Aluno" className="w-full p-4 bg-slate-50 rounded-2xl border" value={nomeNovoAluno} onChange={e => setNomeNovoAluno(e.target.value)} />
         <div className="flex gap-2.5">
            <select className="flex-1 p-4 bg-slate-50 rounded-2xl border font-semibold text-slate-700" value={turmaNovoAluno} onChange={e => setTurmaNovoAluno(e.target.value)}>
                <option value="">Escolher Turma...</option>
                {turmasExistentes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={() => setModoNovaTurma(!modoNovaTurma)} className="bg-slate-100 p-4 rounded-2xl"><PlusCircle size={20}/></button>
         </div>
         {modoNovaTurma && <input type="text" placeholder="Criar Turma (Ex: 9A)" className="w-full p-4 border-2 border-indigo-300 rounded-2xl font-bold" value={turmaNovoAluno} onChange={e => setTurmaNovoAluno(e.target.value)} />}
         <button onClick={addManualStudent} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold">Adicionar Aluno</button>
       </div>

       <div className="bg-white/90 p-6 rounded-[2rem] shadow-xl space-y-5">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2"><Lock size={18}/> Bloqueios de Saída Automáticos</h3>
          <div className="grid grid-cols-2 gap-3">
             <input type="time" className="p-4 bg-slate-50 rounded-2xl border font-bold" value={novoBlockStart} onChange={e => setNovoBlockStart(e.target.value)}/>
             <input type="time" className="p-4 bg-slate-50 rounded-2xl border font-bold" value={novoBlockEnd} onChange={e => setNovoBlockEnd(e.target.value)}/>
          </div>
          <input type="text" placeholder="Motivo (ex: Intervalo)" className="w-full p-4 bg-slate-50 rounded-2xl border font-semibold" value={novoBlockLabel} onChange={e => setNovoBlockLabel(e.target.value)}/>
          <button onClick={() => { 
             if(!novoBlockStart || !novoBlockEnd || !novoBlockLabel) return showNotification("Preencha tudo.");
             const blocks = [...(config.autoBlocks || []), { start: novoBlockStart, end: novoBlockEnd, label: novoBlockLabel }];
             saveConfig({ autoBlocks: blocks }); setNovoBlockStart(''); setNovoBlockEnd(''); setNovoBlockLabel('');
          }} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold">ADICIONAR BLOQUEIO</button>
          
          <div className="space-y-2 pt-2">
             {(config.autoBlocks || []).map((b, i) => (
               <div key={i} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border">
                   <span className="text-[11px] font-bold text-slate-700"><span className="bg-white px-2 py-1 rounded-md border mr-2">{b.start} - {b.end}</span> {b.label}</span>
                   <button onClick={() => saveConfig({ autoBlocks: config.autoBlocks.filter((_, idx) => idx !== i) })} className="text-red-500 p-2"><Trash2 size={14}/></button>
               </div>
             ))}
          </div>
       </div>

       <div className="bg-white/90 p-6 rounded-[2rem] shadow-xl space-y-5">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2"><KeyRound size={18}/> Senhas do Sistema</h3>
          <div className="grid grid-cols-1 gap-4">
             {['admin', 'professor', 'apoio'].map(role => (
               <div key={role}>
                   <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1">{role}</label>
                   <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl border font-bold text-sm" value={editPasswords[role]} onChange={e => setEditPasswords({...editPasswords, [role]: e.target.value})}/>
               </div>
             ))}
          </div>
          <button onClick={() => saveConfig({ passwords: editPasswords })} className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-extrabold text-xs border">ATUALIZAR SENHAS</button>
       </div>

       {/* O BLOCO RESTAURADO DO BACKUP CSV/XLS */}
       <div className="grid grid-cols-2 gap-4 mt-8">
           <div className="bg-emerald-50/80 p-6 rounded-[2rem] border border-emerald-100/60 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-emerald-800 flex items-center gap-2"><FileUp size={18}/> Alunos (CSV)</h3>
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCsvUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-white border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-extrabold hover:shadow-md transition-all shadow-sm">Importar .csv</button>
           </div>
           <div className="bg-indigo-50/80 p-6 rounded-[2rem] border border-indigo-100/60 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-indigo-800 flex items-center gap-2"><DatabaseBackup size={18}/> Restaurar BD</h3>
              <input type="file" accept=".xls,.xml" ref={backupInputRef} onChange={handleExcelBackupUpload} className="hidden" />
              <button onClick={() => backupInputRef.current?.click()} className="w-full py-4 bg-white border border-indigo-200 text-indigo-700 rounded-2xl text-xs font-extrabold hover:shadow-md transition-all shadow-sm">Carregar .xls</button>
           </div>
       </div>

    </div>
  );
}
