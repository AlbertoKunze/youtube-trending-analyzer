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
const DEFAULT_COLOR = "#888";

const fmt = n => { if (!n && n !== 0) return "0"; n = parseInt(n); if (isNaN(n)) return "0"; if (n >= 1e9) return (n/1e9).toFixed(1)+"B"; if (n >= 1e6) return (n/1e6).toFixed(1)+"M"; if (n >= 1e3) return (n/1e3).toFixed(0)+"K"; return n.toString(); };

export default function App() {
  const [region, setRegion] = useState("BR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("categorias");
  const [selectedCat, setSelectedCat] = useState(null);

  const fetchTrending = async (reg) => {
    setLoading(true); setError(""); setData(null); setSelectedCat(null);
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
      setData({ videos: json.videos, byCat, fetchedAt: json.fetchedAt });
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const catSummary = data ? Object.entries(data.byCat)
    .map(([name, vids]) => ({ name, count: vids.length, totalViews: vids.reduce((s,v)=>s+(v.views||0),0), color: CAT_COLORS[name]||DEFAULT_COLOR }))
    .sort((a,b) => b.totalViews - a.totalViews) : [];

  const displayVideos = selectedCat ? (data?.byCat[selectedCat] || []) : (data?.videos || []);

  return (
    <div style={{fontFamily:"system-ui,sans-serif",background:"#0a0a0a",minHeight:"100vh",color:"#fff"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1a0a0a,#2d0000)",borderBottom:"2px solid #ff0000",padding:"16px 24px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{fontSize:32}}>🎵</div>
        <div>
          <div style={{fontWeight:800,fontSize:20,letterSpacing:"-0.5px"}}>Music Trending Analyzer</div>
          <div style={{fontSize:12,color:"#ff8888"}}>Musicas mais tocadas por genero</div>
        </div>
      </div>

      <div style={{padding:"20px 24px"}}>
        {/* Region selector */}
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{color:"#666",fontSize:12}}>Regiao:</span>
          {REGIONS.map(r=>(
            <button key={r.code} onClick={()=>{setRegion(r.code);fetchTrending(r.code);}} disabled={loading}
              style={{padding:"7px 16px",borderRadius:20,border:"none",cursor:loading?"not-allowed":"pointer",
                background:region===r.code?"#ff0000":"#1e1e1e",color:"#fff",fontWeight:region===r.code?700:400,
                fontSize:13,opacity:loading?0.5:1,transition:"all 0.2s"}}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Initial */}
        {!data&&!loading&&!error&&(
          <div style={{textAlign:"center",padding:"80px 0",color:"#444"}}>
            <div style={{fontSize:64,marginBottom:16}}>🎵</div>
            <div style={{fontSize:18,color:"#666"}}>Selecione uma regiao para ver as musicas em trending</div>
          </div>
        )}

        {loading&&(
          <div style={{textAlign:"center",padding:"80px 0",color:"#aaa"}}>
            <div style={{fontSize:48,marginBottom:16,animation:"pulse 1s infinite"}}>🎵</div>
            <div>Buscando musicas em alta...</div>
          </div>
        )}

        {error&&<div style={{background:"#1a0000",border:"1px solid #ff4444",borderRadius:10,padding:16,color:"#ff8888"}}>❌ {error}</div>}

        {data&&!loading&&(
          <>
            {/* Stats bar */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
              {[
                {label:"Musicas",value:data.videos.length,icon:"🎵"},
                {label:"Generos",value:Object.keys(data.byCat).length,icon:"🎸"},
                {label:"Top views",value:fmt(data.videos[0]?.views),icon:"👁"},
              ].map(s=>(
                <div key={s.label} style={{background:"#111",borderRadius:12,padding:"16px",textAlign:"center",border:"1px solid #222"}}>
                  <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
                  <div style={{fontSize:22,fontWeight:800,color:"#ff4444"}}>{s.value}</div>
                  <div style={{fontSize:11,color:"#666",marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{display:"flex",gap:4,marginBottom:20,background:"#111",borderRadius:10,padding:4}}>
              {[["categorias","🎸 Por Genero"],["ranking","🏆 Ranking Geral"],["graficos","📊 Graficos"]].map(([id,label])=>(
                <button key={id} onClick={()=>{setActiveTab(id);setSelectedCat(null);}}
                  style={{flex:1,padding:"10px",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,
                    background:activeTab===id?"#ff0000":"transparent",color:"#fff"}}>
                  {label}
                </button>
              ))}
            </div>

            {/* TAB: Por Genero */}
            {activeTab==="categorias"&&(
              <div>
                {!selectedCat?(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
                    {catSummary.map(cat=>(
                      <div key={cat.name} onClick={()=>setSelectedCat(cat.name)}
                        style={{background:"#111",borderRadius:12,overflow:"hidden",border:"1px solid #222",cursor:"pointer",transition:"transform 0.2s",borderLeft:"4px solid "+cat.color}}>
                        <div style={{padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontWeight:700,fontSize:15,color:cat.color}}>{cat.name}</div>
                            <div style={{fontSize:12,color:"#666",marginTop:2}}>{cat.count} musicas · {fmt(cat.totalViews)} views totais</div>
                          </div>
                          <div style={{fontSize:20}}>→</div>
                        </div>
                        {(data.byCat[cat.name]||[]).slice(0,3).map((v,j)=>(
                          <div key={j} style={{padding:"8px 16px",display:"flex",gap:10,alignItems:"center",borderTop:"1px solid #1a1a1a"}}>
                            {v.thumb&&<img src={v.thumb} alt="" style={{width:48,height:36,borderRadius:4,objectFit:"cover",flexShrink:0}}/>}
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.title}</div>
                              <div style={{fontSize:10,color:"#666"}}>{v.channel}</div>
                            </div>
                            <div style={{fontSize:12,color:cat.color,fontWeight:700,flexShrink:0}}>{fmt(v.views)}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ):(
                  <div>
                    <button onClick={()=>setSelectedCat(null)}
                      style={{background:"#1e1e1e",border:"none",color:"#aaa",padding:"8px 16px",borderRadius:8,cursor:"pointer",marginBottom:16,fontSize:13}}>
                      ← Voltar para generos
                    </button>
                    <div style={{fontWeight:700,fontSize:20,color:CAT_COLORS[selectedCat]||"#fff",marginBottom:16}}>
                      🎵 {selectedCat} — {data.byCat[selectedCat]?.length} musicas
                    </div>
                    {(data.byCat[selectedCat]||[]).map((v,i)=>(
                      <div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 0",borderBottom:"1px solid #1a1a1a"}}>
                        <div style={{width:28,textAlign:"center",fontWeight:700,fontSize:15,color:i<3?["#FFD700","#C0C0C0","#CD7F32"][i]:"#555"}}>#{i+1}</div>
                        {v.thumb&&<img src={v.thumb} alt="" style={{width:64,height:48,borderRadius:6,objectFit:"cover"}}/>}
                        <div style={{flex:1,minWidth:0}}>
                          <a href={"https://youtube.com/watch?v="+v.id} target="_blank" rel="noreferrer"
                            style={{fontWeight:600,fontSize:14,color:"#fff",textDecoration:"none",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"block"}}>
                            {v.title}
                          </a>
                          <div style={{fontSize:12,color:"#666",marginTop:2}}>{v.channel} · {v.published}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontWeight:800,color:CAT_COLORS[selectedCat]||"#ff4444",fontSize:15}}>{fmt(v.views)}</div>
                          <div style={{fontSize:11,color:"#555"}}>👍 {fmt(v.likes)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Ranking */}
            {activeTab==="ranking"&&data.videos.slice(0,30).map((v,i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:"1px solid #1a1a1a"}}>
                <div style={{width:28,textAlign:"center",fontWeight:700,color:i<3?["#FFD700","#C0C0C0","#CD7F32"][i]:"#444"}}>#{i+1}</div>
                {v.thumb&&<img src={v.thumb} alt="" style={{width:56,height:42,borderRadius:4,objectFit:"cover"}}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.title}</div>
                  <div style={{fontSize:11,marginTop:2}}>
                    <span style={{color:"#666"}}>{v.channel} · </span>
                    <span style={{color:CAT_COLORS[v.category]||"#888",fontWeight:600}}>{v.category}</span>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontWeight:800,color:"#ff4444",fontSize:14}}>{fmt(v.views)}</div>
                  <div style={{fontSize:11,color:"#555"}}>👍 {fmt(v.likes)}</div>
                </div>
              </div>
            ))}

            {/* TAB: Graficos */}
            {activeTab==="graficos"&&(
              <div style={{display:"flex",flexDirection:"column",gap:24}}>
                <div style={{background:"#111",borderRadius:12,padding:20,border:"1px solid #1e1e1e"}}>
                  <div style={{fontWeight:700,marginBottom:16,fontSize:15}}>Views totais por genero</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={catSummary} layout="vertical" margin={{left:10}}>
                      <XAxis type="number" tickFormatter={fmt} tick={{fill:"#555",fontSize:11}}/>
                      <YAxis type="category" dataKey="name" width={130} tick={{fill:"#aaa",fontSize:11}}/>
                      <Tooltip formatter={v=>fmt(v)} contentStyle={{background:"#1a1a1a",border:"none",borderRadius:8}}/>
                      <Bar dataKey="totalViews" radius={[0,6,6,0]}>
                        {catSummary.map((c,i)=><Cell key={i} fill={c.color}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{background:"#111",borderRadius:12,padding:20,border:"1px solid #1e1e1e"}}>
                  <div style={{fontWeight:700,marginBottom:16,fontSize:15}}>Distribuicao de musicas por genero</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={catSummary} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                        label={({name,percent})=>percent>0.05?name+" "+Math.round(percent*100)+"%":""} labelLine={false} style={{fontSize:11}}>
                        {catSummary.map((c,i)=><Cell key={i} fill={c.color}/>)}
                      </Pie>
                      <Tooltip contentStyle={{background:"#1a1a1a",border:"none",borderRadius:8}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
            }
