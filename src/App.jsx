import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const REGIONS = [
  { code: "BR", label: "Brasil" },
  { code: "US", label: "EUA" },
  { code: "GB", label: "Reino Unido" },
];
const COLORS = ["#FF0000","#FF6B35","#FFD700","#4CAF50","#2196F3"];
const fmt = n => { if (!n) return "N/A"; n = parseInt(n); if (n >= 1e6) return (n/1e6).toFixed(1)+"M"; if (n >= 1e3) return (n/1e3).toFixed(0)+"K"; return n.toString(); };

export default function App() {
  const [region, setRegion] = useState("BR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const fetchTrending = async (reg) => {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: "Return ONLY valid JSON no markdown. Schema: {videos:[{rank,title,channel,category,views,likes}]}. 20 videos min.",
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: "Top 20 trending YouTube videos in " + reg + " now. Return JSON only." }]
        })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      const textBlock = json.content?.find(b => b.type === "text");
      if (!textBlock) throw new Error("No response");
      let raw = textBlock.text.trim().replace(/```[a-z]*/g,"").replace(/```/g,"").trim();
      const parsed = JSON.parse(raw);
      setData(parsed);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{fontFamily:"system-ui",background:"#0f0f0f",minHeight:"100vh",color:"#fff"}}>
      <div style={{background:"#ff0000",padding:"16px 24px"}}>
        <div style={{fontWeight:700,fontSize:18}}>YouTube Trending Analyzer</div>
      </div>
      <div style={{padding:"20px 24px"}}>
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {REGIONS.map(r=>(
            <button key={r.code} onClick={()=>{setRegion(r.code);fetchTrending(r.code);}}
              style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",background:region===r.code?"#ff0000":"#2a2a2a",color:"#fff"}}>
              {r.label}
            </button>
          ))}
        </div>
        {loading && <div style={{color:"#aaa",textAlign:"center",padding:40}}>Buscando...</div>}
        {error && <div style={{color:"#ff8888",padding:16}}>{error}</div>}
        {data?.videos && data.videos.slice(0,15).map((v,i)=>(
          <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid #222"}}>
            <div style={{width:30,color:"#666",fontWeight:700}}>#{i+1}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600}}>{v.title}</div>
              <div style={{fontSize:11,color:"#888"}}>{v.channel} - {v.category}</div>
            </div>
            <div style={{color:"#ff4444",fontWeight:700}}>{fmt(v.views)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
