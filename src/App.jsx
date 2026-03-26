import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

const REGIONS = [
  { code: "BR", label: "🇧🇷 Brasil" },
  { code: "US", label: "🇺🇸 EUA" },
  { code: "GB", label: "🇬🇧 Reino Unido" },
  { code: "JP", label: "🇯🇵 Japao" },
  { code: "KR", label: "🇰🇷 Coreia do Sul" },
];

const CAT_COLORS = {
  "Funk": "#FF6B35",
  "Sertanejo": "#FFD700",
  "Pagode / Samba": "#4CAF50",
  "Rap / Trap": "#9C27B0",
  "Gospel": "#2196F3",
  "Forro / Axe": "#FF5722",
  "Pop": "#E91E63",
  "Rock": "#607D8B",
  "Eletronica": "#00BCD4",
  "K-Pop": "#FF4081",
  "Reggaeton / Latin": "#FF9800",
  "R&B / Soul": "#795548",
};

const fmt = n => {
  if (!n && n !== 0) return "0";
  n = parseInt(n);
  if (isNaN(n)) return "0";
  if (n >= 1e9) return (n/1e9).toFixed(1)+"B";
  if (n >= 1e6) return (n/1e6).toFixed(1)+"M";
  if (n >= 1e3) return (n/1e3).toFixed(0)+"K";
  return n.toString();
};

export default function App() {
  const [region, setRegion] = useState("BR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [activeGenre, setActiveGenre] = useState("todos");

  const fetchTrending = async (reg) => {
    setLoading(true); setError(""); setData(null); setActiveGenre("todos");
    try {
      const res = await fetch("/api/trending?region=" + reg);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      if (!json.videos?.length) throw new Error("Nenhum video encontrado");
      const byCat = {};
      json.videos.forEach(v => {
        if (!byCat[v.category]) byCat[v.category] = [];
        byCat[v.category].push(v);
      });
      Object.values(byCat).forEach(arr => arr.sort((a,b) => b.views - a.views));
      setData({ videos: json.videos, byCat });
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const genres = data ? ["todos", ...Object.keys(data.byCat).sort((a,b) => (data.byCat[b].length - data.byCat[a].length))] : [];
  const displayVideos = data ? (activeGenre === "todos" ? data.videos : (data.byCat[activeGenre] || [])) : [];
  const activeColor = activeGenre === "todos" ? "#ff0000" : (CAT_COLORS[activeGenre] || "#888");

  const catSummary = data ? Object.entries(data.byCat)
    .map(([name, vids]) => ({ name, count: vids.length, totalViews: vids.reduce((s,v)=>s+(v.views||0),0), color: CAT_COLORS[name]||"#888" }))
    .sort((a,b) => b.totalViews - a.totalViews) : [];

  return (
    <div style={{fontFamily:"system-ui,sans-serif",background:"#0a0a0a",minHeight:"100vh",color:"#fff"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1a0000,#2d0000)",borderBottom:"2px solid #ff0000",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:28}}>🎵</span>
          <div>
            <div style={{fontWeight:800,fontSize:18}}>Music Trending Analyzer</div>
            <div style={{fontSize:11,color:"#ff8888"}}>Musicas mais tocadas por genero</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {REGIONS.map(r=>(
            <button key={r.code} onClick={()=>{setRegion(r.code);fetchTrending(r.code);}} disabled={loading}
              style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:loading?"not-allowed":"pointer",
                background:region===r.code?"#ff0000":"#2a1a1a",color:"#fff",fontWeight:region===r.code?700:400,
                fontSize:12,opacity:loading?0.5:1}}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Initial state */}
      {!data&&!loading&&!error&&(
        <div style={{textAlign:"center",padding:"100px 0",color:"#333"}}>
          <div style={{fontSize:64,marginBottom:16}}>🎵</div>
          <div style={{fontSize:16,color:"#555"}}>Selecione uma regiao para comecar</div>
        </div>
      )}

      {loading&&(
        <div style={{textAlign:"center",padding:"100px 0",color:"#aaa"}}>
          <div style={{fontSize:48,marginBottom:16}}>⏳</div>
          <div>Buscando musicas em alta...</div>
        </div>
      )}

      {error&&<div style={{margin:24,background:"#1a0000",border:"1px solid #ff4444",borderRadius:10,padding:16,color:"#ff8888"}}>❌ {error}</div>}

      {data&&!loading&&(
        <>
          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,padding:"16px 24px 0"}}>
            {[
              {label:"Musicas",value:data.videos.length,icon:"🎵"},
              {label:"Generos",value:Object.keys(data.byCat).length,icon:"🎸"},
              {label:"Top views",value:fmt(data.videos[0]?.views),icon:"👁"},
            ].map(s=>(
              <div key={s.label} style={{background:"#111",borderRadius:10,padding:"12px",textAlign:"center",border:"1px solid #1e1e1e"}}>
                <div style={{fontSize:18}}>{s.icon}</div>
                <div style={{fontSize:20,fontWeight:800,color:"#ff4444"}}>{s.value}</div>
                <div style={{fontSize:11,color:"#555"}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Genre tabs */}
          <div style={{padding:"16px 24px 0",overflowX:"auto"}}>
            <div style={{display:"flex",gap:6,minWidth:"max-content",borderBottom:"2px solid #1a1a1a",paddingBottom:0}}>
              {genres.map(g => {
                const isActive = activeGenre === g;
                const color = g === "todos" ? "#ff0000" : (CAT_COLORS[g] || "#888");
                const count = g === "todos" ? data.videos.length : (data.byCat[g]?.length || 0);
                return (
                  <button key={g} onClick={()=>setActiveGenre(g)}
                    style={{
                      padding:"10px 16px",border:"none",cursor:"pointer",fontSize:13,fontWeight:isActive?700:500,
                      background:"transparent",color:isActive?color:"#555",
                      borderBottom: isActive ? "3px solid "+color : "3px solid transparent",
                      marginBottom:"-2px",whiteSpace:"nowrap",transition:"all 0.15s",
                      display:"flex",alignItems:"center",gap:6
                    }}>
                    {g === "todos" ? "🎵 Todos" : g}
                    <span style={{
                      background:isActive?color:"#1e1e1e",color:isActive?"#fff":"#555",
                      borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700
                    }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Video list */}
          <div style={{padding:"0 24px 24px"}}>
            {activeGenre !== "todos" && (
              <div style={{padding:"14px 0 10px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:4,height:24,background:activeColor,borderRadius:2}}></div>
                <div style={{fontWeight:700,fontSize:16,color:activeColor}}>{activeGenre}</div>
                <div style={{fontSize:13,color:"#555"}}>{displayVideos.length} musicas</div>
              </div>
            )}
            {activeGenre === "todos" && (
              <div style={{padding:"14px 0 10px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:4,height:24,background:"#ff0000",borderRadius:2}}></div>
                <div style={{fontWeight:700,fontSize:16}}>Todas as musicas em trending</div>
                <div style={{fontSize:13,color:"#555"}}>{displayVideos.length} musicas</div>
              </div>
            )}

            {displayVideos.map((v,i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:"1px solid #141414"}}>
                <div style={{width:28,textAlign:"center",fontWeight:800,fontSize:14,
                  color:i<3?["#FFD700","#C0C0C0","#CD7F32"][i]:"#333",flexShrink:0}}>
                  #{i+1}
                </div>
                {v.thumb&&<img src={v.thumb} alt="" style={{width:80,height:60,borderRadius:6,objectFit:"cover",flexShrink:0}}/>}
                <div style={{flex:1,minWidth:0}}>
                  <a href={"https://youtube.com/watch?v="+v.id} target="_blank" rel="noreferrer"
                    style={{fontWeight:600,fontSize:14,color:"#fff",textDecoration:"none",
                      display:"block",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    {v.title}
                  </a>
                  <div style={{fontSize:12,color:"#555",marginTop:3,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <span>{v.channel}</span>
                    {activeGenre === "todos" && (
                      <span style={{background:CAT_COLORS[v.category]||"#333",color:"#fff",
                        borderRadius:10,padding:"1px 8px",fontSize:10,fontWeight:700}}>
                        {v.category}
                      </span>
                    )}
                    <span style={{color:"#333"}}>· {v.published}</span>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontWeight:800,color:activeColor,fontSize:15}}>{fmt(v.views)}</div>
                  <div style={{fontSize:11,color:"#333",marginTop:2}}>👍 {fmt(v.likes)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
                             }
