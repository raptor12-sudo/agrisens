import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import {
  Thermometer, Droplets, Wind, Zap, Sun, CloudRain, Activity,
  RefreshCw, AlertTriangle, Battery, Wifi, Bell, Cpu, Radio,
  TrendingUp, TrendingDown, Minus, LayoutDashboard, Clock
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const SENSOR_META = {
  temperature:  { icon: Thermometer, color: '#ff6b6b', unit: 'C',   label: 'Temperature',  min: 0,   max: 50     },
  humidite_sol: { icon: Droplets,    color: '#4ecdc4', unit: '%',   label: 'Humidite Sol', min: 0,   max: 100    },
  humidite_air: { icon: Wind,        color: '#45b7d1', unit: '%',   label: 'Humidite Air', min: 0,   max: 100    },
  ph:           { icon: Zap,         color: '#96ceb4', unit: 'pH',  label: 'pH Sol',       min: 0,   max: 14     },
  conductivite: { icon: Activity,    color: '#ffeaa7', unit: 'dS/m',label: 'Conductivite', min: 0,   max: 5      },
  luminosite:   { icon: Sun,         color: '#fdcb6e', unit: 'lux', label: 'Luminosite',   min: 0,   max: 100000 },
  pluviometrie: { icon: CloudRain,   color: '#74b9ff', unit: 'mm',  label: 'Pluviometrie', min: 0,   max: 200    },
};

const S = {
  bg: '#0d1117', panel: '#161b22', card: '#1c2333', border: '#30363d',
  text: '#e6edf3', muted: '#8b949e', green: '#3fb950', red: '#f85149',
  blue: '#58a6ff', yellow: '#e3b341',
};

function Gauge({ value, min=0, max=100, color='#58a6ff', size=80 }) {
  const pct = Math.min(1, Math.max(0, (value-min)/(max-min)));
  const r=34, cx=size/2, cy=size/2+4;
  const xy = d => ({ x: cx+r*Math.cos(d*Math.PI/180), y: cy+r*Math.sin(d*Math.PI/180) });
  const s=xy(-215), e=xy(35), c=xy(-215+pct*250);
  const lg=pct*250>180?1:0;
  return (
    <svg width={size} height={size*0.78} style={{overflow:'visible'}}>
      <path d={`M${s.x} ${s.y} A${r} ${r} 0 1 1 ${e.x} ${e.y}`} fill="none" stroke="#ffffff10" strokeWidth={6} strokeLinecap="round"/>
      <path d={`M${s.x} ${s.y} A${r} ${r} 0 ${lg} 1 ${c.x} ${c.y}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" style={{filter:`drop-shadow(0 0 4px ${color}88)`}}/>
      <circle cx={c.x} cy={c.y} r={4} fill={color}/>
    </svg>
  );
}

function SensorWidget({ cap, value, history, selected, onClick }) {
  const meta = SENSOR_META[cap.type_mesure] || {icon:Activity,color:S.blue,unit:'',label:cap.type_mesure,min:0,max:100};
  const Icon = meta.icon;
  const trend = history?.length>2 ? history[history.length-1]?.v - history[0]?.v : 0;
  const TIcon = trend>0.5?TrendingUp:trend<-0.5?TrendingDown:Minus;
  const tc = trend>0.5?S.green:trend<-0.5?S.red:S.muted;
  return (
    <div onClick={onClick} style={{background:selected?meta.color+'18':S.card,border:`1px solid ${selected?meta.color+'66':S.border}`,borderRadius:12,padding:'14px',cursor:'pointer',position:'relative',overflow:'hidden',transition:'all 0.2s'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${meta.color},transparent)`}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <Icon size={13} color={meta.color}/>
          <span style={{fontSize:10,color:S.muted,fontWeight:500}}>{meta.label}</span>
        </div>
        <TIcon size={12} color={tc}/>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <Gauge value={value??0} min={meta.min} max={meta.max} color={meta.color} size={72}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:meta.color,lineHeight:1}}>{value!=null?Number(value).toFixed(1):'--'}</div>
          <div style={{fontSize:11,color:S.muted}}>{meta.unit}</div>
        </div>
      </div>
      {history?.length>1&&(
        <div style={{marginTop:6}}>
          <ResponsiveContainer width="100%" height={30}>
            <LineChart data={history}>
              <Line type="monotone" dataKey="v" stroke={meta.color} strokeWidth={1.5} dot={false} isAnimationActive={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const token = localStorage.getItem('accessToken');
  const headers = { Authorization: `Bearer ${token}` };
  const [devices,  setDevices]  = useState([]);
  const [alertes,  setAlertes]  = useState([]);
  const [lastVals, setLastVals] = useState({});
  const [history,  setHistory]  = useState({});
  const [selDev,   setSelDev]   = useState(null);
  const [selCap,   setSelCap]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const timer = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [dR, aR] = await Promise.all([
        axios.get(`${API}/devices`, {headers}),
        axios.get(`${API}/alertes`, {headers}),
      ]);
      const devs = (dR.data||[]).sort((a,b)=>
        a.statut==='online'&&b.statut!=='online'?-1:
        b.statut==='online'&&a.statut!=='online'?1:0
      );
      setAlertes((aR.data||[]).filter(a=>a.statut==='active').slice(0,5));
      const nl={}, nh={};
      await Promise.all(devs.map(async dev=>{
        try {
          const cr = await axios.get(`${API}/capteurs/device/${dev.id}`,{headers});
          dev.capteurs = cr.data||[];
          await Promise.all(dev.capteurs.map(async cap=>{
            try {
              const dr = await axios.get(`${API}/capteurs/${cap.id}/derniere`,{headers}).catch(()=>null);
              if(dr?.data?.derniere_valeur!=null) nl[cap.id]=parseFloat(dr.data.derniere_valeur);
              const hr = await axios.get(`${API}/capteurs/${cap.id}/lectures?from=-6h&granularity=15m`,{headers}).catch(()=>null);
              if(hr?.data?.length) nh[cap.id]=hr.data.map(p=>({
                t:new Date(p.time||p._time).toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'}),
                v:parseFloat(p.value??p._value??0)
              }));
            } catch{}
          }));
        } catch{}
      }));
      setDevices(devs);
      setSelDev(d=>d||devs[0]||null);
      setLastVals(p=>({...p,...nl}));
      setHistory(p=>({...p,...nh}));
      setLastSync(new Date());
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  },[token]);

  useEffect(()=>{fetchAll();timer.current=setInterval(fetchAll,30000);return()=>clearInterval(timer.current);},[]);

  const activeDev   = selDev||devices[0];
  const capteurs    = activeDev?.capteurs||[];
  const onlineDevs  = devices.filter(d=>d.statut==='online').length;
  const allCapteurs = devices.flatMap(d=>d.capteurs||[]);
  const selCapMeta  = selCap?(SENSOR_META[selCap.type_mesure]||{color:S.blue,unit:'',label:selCap.type_mesure}):null;

  if(loading) return (
    <div style={{minHeight:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:S.bg,color:S.muted,fontFamily:'Inter,sans-serif'}}>
      <RefreshCw size={22} style={{animation:'spin 1s linear infinite',color:S.blue}}/>
    </div>
  );

  return (
    <div style={{background:S.bg,minHeight:'100%',color:S.text,fontFamily:'Inter,system-ui,sans-serif',padding:'20px 24px',overflowY:'auto'}}>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <LayoutDashboard size={18} color={S.blue}/>
          <h1 style={{margin:0,fontSize:18,fontWeight:700}}>Vue d ensemble</h1>
          {lastSync&&<span style={{fontSize:11,color:S.muted,display:'flex',alignItems:'center',gap:4}}><Clock size={11}/>{lastSync.toLocaleTimeString('fr')}</span>}
        </div>
        <button onClick={fetchAll} style={{background:S.panel,border:`1px solid ${S.border}`,color:S.text,padding:'7px 14px',borderRadius:8,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',gap:6}}>
          <RefreshCw size={13}/> Actualiser
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[
          {label:'Appareils',       value:`${onlineDevs}/${devices.length}`, icon:Wifi,  color:S.blue,  sub:`${devices.length-onlineDevs} hors ligne`},
          {label:'Alertes actives', value:alertes.length,                    icon:Bell,  color:alertes.length?S.red:S.green, sub:alertes.length?'Attention requise':'Tout nominal'},
          {label:'Capteurs',        value:allCapteurs.length,                icon:Activity,color:'#a78bfa',sub:`${devices.length} appareils`},
          {label:'Statut reseau',   value:onlineDevs>0?'OK':'ALERTE',        icon:Radio, color:onlineDevs>0?S.green:S.red, sub:'LoRaWAN'},
        ].map(k=>(
          <div key={k.label} style={{background:S.panel,border:`1px solid ${S.border}`,borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:38,height:38,borderRadius:10,background:k.color+'22',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <k.icon size={17} color={k.color}/>
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:k.color,lineHeight:1}}>{k.value}</div>
              <div style={{fontSize:11,color:S.muted,marginTop:2}}>{k.label}</div>
              <div style={{fontSize:10,color:S.muted,opacity:0.7}}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'210px 1fr',gap:16}}>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:S.panel,border:`1px solid ${S.border}`,borderRadius:12,overflow:'hidden'}}>
            <div style={{padding:'9px 14px',borderBottom:`1px solid ${S.border}`,fontSize:10,fontWeight:700,color:S.muted,textTransform:'uppercase',letterSpacing:'1px',display:'flex',alignItems:'center',gap:6}}>
              <Cpu size={10}/> Appareils
            </div>
            {devices.map(dev=>(
              <div key={dev.id} onClick={()=>{setSelDev(dev);setSelCap(null);}} style={{padding:'10px 14px',cursor:'pointer',background:activeDev?.id===dev.id?S.blue+'15':'transparent',borderLeft:`3px solid ${activeDev?.id===dev.id?S.blue:'transparent'}`,borderBottom:`1px solid ${S.border}`,transition:'all 0.15s'}}>
                <div style={{display:'flex',alignItems:'center',gap:7}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:dev.statut==='online'?S.green:S.red,boxShadow:dev.statut==='online'?`0 0 6px ${S.green}`:'none',flexShrink:0}}/>
                  <span style={{fontSize:12,fontWeight:500,color:S.text}}>{dev.nom}</span>
                </div>
                <div style={{fontSize:10,color:S.muted,marginTop:2,paddingLeft:14}}>{dev.device_uid}{dev.battery_level!=null?` · ${dev.battery_level}%`:''}</div>
              </div>
            ))}
          </div>
          {alertes.length>0&&(
            <div style={{background:S.panel,border:`1px solid ${S.red}44`,borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'9px 14px',borderBottom:`1px solid ${S.red}33`,fontSize:10,fontWeight:700,color:S.red,textTransform:'uppercase',letterSpacing:'1px',display:'flex',alignItems:'center',gap:6}}>
                <AlertTriangle size={10}/> Alertes
              </div>
              {alertes.map(a=>(
                <div key={a.id} style={{padding:'8px 14px',borderBottom:`1px solid ${S.border}`}}>
                  <div style={{fontSize:11,color:S.red,fontWeight:600}}>{a.type_alerte}</div>
                  <div style={{fontSize:10,color:S.muted,marginTop:2}}>{(a.message||'').slice(0,44)}...</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {activeDev&&(
            <div style={{background:S.panel,border:`1px solid ${S.border}`,borderRadius:12,padding:'12px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:activeDev.statut==='online'?S.green:S.red,boxShadow:activeDev.statut==='online'?`0 0 8px ${S.green}`:'none'}}/>
                <div>
                  <div style={{fontWeight:700,fontSize:15}}>{activeDev.nom}</div>
                  <div style={{color:S.muted,fontSize:11}}>{activeDev.device_uid} · {activeDev.type_device}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:12,alignItems:'center'}}>
                {activeDev.battery_level!=null&&<span style={{fontSize:12,color:activeDev.battery_level>50?S.green:activeDev.battery_level>20?S.yellow:S.red,display:'flex',alignItems:'center',gap:4}}><Battery size={13}/>{activeDev.battery_level}%</span>}
                {activeDev.lora_rssi&&<span style={{fontSize:11,color:S.muted}}>RSSI {activeDev.lora_rssi} dBm</span>}
                <span style={{padding:'3px 10px',borderRadius:6,fontSize:11,fontWeight:600,background:activeDev.statut==='online'?S.green+'22':S.red+'22',color:activeDev.statut==='online'?S.green:S.red}}>{activeDev.statut?.toUpperCase()}</span>
              </div>
            </div>
          )}

          {capteurs.length>0?(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(165px,1fr))',gap:12}}>
              {capteurs.map(cap=>(
                <SensorWidget key={cap.id} cap={cap} value={lastVals[cap.id]} history={history[cap.id]} selected={selCap?.id===cap.id} onClick={()=>setSelCap(selCap?.id===cap.id?null:cap)}/>
              ))}
            </div>
          ):(
            <div style={{background:S.panel,border:`1px solid ${S.border}`,borderRadius:12,padding:40,textAlign:'center',color:S.muted}}>
              <Activity size={28} style={{marginBottom:10,opacity:0.3}}/><div>Aucun capteur pour cet appareil</div>
            </div>
          )}

          {selCap&&history[selCap.id]?.length>1&&(
            <div style={{background:S.panel,border:`1px solid ${selCapMeta.color}44`,borderRadius:12,padding:'16px 20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:600,color:selCapMeta.color}}>Historique — {selCapMeta.label} (6h)</div>
                <button onClick={()=>setSelCap(null)} style={{background:'none',border:'none',color:S.muted,cursor:'pointer',fontSize:16}}>x</button>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={history[selCap.id]}>
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={selCapMeta.color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={selCapMeta.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#30363d" strokeDasharray="3 3"/>
                  <XAxis dataKey="t" tick={{fill:S.muted,fontSize:9}}/>
                  <YAxis tick={{fill:S.muted,fontSize:9}}/>
                  <Tooltip contentStyle={{background:S.card,border:`1px solid ${selCapMeta.color}44`,borderRadius:8,fontSize:11}}/>
                  <Area type="monotone" dataKey="v" stroke={selCapMeta.color} strokeWidth={2} fill="url(#cg)" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}
