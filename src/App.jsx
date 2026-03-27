import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const REGIONS = [
  { code: "BR", label: "Brasil" },
  { code: "US", label: "EUA" },
  { code: "GB", label: "Reino Unido" },
  { code: "JP", label: "Japao" },
  { code: "KR", label: "Coreia do Sul" },
];

const GENRE_CONFIG = {
  "Todos": { color: "#ff0000", emoji: "🎵" },
  "Funk": { color: "#FF6B35", emoji: "🔥" },
  "Sertanejo": { color: "#FFD700", emoji: "🤠" },
  "Pop": { color: "#E91E63", emoji: "⭐" },
  "Rap / Trap": { color: "#9C27B0", emoji: "🎤" },
  "Gospel": { color: "#2196F3", emoji: "✝️" },
  "Pagode / Samba": { color: "#4CAF50", emoji: "🥁" },
  "Forro / Axe": { color: "#FF5722", emoji: "🪗" },
  "K-Pop": { color: "#FF4081", emoji: "🇰🇷" },
  "Rock": { color: "#607D8B", emoji: "🎸" },
  "Eletronica": { color: "#00BCD4", emoji: "🎧" },
  "Reggaeton / Latin": { color: "#FF9800", emoji: "💃" },
  "R&B / Soul": { color: "#795548", emoji: "🎷" },
};

const fmt = n => {
  if (!n) return "0";
  n = parseInt(n);
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
  const [activeGenre, setActiveGenre] = useState("Todos");

  const fetchTrending = async (reg) => {
    setLoading(true); setError(""); setData(null); setActiveGenre("Todos");
    try {
      const res = await fetch("/api/trending?region=" + reg);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      if (!json.videos?.length) throw new Error("Nenhuma musica encontrada");
      const byGenre = {};
      json.videos.forEach(v => {
        if (!byGenre[v.genre]) byGenre[v.genre] = [];
        byGenre[v.genre].push(v);
      });
      setData({ videos: json.videos, byGenre });
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const genreList = data ? ["Todos", ...Object.keys(data.byGenre).sort((a,b) => data.byGenre[b].length - data.byGenre[a].length)] : [];
  const displayVideos = data ? (activeGenre === "Todos" ? data.videos : (data.byGenre[activeGenre] || [])) : [];
  const activeCfg = GENRE_CONFIG[activeGenre] || { color: "#888", emoji: "🎵" };

  const chartData = data ? Object.entries(data.byGenre)
    .map(([name, vids]) => ({ name, views: vids.reduce((s,v)=>s+(v.views||0),0), count: vids.length, color: (GENRE_CONFIG[name]||{}).color||"#888" }))
    .sort((a,b) => b.views - a.views) : [];

  return (
    <div style={{fontFamily:"system-ui,sans-serif",background:"#080808",minHeight:"100vh",color:"#fff"}}>

      {/* HEADER */}
      <div style={{background:"#0f0f0f",borderBottom:"2px solid #ff0000",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:24}}>🎵</span>
          <div>
            <div style={{fontWeight:800,fontSize:17,letterSpacing:"-0.3px"}}>Music Trending</div>
            <div style={{fontSize:10,color:"#666"}}>So musicas • por genero</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {REGIONS.map(r => (
            <button key={r.code} onClick={()=>{setRegion(r.code);fetchTrending(r.code);}} disabled={loading}
              style={{padding:"5px 12px",borderRadius:16,border:"none",cursor:"pointer",fontSize:12,
                background:region===r.code?"#ff0000":"#1a1a1a",color:"#fff",fontWeight:region===r.code?700:400,opacity:loading?0.5:1}}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {!data&&!loading&&!error&&(
        <div style={{textAlign:"center",padding:"120px 0",color:"#333"}}>
          <div style={{fontSize:56,marginBottom:12}}>🎵</div>
          <div style={{color:"#444",fontSize:15}}>Escolha uma regiao para ver as musicas em trending</div>
        </div>
      )}

      {loading&&(
        <div style={{textAlign:"center",padding:"120px 0",color:"#555"}}>
          <div style={{fontSize:48,marginBottom:12}}>⏳</div>
          <div>Carregando musicas...</div>
        </div>
      )}

      {error&&<div style={{margin:20,background:"#1a0000",border:"1px solid #ff4444",borderRadius:10,padding:14,color:"#ff8888"}}>❌ {error}</div>}

      {data&&!loading&&(
        <>
          {/* STATS */}
          <div style={{display:"flex",gap:10,padding:"14px 20px",overflowX:"auto"}}>
            {[
              {icon:"🎵",v:data.videos.length,l:"Musicas"},
              {icon:"🎸",v:Object.keys(data.byGenre).length,l:"Generos"},
              {icon:"👁",v:fmt(data.videos[0]?.views),l:"Top views"},
            ].map(s=>(
              <div key={s.l} style={{background:"#111",borderRadius:10,padding:"12px 16px",textAlign:"center",minWidth:90,border:"1px solid #1a1a1a",flex:1}}>
                <div>{s.icon}</div>
                <div style={{fontSize:20,fontWeight:800,color:"#ff4444"}}>{s.v}</div>
                <div style={{fontSize:10,color:"#555"}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* GENRE TABS */}
          <div style={{borderBottom:"1px solid #1a1a1a",overflowX:"auto",whiteSpace:"nowrap"}}>
            <div style={{display:"inline-flex",padding:"0 20px",gap:2}}>
              {genreList.map(g => {
                const cfg = GENRE_CONFIG[g] || { color:"#888", emoji:"🎵" };
                const isActive = activeGenre === g;
                const count = g === "Todos" ? data.videos.length : (data.byGenre[g]?.length || 0);
                return (
                  <button key={g} onClick={()=>setActiveGenre(g)}
                    style={{
                      padding:"10px 14px",border:"none",cursor:"pointer",fontSize:13,
                      background:"transparent",color:isActive?cfg.color:"#444",fontWeight:isActive?700:400,
                      borderBottom:isActive?"3px solid "+cfg.color:"3px solid transparent",
                      transition:"all 0.15s",display:"inline-flex",alignItems:"center",gap:5
                    }}>
                    <span>{cfg.emoji}</span>
                    <span>{g}</span>
                    <span style={{
                      background:isActive?cfg.color+"22":"#1a1a1a",
                      color:isActive?cfg.color:"#444",
                      borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:700
                    }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* GENRE HEADER */}
          <div style={{padding:"12px 20px 0",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:3,height:20,background:activeCfg.color,borderRadius:2}}></div>
            <span style={{fontWeight:700,color:activeCfg.color,fontSize:15}}>{activeCfg.emoji} {activeGenre}</span>
            <span style={{fontSize:12,color:"#444"}}>— {displayVideos.length} musicas</span>
            {activeGenre !== "Todos" && (
              <span style={{fontSize:11,color:"#333",marginLeft:"auto"}}>
                {fmt(displayVideos.reduce((s,v)=>s+(v.views||0),0))} views totais
              </span>
            )}
          </div>

          {/* VIDEO LIST */}
          <div style={{padding:"8px 20px 40px"}}>
            {displayVideos.map((v,i) => {
              const cfg = GENRE_CONFIG[v.genre] || { color:"#888", emoji:"🎵" };
              return (
                <div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:"1px solid #111"}}>
                  <div style={{width:26,textAlign:"center",fontWeight:800,fontSize:13,flexShrink:0,
                    color:i<3?["#FFD700","#C0C0C0","#CD7F32"][i]:"#2a2a2a"}}>
                    {i+1}
                  </div>
                  {v.thumb&&<img src={v.thumb} alt="" style={{width:80,height:60,borderRadius:6,objectFit:"cover",flexShrink:0}}/>}
                  <div style={{flex:1,minWidth:0}}>
                    <a href={"https://youtube.com/watch?v="+v.id} target="_blank" rel="noreferrer"
                      style={{fontWeight:600,fontSize:14,color:"#fff",textDecoration:"none",
                        display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {v.title}
                    </a>
                    <div style={{fontSize:11,color:"#444",marginTop:3,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <span>{v.channel}</span>
                      {activeGenre === "Todos" && (
                        <span style={{background:cfg.color+"22",color:cfg.color,borderRadius:8,padding:"1px 7px",fontSize:10,fontWeight:700}}>
                          {cfg.emoji} {v.genre}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontWeight:800,color:activeCfg.color,fontSize:14}}>{fmt(v.views)}</div>
                    <div style={{fontSize:10,color:"#333",marginTop:2}}>👍 {fmt(v.likes)}</div>
                  </div>
                </div>
              );
            })}

            {/* CHART no final da aba Todos */}
            {activeGenre === "Todos" && chartData.length > 0 && (
              <div style={{marginTop:32,background:"#0f0f0f",borderRadius:12,padding:20,border:"1px solid #1a1a1a"}}>
                <div style={{fontWeight:700,marginBottom:16,fontSize:14}}>📊 Views por Genero</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} layout="vertical" margin={{left:10}}>
                    <XAxis type="number" tickFormatter={fmt} tick={{fill:"#444",fontSize:10}}/>
                    <YAxis type="category" dataKey="name" width={120} tick={{fill:"#888",fontSize:11}}/>
                    <Tooltip formatter={v=>fmt(v)} contentStyle={{background:"#1a1a1a",border:"none",borderRadius:8}}/>
                    <Bar dataKey="views" radius={[0,6,6,0]}>
                      {chartData.map((c,i)=><Cell key={i} fill={c.color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
                           }
