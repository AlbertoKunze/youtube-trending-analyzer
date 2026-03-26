import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

const REGIONS = [
  { code: "BR", label: "Brasil" },
  { code: "US", label: "EUA" },
  { code: "GB", label: "Reino Unido" },
  { code: "JP", label: "Japao" },
  { code: "KR", label: "Coreia do Sul" },
];
const COLORS = ["#FF0000","#FF6B35","#FFD700","#4CAF50","#2196F3","#9C27B0","#E91E63","#00BCD4","#FF5722","#607D8B"];
const fmt = n => { if (!n && n !== 0) return "N/A"; n = parseInt(n); if (isNaN(n)) return "N/A"; if (n >= 1e9) return (n/1e9).toFixed(1)+"B"; if (n >= 1e6) return (n/1e6).toFixed(1)+"M"; if (n >= 1e3) return (n/1e3).toFixed(0)+"K"; return n.toString(); };

export default function App() {
  const [region, setRegion] = useState("BR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("ranking");

  const fetchTrending = async (reg) => {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch("/api/trending?region=" + reg);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      if (!json.videos) throw new Error("Sem dados");
      const byCat = {};
      json.videos.forEach(v => { const c = v.category||"Other"; if (!byCat[c]) byCat[c]=[]; byCat[c].push(v); });
      setData({ videos: json.videos, byCat });
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const catSummary = data ? Object.entries(data.byCat).map(([name,vids],i) => ({ name, videos: vids.length, totalViews: vids.reduce((s,v)=>s+(parseInt(v.views)||0),0), fill: COLORS[i%COLORS.length] })).sort((a,b)=>b.totalViews-a.totalViews) : [];
  const top10 = data ? data.videos.slice(0,10).map(v => ({ name: v.title?.length>22?v.title.slice(0,22)+"...":v.title, views: parseInt(v.views)||0 })) : [];
  const tabs = ["ranking","categorias","graficos"];

  return (
    <div style={{fontFamily:"system-ui",background:"#0f0f0f",minHeight:"100vh",color:"#fff"}}>
      <div style={{background:"#ff0000",padding:"16px 24px",display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:28}}>▶</span>
        <div><div style={{fontWeight:700,fontSize:18}}>YouTube Trending Analyzer</div><div style={{fontSize:12,opacity:0.85}}>Videos mais vistos por categoria</div></div>
      </div>
      <div style={{padding:"20px 24px"}}>
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          {REGIONS.map(r=>(
            <button key={r.code} onClick={()=>{setRegion(r.code);fetchTrending(r.code);}} disabled={loading}
              style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:loading?"not-allowed":"pointer",background:region===r.code?"#ff0000":"#2a2a2a",color:"#fff",fontWeight:region===r.code?700:400,opacity:loading?0.6:1}}>
              {r.label}
            </button>
          ))}
        </div>
        {!data&&!loading&&!error&&<div style={{textAlign:"center",padding:60,color:"#aaa"}}><div style={{fontSize:48,marginBottom:16}}>▶</div><div>Selecione uma regiao para comecar</div></div>}
        {loading&&<div style={{textAlign:"center",padding:60,color:"#aaa"}}>Buscando trending...</div>}
        {error&&<div style={{background:"#2a0000",border:"1px solid #ff4444",borderRadius:10,padding:16,color:"#ff8888"}}>Erro: {error}</div>}
        {data&&!loading&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
              {[{label:"Videos",value:data.videos.length},{label:"Categorias",value:Object.keys(data.byCat).length},{label:"Top views",value:fmt(data.videos[0]?.views)}].map(s=>(
                <div key={s.label} style={{background:"#1a1a1a",borderRadius:10,padding:"14px 16px",textAlign:"center",border:"1px solid #2a2a2a"}}>
                  <div style={{fontSize:22,fontWeight:700,color:"#ff4444"}}>{s.value}</div>
                  <div style={{fontSize:12,color:"#888",marginTop:4}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:4,marginBottom:20,background:"#1a1a1a",borderRadius:10,padding:4}}>
              {tabs.map(t=><button key={t} onClick={()=>setActiveTab(t)} style={{flex:1,padding:"10px",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,background:activeTab===t?"#ff0000":"transparent",color:"#fff"}}>{t}</button>)}
            </div>
            {activeTab==="ranking"&&data.videos.slice(0,20).map((v,i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:"1px solid #1f1f1f"}}>
                <div style={{width:32,textAlign:"center",fontWeight:700,color:i<3?["#FFD700","#C0C0C0","#CD7F32"][i]:"#666"}}>#{i+1}</div>
                {v.thumb&&<img src={v.thumb} alt="" style={{width:56,height:42,borderRadius:4,objectFit:"cover"}}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.title}</div>
                  <div style={{fontSize:11,color:"#888"}}>{v.channel} · {v.category}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}><div style={{fontWeight:700,color:"#ff4444"}}>{fmt(v.views)}</div><div style={{fontSize:11,color:"#666"}}>👍 {fmt(v.likes)}</div></div>
              </div>
            ))}
            {activeTab==="categorias"&&catSummary.map((cat,i)=>(
              <div key={cat.name} style={{background:"#1a1a1a",borderRadius:10,marginBottom:12,overflow:"hidden",border:"1px solid #2a2a2a"}}>
                <div style={{padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderLeft:"4px solid "+cat.fill}}>
                  <div><span style={{fontWeight:700}}>{cat.name}</span><span style={{marginLeft:10,fontSize:12,color:"#888"}}>{cat.videos} videos</span></div>
                  <div style={{fontWeight:700,color:cat.fill}}>{fmt(cat.totalViews)} views</div>
                </div>
                {(data.byCat[cat.name]||[]).slice(0,3).map((v,j)=>(
                  <div key={j} style={{padding:"8px 16px 8px 20px",display:"flex",justifyContent:"space-between",borderTop:"1px solid #222",fontSize:12}}>
                    <span style={{color:"#ccc",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%"}}><span style={{color:"#666",marginRight:8}}>#{j+1}</span>{v.title}</span>
                    <span style={{color:"#ff4444",flexShrink:0}}>{fmt(v.views)}</span>
                  </div>
                ))}
              </div>
            ))}
            {activeTab==="graficos"&&(
              <div style={{display:"flex",flexDirection:"column",gap:24}}>
                <div style={{background:"#1a1a1a",borderRadius:10,padding:16,border:"1px solid #2a2a2a"}}>
                  <div style={{fontWeight:600,marginBottom:12}}>Top 10 — Views</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={top10} layout="vertical">
                      <XAxis type="number" tickFormatter={fmt} tick={{fill:"#888",fontSize:11}}/>
                      <YAxis type="category" dataKey="name" width={140} tick={{fill:"#ccc",fontSize:10}}/>
                      <Tooltip formatter={v=>fmt(v)} contentStyle={{background:"#222",border:"none"}}/>
                      <Bar dataKey="views" fill="#ff0000" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{background:"#1a1a1a",borderRadius:10,padding:16,border:"1px solid #2a2a2a"}}>
                  <div style={{fontWeight:600,marginBottom:12}}>Views por Categoria</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={catSummary.slice(0,8)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a"/>
                      <XAxis dataKey="name" tick={{fill:"#888",fontSize:10}} tickFormatter={s=>s.slice(0,10)}/>
                      <YAxis tickFormatter={fmt} tick={{fill:"#888",fontSize:11}}/>
                      <Tooltip formatter={v=>fmt(v)} contentStyle={{background:"#222",border:"none"}}/>
                      <Bar dataKey="totalViews" radius={[4,4,0,0]}>
                        {catSummary.slice(0,8).map((c,i)=><Cell key={i} fill={c.fill}/>)}
                      </Bar>
                    </BarChart>
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
