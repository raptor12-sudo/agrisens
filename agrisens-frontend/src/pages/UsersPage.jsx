import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Users, Plus, Trash2, Edit2, Shield, User, Search,
  RefreshCw, X, Check, AlertTriangle, MapPin, Cpu,
  Eye, EyeOff, ToggleLeft, ToggleRight, ChevronDown,
  Lock, Mail, Phone, Building
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ROLES = [
  { value:'admin',       label:'Administrateur', color:'#f0883e', bg:'#f0883e18' },
  { value:'user',        label:'Utilisateur',    color:'#58a6ff', bg:'#58a6ff18' },
  { value:'fermier',     label:'Agriculteur',    color:'#3fb950', bg:'#3fb95018' },
  { value:'technicien',  label:'Technicien',     color:'#a78bfa', bg:'#a78bfa18' },
  { value:'observateur', label:'Observateur',    color:'#8b949e', bg:'#8b949e18' },
];

const S = {
  bg:'#0d1117', panel:'#161b22', card:'#1c2333', border:'#30363d',
  text:'#e6edf3', muted:'#8b949e', green:'#3fb950', red:'#f85149',
  blue:'#58a6ff', yellow:'#e3b341',
};

const roleInfo = (r) => ROLES.find(x=>x.value===r) || ROLES[1];

function Modal({ title, onClose, children, width=460 }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:S.panel,border:`1px solid ${S.border}`,borderRadius:14,padding:24,width:'100%',maxWidth:width,maxHeight:'92vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{margin:0,fontSize:16,fontWeight:700,color:S.text}}>{title}</h2>
          <button onClick={onClose} style={{background:'none',border:'none',color:S.muted,cursor:'pointer',padding:4,borderRadius:6,display:'flex'}}>
            <X size={18}/>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({label,icon:Icon,children}) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:600,color:S.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>
        {Icon&&<Icon size={11}/>}{label}
      </label>
      {children}
    </div>
  );
}

function Input({value,onChange,type='text',placeholder,icon:Icon}) {
  const [focus,setFocus]=useState(false);
  return (
    <div style={{position:'relative'}}>
      {Icon&&<Icon size={13} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:S.muted}}/>}
      <input type={type} value={value||''} onChange={onChange} placeholder={placeholder}
        style={{width:'100%',padding:`9px 12px 9px ${Icon?32:12}px`,background:'#0d1117',border:`1px solid ${focus?S.blue:S.border}`,borderRadius:8,color:S.text,fontSize:13,outline:'none',boxSizing:'border-box',transition:'border 0.15s'}}
        onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
      />
    </div>
  );
}

function Select({value,onChange,children}) {
  return (
    <select value={value||''} onChange={onChange}
      style={{width:'100%',padding:'9px 12px',background:'#0d1117',border:`1px solid ${S.border}`,borderRadius:8,color:S.text,fontSize:13,outline:'none',boxSizing:'border-box'}}>
      {children}
    </select>
  );
}

function Btn({onClick,color='#238636',bg,children,outline=false,small=false,disabled=false}) {
  const [h,setH]=useState(false);
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background:outline?'transparent':(bg||color),
      border:`1px solid ${color}`,color:outline?color:'white',
      borderRadius:8,padding:small?'5px 11px':'8px 16px',
      cursor:disabled?'not-allowed':'pointer',fontSize:small?11:13,
      fontWeight:600,display:'flex',alignItems:'center',gap:5,
      opacity:disabled?0.5:h?0.85:1,transition:'opacity 0.15s',
    }} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}>
      {children}
    </button>
  );
}

function RoleBadge({role,onClick}) {
  const ri=roleInfo(role);
  return (
    <span onClick={onClick} style={{background:ri.bg,border:`1px solid ${ri.color}44`,color:ri.color,borderRadius:10,padding:'3px 9px',fontSize:11,fontWeight:600,cursor:onClick?'pointer':'default',display:'inline-flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}}>
      {role==='admin'?<Shield size={10}/>:<User size={10}/>}{ri.label}
    </span>
  );
}

export default function UsersPage() {
  const headers = {Authorization:`Bearer ${localStorage.getItem('accessToken')}`};
  const [users,   setUsers]   = useState([]);
  const [fermes,  setFermes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [modal,   setModal]   = useState(null);
  const [selUser, setSelUser] = useState(null);
  const [form,    setForm]    = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [error,   setError]   = useState('');
  const [toast,   setToast]   = useState('');

  const notify = (msg) => { setToast(msg); setTimeout(()=>setToast(''),3000); };

  const fetchAll = useCallback(async()=>{
    setLoading(true);
    try {
      const [uR,fR]=await Promise.all([
        axios.get(`${API}/users`,  {headers}),
        axios.get(`${API}/fermes`, {headers}),
      ]);
      setUsers(uR.data||[]);
      setFermes(fR.data||[]);
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{fetchAll();},[]);

  const openCreate = ()=>{
    setForm({nom:'',prenom:'',email:'',motDePasse:'',role:'user',telephone:'',ferme_id:''});
    setError('');setShowPwd(false);setModal('create');
  };
  const openEdit = (u)=>{
    setSelUser(u);
    setForm({nom:u.nom||'',prenom:u.prenom||'',email:u.email||'',role:u.role||'user',telephone:u.telephone||'',ferme_id:u.ferme_id||'',motDePasse:''});
    setError('');setShowPwd(false);setModal('edit');
  };
  const openDelete = (u)=>{ setSelUser(u); setModal('delete'); };

  const handleCreate = async()=>{
    setError('');
    if(!form.nom||!form.prenom||!form.email||!form.motDePasse)
      return setError('Tous les champs obligatoires doivent être remplis');
    try {
      await axios.post(`${API}/users`,form,{headers});
      notify('Utilisateur créé avec succès'); setModal(null); fetchAll();
    } catch(e){setError(e.response?.data?.error||'Erreur lors de la création');}
  };

  const handleEdit = async()=>{
    setError('');
    try {
      const p={...form}; if(!p.motDePasse) delete p.motDePasse;
      await axios.patch(`${API}/users/${selUser.id}`,p,{headers});
      notify('Utilisateur mis à jour'); setModal(null); fetchAll();
    } catch(e){setError(e.response?.data?.error||'Erreur lors de la modification');}
  };

  const handleDelete = async()=>{
    try {
      await axios.delete(`${API}/users/${selUser.id}`,{headers});
      notify('Utilisateur supprimé'); setModal(null); fetchAll();
    } catch(e){setError(e.response?.data?.error||'Erreur suppression');}
  };

  const toggleActive = async(u)=>{
    try {
      await axios.patch(`${API}/users/${u.id}`,{is_active:!u.is_active},{headers});
      notify(u.is_active?'Compte désactivé':'Compte activé'); fetchAll();
    } catch(e){console.error(e);}
  };

  const filtered = users.filter(u=>{
    const q=search.toLowerCase();
    const matchQ=!q||(u.email||'').toLowerCase().includes(q)||(u.nom||'').toLowerCase().includes(q)||(u.prenom||'').toLowerCase().includes(q);
    const matchR=!filterRole||u.role===filterRole;
    return matchQ&&matchR;
  });

  const stats = {
    total:users.length,
    admins:users.filter(u=>u.role==='admin').length,
    actifs:users.filter(u=>u.is_active!==false).length,
    fermes:fermes.length,
  };

  const UserForm = ({isCreate})=>(
    <div>
      {error&&<div style={{background:'#f8514922',border:'1px solid #f8514944',borderRadius:8,padding:'9px 13px',color:S.red,fontSize:13,marginBottom:14,display:'flex',alignItems:'center',gap:7}}><AlertTriangle size={14}/>{error}</div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Field label="Prénom" icon={User}><Input value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} placeholder="Prénom" icon={User}/></Field>
        <Field label="Nom" icon={User}><Input value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} placeholder="Nom" /></Field>
      </div>
      <Field label="Email" icon={Mail}><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@exemple.com" icon={Mail}/></Field>
      <Field label="Téléphone" icon={Phone}><Input value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} placeholder="+221 77 000 00 00" icon={Phone}/></Field>
      <Field label={isCreate?"Mot de passe":"Nouveau mot de passe (laisser vide pour ne pas changer)"} icon={Lock}>
        <div style={{position:'relative'}}>
          <Lock size={13} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:S.muted}}/>
          <input type={showPwd?'text':'password'} value={form.motDePasse||''} onChange={e=>setForm({...form,motDePasse:e.target.value})}
            placeholder={isCreate?"Minimum 8 caractères":"Laisser vide pour conserver"}
            style={{width:'100%',padding:'9px 38px 9px 32px',background:'#0d1117',border:`1px solid ${S.border}`,borderRadius:8,color:S.text,fontSize:13,outline:'none',boxSizing:'border-box'}}
          />
          <button type="button" onClick={()=>setShowPwd(p=>!p)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:S.muted,cursor:'pointer',display:'flex'}}>
            {showPwd?<EyeOff size={14}/>:<Eye size={14}/>}
          </button>
        </div>
      </Field>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Field label="Rôle" icon={Shield}>
          <Select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
            {ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
        </Field>
        <Field label="Ferme assignée" icon={Building}>
          <Select value={form.ferme_id||''} onChange={e=>setForm({...form,ferme_id:e.target.value||null})}>
            <option value="">— Aucune ferme —</option>
            {fermes.map(f=><option key={f.id} value={f.id}>{f.nom}</option>)}
          </Select>
        </Field>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:6}}>
        <Btn onClick={()=>setModal(null)} color={S.border} outline><X size={13}/>Annuler</Btn>
        <Btn onClick={isCreate?handleCreate:handleEdit}><Check size={13}/>{isCreate?'Créer':'Enregistrer'}</Btn>
      </div>
    </div>
  );

  return (
    <div style={{background:S.bg,minHeight:'100%',color:S.text,fontFamily:'Inter,system-ui,sans-serif',padding:'clamp(12px,3vw,24px)',overflowY:'auto'}}>

      {/* Toast */}
      {toast&&<div style={{position:'fixed',top:20,right:20,zIndex:2000,background:'#238636',border:'1px solid #2ea043',borderRadius:10,padding:'12px 18px',color:'white',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8,boxShadow:'0 8px 24px #0008'}}>
        <Check size={15}/>{toast}
      </div>}

      {/* Header */}
      <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:20}}>
        <div>
          <h1 style={{margin:0,fontSize:'clamp(16px,3vw,20px)',fontWeight:700,color:S.text,display:'flex',alignItems:'center',gap:8}}>
            <Users size={20} color={S.blue}/>Gestion des utilisateurs
          </h1>
          <p style={{margin:'3px 0 0',fontSize:12,color:S.muted}}>{stats.total} utilisateurs · {stats.admins} admin{stats.admins>1?'s':''} · {stats.actifs} actifs</p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={fetchAll} style={{background:S.panel,border:`1px solid ${S.border}`,color:S.muted,borderRadius:8,padding:'7px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:5,fontSize:12}}>
            <RefreshCw size={12}/>Actualiser
          </button>
          <Btn onClick={openCreate}><Plus size={14}/>Nouvel utilisateur</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10,marginBottom:18}}>
        {[
          {label:'Total',        value:stats.total,  color:S.blue},
          {label:'Admins',       value:stats.admins, color:'#f0883e'},
          {label:'Actifs',       value:stats.actifs, color:S.green},
          {label:'Fermes',       value:stats.fermes, color:'#a78bfa'},
        ].map(k=>(
          <div key={k.label} style={{background:S.panel,border:`1px solid ${S.border}`,borderRadius:10,padding:'12px 16px'}}>
            <div style={{fontSize:'clamp(18px,3vw,24px)',fontWeight:800,color:k.color}}>{k.value}</div>
            <div style={{fontSize:11,color:S.muted,marginTop:2}}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:'1',minWidth:200}}>
          <Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:S.muted}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..."
            style={{width:'100%',padding:'8px 12px 8px 32px',background:S.panel,border:`1px solid ${S.border}`,borderRadius:8,color:S.text,fontSize:13,outline:'none',boxSizing:'border-box'}}
          />
        </div>
        <select value={filterRole} onChange={e=>setFilterRole(e.target.value)}
          style={{padding:'8px 12px',background:S.panel,border:`1px solid ${S.border}`,borderRadius:8,color:S.text,fontSize:13,outline:'none'}}>
          <option value="">Tous les rôles</option>
          {ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Table — desktop */}
      <div style={{background:S.panel,border:`1px solid ${S.border}`,borderRadius:12,overflow:'hidden',display:'block'}}>
        {/* Header */}
        <div style={{display:'grid',gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr auto',gap:8,padding:'10px 16px',borderBottom:`1px solid ${S.border}`,fontSize:10,fontWeight:700,color:S.muted,textTransform:'uppercase',letterSpacing:'0.5px'}}>
          <span>Utilisateur</span><span>Email</span><span>Rôle</span><span>Ferme</span><span>Statut</span><span>Actions</span>
        </div>

        {loading?(
          <div style={{padding:40,textAlign:'center',color:S.muted}}><RefreshCw size={18} style={{animation:'spin 1s linear infinite'}}/></div>
        ):filtered.length===0?(
          <div style={{padding:40,textAlign:'center',color:S.muted}}>Aucun utilisateur trouvé</div>
        ):filtered.map((u,i)=>{
          const ferme=fermes.find(f=>f.id===u.ferme_id);
          const actif=u.is_active!==false;
          return (
            <div key={u.id} style={{display:'grid',gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr auto',gap:8,padding:'11px 16px',borderBottom:`1px solid ${S.border}`,background:i%2?'#0d111722':'transparent',alignItems:'center'}}>
              {/* Nom */}
              <div style={{display:'flex',alignItems:'center',gap:9,minWidth:0}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:u.role==='admin'?'#f0883e33':'#238636',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'white',flexShrink:0}}>
                  {((u.prenom||u.email||'?')[0]).toUpperCase()}
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:S.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.prenom} {u.nom}</div>
                  <div style={{fontSize:10,color:S.muted}}>{u.telephone||'—'}</div>
                </div>
              </div>
              {/* Email */}
              <div style={{fontSize:12,color:S.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</div>
              {/* Rôle */}
              <div><RoleBadge role={u.role}/></div>
              {/* Ferme */}
              <div style={{fontSize:12,color:ferme?S.green:S.muted,display:'flex',alignItems:'center',gap:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {ferme?<><MapPin size={11}/>{ferme.nom}</>:'—'}
              </div>
              {/* Statut */}
              <div>
                <button onClick={()=>toggleActive(u)} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:5,color:actif?S.green:S.muted,fontSize:11,padding:0}}>
                  {actif?<ToggleRight size={18} color={S.green}/>:<ToggleLeft size={18} color={S.muted}/>}
                  {actif?'Actif':'Inactif'}
                </button>
              </div>
              {/* Actions */}
              <div style={{display:'flex',gap:5}}>
                <button onClick={()=>openEdit(u)} title="Modifier" style={{background:'#58a6ff18',border:'1px solid #58a6ff33',color:S.blue,borderRadius:6,padding:'5px 7px',cursor:'pointer',display:'flex'}}>
                  <Edit2 size={13}/>
                </button>
                <button onClick={()=>openDelete(u)} title="Supprimer" style={{background:'#f8514918',border:'1px solid #f8514933',color:S.red,borderRadius:6,padding:'5px 7px',cursor:'pointer',display:'flex'}}>
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile cards — visible sur petit écran */}
      <div style={{display:'none'}} className="mobile-cards">
        {filtered.map(u=>{
          const ferme=fermes.find(f=>f.id===u.ferme_id);
          return(
            <div key={u.id+'m'} style={{background:S.panel,border:`1px solid ${S.border}`,borderRadius:12,padding:14,marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'#238636',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'white'}}>
                    {((u.prenom||u.email||'?')[0]).toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:S.text}}>{u.prenom} {u.nom}</div>
                    <div style={{fontSize:11,color:S.muted}}>{u.email}</div>
                  </div>
                </div>
                <RoleBadge role={u.role}/>
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
                {ferme&&<span style={{fontSize:11,color:S.green,display:'flex',alignItems:'center',gap:3}}><MapPin size={11}/>{ferme.nom}</span>}
                <span style={{fontSize:11,color:S.muted}}>{u.telephone||'Pas de tél.'}</span>
              </div>
              <div style={{display:'flex',gap:8}}>
                <Btn onClick={()=>openEdit(u)} small color={S.blue}><Edit2 size={12}/>Modifier</Btn>
                <Btn onClick={()=>openDelete(u)} small color={S.red}><Trash2 size={12}/>Supprimer</Btn>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Créer */}
      {modal==='create'&&<Modal title="Nouvel utilisateur" onClose={()=>setModal(null)}><UserForm isCreate/></Modal>}

      {/* Modal Modifier */}
      {modal==='edit'&&<Modal title={`Modifier — ${selUser?.prenom} ${selUser?.nom}`} onClose={()=>setModal(null)}><UserForm isCreate={false}/></Modal>}

      {/* Modal Supprimer */}
      {modal==='delete'&&(
        <Modal title="Confirmer la suppression" onClose={()=>setModal(null)} width={380}>
          <div style={{textAlign:'center',padding:'8px 0 20px'}}>
            <AlertTriangle size={38} color={S.red} style={{marginBottom:12}}/>
            <p style={{color:S.text,fontSize:15,margin:'0 0 8px',fontWeight:600}}>Supprimer {selUser?.prenom} {selUser?.nom} ?</p>
            <p style={{color:S.muted,fontSize:12,margin:0}}>{selUser?.email}</p>
            <p style={{color:S.red,fontSize:12,marginTop:8}}>Cette action est irréversible.</p>
          </div>
          {error&&<div style={{background:'#f8514922',borderRadius:8,padding:'8px 12px',color:S.red,fontSize:12,marginBottom:12}}>{error}</div>}
          <div style={{display:'flex',gap:10,justifyContent:'center'}}>
            <Btn onClick={()=>setModal(null)} color={S.border} outline><X size={13}/>Annuler</Btn>
            <Btn onClick={handleDelete} color={S.red}><Trash2 size={13}/>Supprimer définitivement</Btn>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:640px){
          .mobile-cards{display:block!important}
          [style*="gridTemplateColumns"]{display:none!important}
        }
      `}</style>
    </div>
  );
}
