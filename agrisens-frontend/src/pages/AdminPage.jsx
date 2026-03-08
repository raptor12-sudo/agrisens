import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Users, Plus, Trash2, Edit2, Shield, User, Search, RefreshCw,
  X, Check, AlertTriangle, MapPin, Cpu, Eye, EyeOff,
  ToggleLeft, ToggleRight, Lock, Mail, Phone, Building,
  Wifi, WifiOff, Settings, ChevronRight, Radio, Layers
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ROLES = [
  { value:'admin',       label:'Administrateur', color:'#f0883e' },
  { value:'user',        label:'Utilisateur',    color:'#58a6ff' },
  { value:'fermier',     label:'Agriculteur',    color:'#3fb950' },
  { value:'technicien',  label:'Technicien',     color:'#a78bfa' },
  { value:'observateur', label:'Observateur',    color:'#8b949e' },
];

const DEVICE_TYPES = ['capteur_sol','station_meteo','capteur_npk','capteur_ph','passerelle','autre'];

const S = {
  bg:'#0d1117', panel:'#161b22', card:'#1c2333', border:'#30363d',
  text:'#e6edf3', muted:'#8b949e', green:'#3fb950', red:'#f85149',
  blue:'#58a6ff', yellow:'#e3b341', orange:'#f0883e', purple:'#a78bfa',
};

const roleInfo = (r) => ROLES.find(x=>x.value===r)||ROLES[1];

/* ── Composants UI ─────────────────────────────────────── */
function Toast({msg}) {
  if(!msg) return null;
  return <div style={{position:'fixed',top:20,right:20,zIndex:3000,background:'#238636',border:'1px solid #2ea043',borderRadius:10,padding:'11px 18px',color:'white',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8,boxShadow:'0 8px 24px #0008'}}><Check size={14}/>{msg}</div>;
}

function Modal({title,onClose,children,width=480}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.78)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:S.panel,border:`1px solid ${S.border}`,borderRadius:14,padding:24,width:'100%',maxWidth:width,maxHeight:'92vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{margin:0,fontSize:15,fontWeight:700,color:S.text}}>{title}</h2>
          <button onClick={onClose} style={{background:'none',border:'none',color:S.muted,cursor:'pointer',display:'flex',borderRadius:6,padding:3}}><X size={17}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrBox({msg}) {
  if(!msg) return null;
  return <div style={{background:'#f8514918',border:'1px solid #f8514944',borderRadius:8,padding:'9px 13px',color:S.red,fontSize:12,marginBottom:14,display:'flex',alignItems:'center',gap:7}}><AlertTriangle size={13}/>{msg}</div>;
}

function Field({label,children}) {
  return <div style={{marginBottom:13}}><label style={{display:'block',fontSize:11,fontWeight:600,color:S.muted,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</label>{children}</div>;
}

function Inp({value,onChange,type='text',placeholder,icon:Icon,disabled}) {
  const [f,setF]=useState(false);
  return <div style={{position:'relative'}}>{Icon&&<Icon size={12} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:S.muted}}/>}<input disabled={disabled} type={type} value={value||''} onChange={onChange} placeholder={placeholder} style={{width:'100%',padding:`8px 12px 8px ${Icon?30:12}px`,background:disabled?'#0a0e14':'#0d1117',border:`1px solid ${f?S.blue:S.border}`,borderRadius:8,color:disabled?S.muted:S.text,fontSize:13,outline:'none',boxSizing:'border-box',transition:'border 0.15s'}} onFocus={()=>setF(true)} onBlur={()=>setF(false)}/></div>;
}

function Sel({value,onChange,children,disabled}) {
  return <select disabled={disabled} value={value||''} onChange={onChange} style={{width:'100%',padding:'8px 12px',background:disabled?'#0a0e14':'#0d1117',border:`1px solid ${S.border}`,borderRadius:8,color:S.text,fontSize:13,outline:'none',boxSizing:'border-box'}}>{children}</select>;
}

function Btn({onClick,color='#238636',children,outline,small,disabled}) {
  return <button onClick={onClick} disabled={disabled} style={{background:outline?'transparent':color,border:`1px solid ${color}`,color:outline?color:'white',borderRadius:8,padding:small?'5px 11px':'8px 16px',cursor:disabled?'not-allowed':'pointer',fontSize:small?11:13,fontWeight:600,display:'flex',alignItems:'center',gap:5,opacity:disabled?0.5:1}}>{children}</button>;
}

function StatusDot({online}) {
  return <span style={{width:7,height:7,borderRadius:'50%',background:online?S.green:S.red,boxShadow:online?`0 0 6px ${S.green}`:'none',display:'inline-block',flexShrink:0}}/>;
}

function RoleBadge({role}) {
  const ri=roleInfo(role);
  return <span style={{background:ri.color+'18',border:`1px solid ${ri.color}44`,color:ri.color,borderRadius:10,padding:'3px 9px',fontSize:11,fontWeight:600,display:'inline-flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}}>{role==='admin'?<Shield size={10}/>:<User size={10}/>}{ri.label}</span>;
}

/* ── Tableau générique ─────────────────────────────────── */
function Table({cols,rows,empty='Aucune donnée'}) {
  return (
    <div style={{background:S.panel,border:`1px solid ${S.border}`,borderRadius:12,overflow:'hidden'}}>
      <div style={{display:'grid',gridTemplateColumns:cols.map(c=>c.w||'1fr').join(' '),gap:8,padding:'9px 16px',borderBottom:`1px solid ${S.border}`,fontSize:10,fontWeight:700,color:S.muted,textTransform:'uppercase',letterSpacing:'0.5px'}}>
        {cols.map(c=><span key={c.key}>{c.label}</span>)}
      </div>
      {rows.length===0?<div style={{padding:36,textAlign:'center',color:S.muted,fontSize:13}}>{empty}</div>:
        rows.map((row,i)=>(
          <div key={row.id||i} style={{display:'grid',gridTemplateColumns:cols.map(c=>c.w||'1fr').join(' '),gap:8,padding:'11px 16px',borderBottom:`1px solid ${S.border}`,background:i%2?'#0d111722':'transparent',alignItems:'center'}}>
            {cols.map(c=><div key={c.key} style={{minWidth:0}}>{c.render?c.render(row):String(row[c.key]??'—')}</div>)}
          </div>
        ))
      }
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ONGLET UTILISATEURS
══════════════════════════════════════════════════════════ */
function UsersTab({fermes}) {
  const h={Authorization:`Bearer ${localStorage.getItem('accessToken')}`};
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [filterRole,setFilterRole]=useState('');
  const [modal,setModal]=useState(null);
  const [sel,setSel]=useState(null);
  const [form,setForm]=useState({});
  const [showPwd,setShowPwd]=useState(false);
  const [err,setErr]=useState('');
  const [toast,setToast]=useState('');
  const notify=m=>{setToast(m);setTimeout(()=>setToast(''),3000);};

  const load=useCallback(async()=>{setLoading(true);try{const r=await axios.get(`${API}/users`,{headers:h});setUsers(r.data||[]);}catch(e){console.error(e);}finally{setLoading(false);}});
  useEffect(()=>{load();},[]);

  const openCreate=()=>{setForm({nom:'',prenom:'',email:'',motDePasse:'',role:'user',telephone:'',ferme_id:''});setErr('');setShowPwd(false);setModal('create');};
  const openEdit=u=>{setSel(u);setForm({nom:u.nom||'',prenom:u.prenom||'',email:u.email||'',role:u.role||'user',telephone:u.telephone||'',ferme_id:u.ferme_id||'',motDePasse:''});setErr('');setShowPwd(false);setModal('edit');};
  const openDel=u=>{setSel(u);setErr('');setModal('del');};

  const doCreate=async()=>{setErr('');if(!form.nom||!form.prenom||!form.email||!form.motDePasse)return setErr('Prénom, nom, email et mot de passe requis');try{await axios.post(`${API}/users`,form,{headers:h});notify('Utilisateur créé');setModal(null);load();}catch(e){setErr(e.response?.data?.error||'Erreur');}};
  const doEdit=async()=>{setErr('');try{const p={...form};if(!p.motDePasse)delete p.motDePasse;if(p.ferme_id==='')p.ferme_id=null;await axios.patch(`${API}/users/${sel.id}`,p,{headers:h});notify('Utilisateur mis à jour');setModal(null);load();}catch(e){setErr(e.response?.data?.error||'Erreur');}};
  const doDel=async()=>{try{await axios.delete(`${API}/users/${sel.id}`,{headers:h});notify('Utilisateur supprimé');setModal(null);load();}catch(e){setErr(e.response?.data?.error||'Erreur');}};
  const toggleActive=async u=>{try{await axios.patch(`${API}/users/${u.id}`,{is_active:!u.is_active},{headers:h});notify(u.is_active?'Désactivé':'Activé');load();}catch(e){}};

  const filtered=users.filter(u=>{const q=search.toLowerCase();return(!q||(u.email+u.nom+u.prenom).toLowerCase().includes(q))&&(!filterRole||u.role===filterRole);});

  const UForm=({isCreate})=>(
    <div>
      <ErrBox msg={err}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Field label="Prénom *"><Inp value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} placeholder="Prénom" icon={User}/></Field>
        <Field label="Nom *"><Inp value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} placeholder="Nom"/></Field>
      </div>
      <Field label="Email *"><Inp type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@exemple.com" icon={Mail}/></Field>
      <Field label="Téléphone"><Inp value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} placeholder="+221 77 000 00 00" icon={Phone}/></Field>
      <Field label={isCreate?"Mot de passe *":"Nouveau mot de passe (vide = inchangé)"}>
        <div style={{position:'relative'}}>
          <Lock size={12} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:S.muted}}/>
          <input type={showPwd?'text':'password'} value={form.motDePasse||''} onChange={e=>setForm({...form,motDePasse:e.target.value})} placeholder={isCreate?"Min. 8 caractères":"Laisser vide"} style={{width:'100%',padding:'8px 36px 8px 30px',background:'#0d1117',border:`1px solid ${S.border}`,borderRadius:8,color:S.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
          <button type="button" onClick={()=>setShowPwd(p=>!p)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:S.muted,cursor:'pointer',display:'flex'}}>{showPwd?<EyeOff size={13}/>:<Eye size={13}/>}</button>
        </div>
      </Field>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Field label="Rôle"><Sel value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</Sel></Field>
        <Field label="Ferme assignée"><Sel value={form.ferme_id||''} onChange={e=>setForm({...form,ferme_id:e.target.value})}><option value="">— Aucune —</option>{fermes.map(f=><option key={f.id} value={f.id}>{f.nom}</option>)}</Sel></Field>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
        <Btn onClick={()=>setModal(null)} color={S.border} outline><X size={12}/>Annuler</Btn>
        <Btn onClick={isCreate?doCreate:doEdit}><Check size={12}/>{isCreate?'Créer':'Enregistrer'}</Btn>
      </div>
    </div>
  );

  return (
    <div>
      <Toast msg={toast}/>
      <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',gap:10,marginBottom:16}}>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',flex:1}}>
          <div style={{position:'relative',flex:1,minWidth:180}}>
            <Search size={12} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:S.muted}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." style={{width:'100%',padding:'8px 12px 8px 30px',background:S.panel,border:`1px solid ${S.border}`,borderRadius:8,color:S.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
          </div>
          <select value={filterRole} onChange={e=>setFilterRole(e.target.value)} style={{padding:'8px 12px',background:S.panel,border:`1px solid ${S.border}`,borderRadius:8,color:S.text,fontSize:13,outline:'none'}}>
            <option value="">Tous les rôles</option>{ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={load} style={{background:S.panel,border:`1px solid ${S.border}`,color:S.muted,borderRadius:8,padding:'7px 11px',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12}}><RefreshCw size={12}/>Actualiser</button>
          <Btn onClick={openCreate}><Plus size={13}/>Nouvel utilisateur</Btn>
        </div>
      </div>

      <Table
        cols={[
          {key:'nom',label:'Utilisateur',w:'2fr',render:u=><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:30,height:30,borderRadius:'50%',background:u.role==='admin'?'#f0883e33':'#23863633',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'white',flexShrink:0}}>{((u.prenom||u.email||'?')[0]).toUpperCase()}</div><div><div style={{fontSize:13,fontWeight:600,color:S.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.prenom} {u.nom}</div><div style={{fontSize:10,color:S.muted}}>{u.telephone||'—'}</div></div></div>},
          {key:'email',label:'Email',w:'2fr',render:u=><span style={{fontSize:12,color:S.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}>{u.email}</span>},
          {key:'role',label:'Rôle',w:'120px',render:u=><RoleBadge role={u.role}/>},
          {key:'ferme',label:'Ferme',w:'1fr',render:u=>{const f=fermes.find(x=>x.id===u.ferme_id);return f?<span style={{fontSize:12,color:S.green,display:'flex',alignItems:'center',gap:3}}><MapPin size={11}/>{f.nom}</span>:<span style={{fontSize:12,color:S.muted}}>—</span>;}},
          {key:'statut',label:'Statut',w:'80px',render:u=><button onClick={()=>toggleActive(u)} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:4,padding:0,color:u.is_active!==false?S.green:S.muted,fontSize:11}}>{u.is_active!==false?<ToggleRight size={16} color={S.green}/>:<ToggleLeft size={16}/>}{u.is_active!==false?'Actif':'Inactif'}</button>},
          {key:'actions',label:'',w:'80px',render:u=><div style={{display:'flex',gap:5}}><button onClick={()=>openEdit(u)} style={{background:'#58a6ff18',border:'1px solid #58a6ff33',color:S.blue,borderRadius:6,padding:'5px 7px',cursor:'pointer',display:'flex'}}><Edit2 size={12}/></button><button onClick={()=>openDel(u)} style={{background:'#f8514918',border:'1px solid #f8514933',color:S.red,borderRadius:6,padding:'5px 7px',cursor:'pointer',display:'flex'}}><Trash2 size={12}/></button></div>},
        ]}
        rows={loading?[]:filtered}
        empty={loading?'Chargement...':'Aucun utilisateur'}
      />

      {modal==='create'&&<Modal title="Nouvel utilisateur" onClose={()=>setModal(null)}><UForm isCreate/></Modal>}
      {modal==='edit'&&<Modal title={`Modifier — ${sel?.prenom} ${sel?.nom}`} onClose={()=>setModal(null)}><UForm isCreate={false}/></Modal>}
      {modal==='del'&&<Modal title="Confirmer la suppression" onClose={()=>setModal(null)} width={370}>
        <div style={{textAlign:'center',padding:'6px 0 18px'}}><AlertTriangle size={36} color={S.red} style={{marginBottom:10}}/><p style={{color:S.text,fontSize:15,margin:'0 0 6px',fontWeight:600}}>Supprimer {sel?.prenom} {sel?.nom} ?</p><p style={{color:S.muted,fontSize:12,margin:0}}>{sel?.email}</p><p style={{color:S.red,fontSize:11,marginTop:6}}>Action irréversible.</p></div>
        <ErrBox msg={err}/>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}><Btn onClick={()=>setModal(null)} color={S.border} outline><X size={12}/>Annuler</Btn><Btn onClick={doDel} color={S.red}><Trash2 size={12}/>Supprimer</Btn></div>
      </Modal>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ONGLET FERMES
══════════════════════════════════════════════════════════ */
function FermesTab({users,onFermesChange}) {
  const h={Authorization:`Bearer ${localStorage.getItem('accessToken')}`};
  const [fermes,setFermes]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(null);
  const [sel,setSel]=useState(null);
  const [form,setForm]=useState({});
  const [err,setErr]=useState('');
  const [toast,setToast]=useState('');
  const notify=m=>{setToast(m);setTimeout(()=>setToast(''),3000);};

  const load=useCallback(async()=>{setLoading(true);try{const r=await axios.get(`${API}/fermes`,{headers:h});setFermes(r.data||[]);onFermesChange&&onFermesChange(r.data||[]);}catch(e){console.error(e);}finally{setLoading(false);}});
  useEffect(()=>{load();},[]);

  const openCreate=()=>{setForm({nom:'',localisation:'',type_culture:'',superficie:'',latitude:'',longitude:''});setErr('');setModal('create');};
  const openEdit=f=>{setSel(f);setForm({nom:f.nom||'',localisation:f.localisation||'',type_culture:f.type_culture||'',superficie:f.superficie||'',latitude:f.latitude||'',longitude:f.longitude||''});setErr('');setModal('edit');};
  const openDel=f=>{setSel(f);setErr('');setModal('del');};

  const doCreate=async()=>{setErr('');if(!form.nom||!form.localisation)return setErr('Nom et localisation requis');try{const p={...form};if(p.superficie)p.superficie=parseFloat(p.superficie);if(p.latitude)p.latitude=parseFloat(p.latitude);if(p.longitude)p.longitude=parseFloat(p.longitude);await axios.post(`${API}/fermes`,p,{headers:h});notify('Ferme créée');setModal(null);load();}catch(e){setErr(e.response?.data?.error||'Erreur');}};
  const doEdit=async()=>{setErr('');try{const p={...form};if(p.superficie)p.superficie=parseFloat(p.superficie);if(p.latitude)p.latitude=parseFloat(p.latitude);if(p.longitude)p.longitude=parseFloat(p.longitude);await axios.put(`${API}/fermes/${sel.id}`,p,{headers:h});notify('Ferme mise à jour');setModal(null);load();}catch(e){setErr(e.response?.data?.error||'Erreur');}};
  const doDel=async()=>{try{await axios.delete(`${API}/fermes/${sel.id}`,{headers:h});notify('Ferme supprimée');setModal(null);load();}catch(e){setErr(e.response?.data?.error||'Erreur');}};

  const FForm=({isCreate})=>(
    <div>
      <ErrBox msg={err}/>
      <Field label="Nom de la ferme *"><Inp value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} placeholder="Ex: Ferme Diallo" icon={Building}/></Field>
      <Field label="Localisation *"><Inp value={form.localisation} onChange={e=>setForm({...form,localisation:e.target.value})} placeholder="Ex: Thiès, Sénégal" icon={MapPin}/></Field>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Field label="Type de culture"><Inp value={form.type_culture} onChange={e=>setForm({...form,type_culture:e.target.value})} placeholder="Ex: Maïs, Tomate"/></Field>
        <Field label="Superficie (ha)"><Inp type="number" value={form.superficie} onChange={e=>setForm({...form,superficie:e.target.value})} placeholder="Ex: 5.5"/></Field>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Field label="Latitude GPS"><Inp type="number" value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})} placeholder="14.6928"/></Field>
        <Field label="Longitude GPS"><Inp type="number" value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})} placeholder="-17.4467"/></Field>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
        <Btn onClick={()=>setModal(null)} color={S.border} outline><X size={12}/>Annuler</Btn>
        <Btn onClick={isCreate?doCreate:doEdit} color='#238636'><Check size={12}/>{isCreate?'Créer la ferme':'Enregistrer'}</Btn>
      </div>
    </div>
  );

  return (
    <div>
      <Toast msg={toast}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <span style={{fontSize:13,color:S.muted}}>{fermes.length} ferme{fermes.length>1?'s':''} enregistrée{fermes.length>1?'s':''}</span>
        <div style={{display:'flex',gap:8}}>
          <button onClick={load} style={{background:S.panel,border:`1px solid ${S.border}`,color:S.muted,borderRadius:8,padding:'7px 11px',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12}}><RefreshCw size={12}/>Actualiser</button>
          <Btn onClick={openCreate} color='#238636'><Plus size={13}/>Nouvelle ferme</Btn>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
        {loading?<div style={{color:S.muted,padding:20}}>Chargement...</div>:
        fermes.length===0?<div style={{color:S.muted,padding:20}}>Aucune ferme</div>:
        fermes.map(f=>{
          const owner=users.find(u=>u.id===f.owner_id);
          return (
            <div key={f.id} style={{background:S.panel,border:`1px solid ${S.border}`,borderRadius:12,padding:16,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,#3fb950,transparent)'}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:S.text}}>{f.nom}</div>
                  <div style={{fontSize:12,color:S.muted,display:'flex',alignItems:'center',gap:4,marginTop:2}}><MapPin size={11}/>{f.localisation}</div>
                </div>
                <div style={{display:'flex',gap:5}}>
                  <button onClick={()=>openEdit(f)} style={{background:'#58a6ff18',border:'1px solid #58a6ff33',color:S.blue,borderRadius:6,padding:'4px 7px',cursor:'pointer',display:'flex'}}><Edit2 size={12}/></button>
                  <button onClick={()=>openDel(f)} style={{background:'#f8514918',border:'1px solid #f8514933',color:S.red,borderRadius:6,padding:'4px 7px',cursor:'pointer',display:'flex'}}><Trash2 size={12}/></button>
                </div>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,fontSize:11,color:S.muted}}>
                {f.type_culture&&<span style={{background:'#3fb95018',border:'1px solid #3fb95033',borderRadius:6,padding:'2px 8px',color:S.green}}>{f.type_culture}</span>}
                {f.superficie&&<span>{f.superficie} ha</span>}
                {f.latitude&&<span style={{display:'flex',alignItems:'center',gap:3}}><MapPin size={10}/>{parseFloat(f.latitude).toFixed(4)}, {parseFloat(f.longitude).toFixed(4)}</span>}
              </div>
              {owner&&<div style={{marginTop:8,fontSize:11,color:S.muted,display:'flex',alignItems:'center',gap:4,borderTop:`1px solid ${S.border}`,paddingTop:8}}><User size={11}/>{owner.prenom} {owner.nom}</div>}
            </div>
          );
        })}
      </div>

      {modal==='create'&&<Modal title="Nouvelle ferme" onClose={()=>setModal(null)}><FForm isCreate/></Modal>}
      {modal==='edit'&&<Modal title={`Modifier — ${sel?.nom}`} onClose={()=>setModal(null)}><FForm isCreate={false}/></Modal>}
      {modal==='del'&&<Modal title="Supprimer la ferme" onClose={()=>setModal(null)} width={360}>
        <div style={{textAlign:'center',padding:'6px 0 18px'}}><AlertTriangle size={36} color={S.red} style={{marginBottom:10}}/><p style={{color:S.text,fontSize:14,fontWeight:600,margin:'0 0 6px'}}>Supprimer {sel?.nom} ?</p><p style={{color:S.muted,fontSize:12}}>Tous les devices associés seront détachés.</p></div>
        <ErrBox msg={err}/>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}><Btn onClick={()=>setModal(null)} color={S.border} outline><X size={12}/>Annuler</Btn><Btn onClick={doDel} color={S.red}><Trash2 size={12}/>Supprimer</Btn></div>
      </Modal>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ONGLET DEVICES
══════════════════════════════════════════════════════════ */
function DevicesTab({fermes}) {
  const h={Authorization:`Bearer ${localStorage.getItem('accessToken')}`};
  const [devices,setDevices]=useState([]);
  const [gateways,setGateways]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [filterStatut,setFilterStatut]=useState('');
  const [modal,setModal]=useState(null);
  const [sel,setSel]=useState(null);
  const [form,setForm]=useState({});
  const [err,setErr]=useState('');
  const [toast,setToast]=useState('');
  const notify=m=>{setToast(m);setTimeout(()=>setToast(''),3000);};

  const load=useCallback(async()=>{setLoading(true);try{const [dr,gr]=await Promise.all([axios.get(`${API}/devices`,{headers:h}),axios.get(`${API}/gateways`,{headers:h}).catch(()=>({data:[]}))]);setDevices(dr.data||[]);setGateways(gr.data||[]);}catch(e){console.error(e);}finally{setLoading(false);}});
  useEffect(()=>{load();},[]);

  const openCreate=()=>{setForm({device_uid:'',nom:'',type_device:'capteur_sol',firmware_version:'1.0.0',gateway_id:'',latitude:'',longitude:'',protocole_capteur:'LoRa'});setErr('');setModal('create');};
  const openEdit=d=>{setSel(d);setForm({device_uid:d.device_uid||'',nom:d.nom||'',type_device:d.type_device||'capteur_sol',firmware_version:d.firmware_version||'',gateway_id:d.gateway_id||'',latitude:d.latitude||'',longitude:d.longitude||'',protocole_capteur:d.protocole_capteur||'LoRa'});setErr('');setModal('edit');};
  const openDel=d=>{setSel(d);setErr('');setModal('del');};

  const doCreate=async()=>{setErr('');if(!form.device_uid||!form.nom)return setErr('UID et nom requis');try{const p={...form};if(p.latitude)p.latitude=parseFloat(p.latitude);if(p.longitude)p.longitude=parseFloat(p.longitude);if(!p.gateway_id)delete p.gateway_id;await axios.post(`${API}/devices`,p,{headers:h});notify('Device créé');setModal(null);load();}catch(e){setErr(e.response?.data?.error||'Erreur');}};
  const doEdit=async()=>{setErr('');try{const p={...form};if(p.latitude)p.latitude=parseFloat(p.latitude);if(p.longitude)p.longitude=parseFloat(p.longitude);if(!p.gateway_id)delete p.gateway_id;await axios.put(`${API}/devices/${sel.id}`,p,{headers:h});notify('Device mis à jour');setModal(null);load();}catch(e){setErr(e.response?.data?.error||'Erreur');}};
  const doDel=async()=>{try{await axios.delete(`${API}/devices/${sel.id}`,{headers:h});notify('Device supprimé');setModal(null);load();}catch(e){setErr(e.response?.data?.error||'Erreur');}};
  const toggleStatus=async d=>{try{const s=d.statut==='online'?'offline':'online';await axios.patch(`${API}/devices/${d.id}/status`,{statut:s},{headers:h});notify(`Statut → ${s}`);load();}catch(e){}};

  const filtered=devices.filter(d=>{const q=search.toLowerCase();return(!q||(d.nom+d.device_uid).toLowerCase().includes(q))&&(!filterStatut||d.statut===filterStatut);});

  const DForm=({isCreate})=>(
    <div>
      <ErrBox msg={err}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Field label="UID du device *"><Inp value={form.device_uid} onChange={e=>setForm({...form,device_uid:e.target.value})} placeholder="ESP32-SOL-001" disabled={!isCreate}/></Field>
        <Field label="Nom *"><Inp value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} placeholder="Capteur Sol Nord"/></Field>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Field label="Type de device">
          <Sel value={form.type_device} onChange={e=>setForm({...form,type_device:e.target.value})}>
            {DEVICE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
          </Sel>
        </Field>
        <Field label="Protocole"><Inp value={form.protocole_capteur} onChange={e=>setForm({...form,protocole_capteur:e.target.value})} placeholder="LoRa"/></Field>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Field label="Firmware"><Inp value={form.firmware_version} onChange={e=>setForm({...form,firmware_version:e.target.value})} placeholder="1.0.0"/></Field>
        <Field label="Gateway">
          <Sel value={form.gateway_id||''} onChange={e=>setForm({...form,gateway_id:e.target.value})}>
            <option value="">— Aucune gateway —</option>
            {gateways.map(g=><option key={g.id} value={g.id}>{g.nom||g.gateway_eui}</option>)}
          </Sel>
        </Field>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Field label="Latitude GPS"><Inp type="number" value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})} placeholder="14.6928"/></Field>
        <Field label="Longitude GPS"><Inp type="number" value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})} placeholder="-17.4467"/></Field>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
        <Btn onClick={()=>setModal(null)} color={S.border} outline><X size={12}/>Annuler</Btn>
        <Btn onClick={isCreate?doCreate:doEdit} color='#238636'><Check size={12}/>{isCreate?'Créer le device':'Enregistrer'}</Btn>
      </div>
    </div>
  );

  return (
    <div>
      <Toast msg={toast}/>
      <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',gap:10,marginBottom:16}}>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',flex:1}}>
          <div style={{position:'relative',flex:1,minWidth:180}}>
            <Search size={12} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:S.muted}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher device..." style={{width:'100%',padding:'8px 12px 8px 30px',background:S.panel,border:`1px solid ${S.border}`,borderRadius:8,color:S.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
          </div>
          <select value={filterStatut} onChange={e=>setFilterStatut(e.target.value)} style={{padding:'8px 12px',background:S.panel,border:`1px solid ${S.border}`,borderRadius:8,color:S.text,fontSize:13,outline:'none'}}>
            <option value="">Tous les statuts</option>
            <option value="online">En ligne</option>
            <option value="offline">Hors ligne</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={load} style={{background:S.panel,border:`1px solid ${S.border}`,color:S.muted,borderRadius:8,padding:'7px 11px',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12}}><RefreshCw size={12}/>Actualiser</button>
          <Btn onClick={openCreate} color='#238636'><Plus size={13}/>Nouveau device</Btn>
        </div>
      </div>

      <Table
        cols={[
          {key:'uid',label:'Device',w:'2fr',render:d=><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:30,height:30,borderRadius:8,background:'#58a6ff18',border:'1px solid #58a6ff33',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Cpu size={14} color={S.blue}/></div><div><div style={{fontSize:13,fontWeight:600,color:S.text}}>{d.nom}</div><div style={{fontSize:10,color:S.muted}}>{d.device_uid}</div></div></div>},
          {key:'type',label:'Type',w:'1fr',render:d=><span style={{background:'#58a6ff18',border:'1px solid #58a6ff33',color:S.blue,borderRadius:8,padding:'2px 8px',fontSize:11}}>{d.type_device}</span>},
          {key:'statut',label:'Statut',w:'90px',render:d=><button onClick={()=>toggleStatus(d)} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:5,padding:0,color:d.statut==='online'?S.green:S.red,fontSize:11}}><StatusDot online={d.statut==='online'}/>{d.statut}</button>},
          {key:'battery',label:'Batt.',w:'70px',render:d=><span style={{fontSize:12,color:d.battery_level>50?S.green:d.battery_level>20?S.yellow:S.red}}>{d.battery_level!=null?`${d.battery_level}%`:'—'}</span>},
          {key:'rssi',label:'RSSI',w:'70px',render:d=><span style={{fontSize:12,color:S.muted}}>{d.lora_rssi!=null?`${d.lora_rssi}dB`:'—'}</span>},
          {key:'last',label:'Vu',w:'100px',render:d=><span style={{fontSize:11,color:S.muted}}>{d.derniere_transmission?new Date(d.derniere_transmission).toLocaleString('fr',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—'}</span>},
          {key:'actions',label:'',w:'70px',render:d=><div style={{display:'flex',gap:5}}><button onClick={()=>openEdit(d)} style={{background:'#58a6ff18',border:'1px solid #58a6ff33',color:S.blue,borderRadius:6,padding:'5px 7px',cursor:'pointer',display:'flex'}}><Edit2 size={12}/></button><button onClick={()=>openDel(d)} style={{background:'#f8514918',border:'1px solid #f8514933',color:S.red,borderRadius:6,padding:'5px 7px',cursor:'pointer',display:'flex'}}><Trash2 size={12}/></button></div>},
        ]}
        rows={loading?[]:filtered}
        empty={loading?'Chargement...':'Aucun device'}
      />

      {modal==='create'&&<Modal title="Nouveau device" onClose={()=>setModal(null)}><DForm isCreate/></Modal>}
      {modal==='edit'&&<Modal title={`Modifier — ${sel?.nom}`} onClose={()=>setModal(null)}><DForm isCreate={false}/></Modal>}
      {modal==='del'&&<Modal title="Supprimer le device" onClose={()=>setModal(null)} width={360}>
        <div style={{textAlign:'center',padding:'6px 0 18px'}}><AlertTriangle size={36} color={S.red} style={{marginBottom:10}}/><p style={{color:S.text,fontSize:14,fontWeight:600,margin:'0 0 6px'}}>Supprimer {sel?.nom} ?</p><p style={{color:S.muted,fontSize:12}}>{sel?.device_uid}</p></div>
        <ErrBox msg={err}/>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}><Btn onClick={()=>setModal(null)} color={S.border} outline><X size={12}/>Annuler</Btn><Btn onClick={doDel} color={S.red}><Trash2 size={12}/>Supprimer</Btn></div>
      </Modal>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE ADMIN
══════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const [tab,setTab]=useState('users');
  const [fermes,setFermes]=useState([]);
  const [users,setUsers]=useState([]);

  const TABS=[
    {id:'users',   label:'Utilisateurs', icon:Users,   color:S.blue},
    {id:'fermes',  label:'Fermes',       icon:Building,color:S.green},
    {id:'devices', label:'Devices',      icon:Cpu,     color:S.purple},
  ];

  return (
    <div style={{background:S.bg,minHeight:'100%',color:S.text,fontFamily:'Inter,system-ui,sans-serif',padding:'clamp(12px,3vw,24px)',overflowY:'auto'}}>

      {/* Header */}
      <div style={{marginBottom:20}}>
        <h1 style={{margin:'0 0 4px',fontSize:'clamp(16px,3vw,20px)',fontWeight:700,color:S.text,display:'flex',alignItems:'center',gap:8}}>
          <Settings size={20} color={S.blue}/>Administration
        </h1>
        <p style={{margin:0,fontSize:12,color:S.muted}}>Gestion des utilisateurs, fermes et équipements IoT</p>
      </div>

      {/* Onglets */}
      <div style={{display:'flex',gap:4,marginBottom:24,borderBottom:`1px solid ${S.border}`,flexWrap:'wrap'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:tab===t.id?t.color+'18':'transparent',
            border:`1px solid ${tab===t.id?t.color+'55':'transparent'}`,
            borderBottom:tab===t.id?`2px solid ${t.color}`:'2px solid transparent',
            color:tab===t.id?t.color:S.muted,
            borderRadius:'8px 8px 0 0',padding:'9px 18px',cursor:'pointer',
            fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:6,
            transition:'all 0.15s',marginBottom:-1,
          }}>
            <t.icon size={14}/>{t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {tab==='users'  &&<UsersTab   fermes={fermes}/>}
      {tab==='fermes' &&<FermesTab  users={users} onFermesChange={setFermes}/>}
      {tab==='devices'&&<DevicesTab fermes={fermes}/>}

      <style>{"@keyframes spin{to{transform:rotate(360deg)}} @media(max-width:600px){}"}</style>
    </div>
  );
}
