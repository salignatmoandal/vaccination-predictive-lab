import './App.css'
import MapHeatmap, { sampleData } from "./map/heatmap";
import { useState } from "react";

export default function App() {
  const [stockValue, setStockValue] = useState<number | "">("");
  const [confirmed, setConfirmed] = useState(false);
  const [weeks, setWeeks] = useState(0);

  return (
    <div className="vitrine">
      <h1>Hackathon 2025 Epitech</h1>
      <h2>Carte de chaleur des cas de grippes</h2>

      {/* Carte centrée + panneau à gauche en overlay */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute', left: 16, top: 16,
            width: 300, textAlign: 'left',
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid #e5e7eb', borderRadius: 12,
            padding: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(2px)',
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="stock-input" style={{ fontWeight: 600 }}>Stock (nombre)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="stock-input"
                type="number"
                min={0}
                step={1}
                value={stockValue}
                onChange={(e) => {
                  const v = e.target.value;
                  setConfirmed(false);
                  if (v === "") return setStockValue("");
                  const n = Number(v);
                  if (Number.isNaN(n)) return;
                  setStockValue(Math.max(0, Math.floor(n)));
                }}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
              />
              <button
                onClick={() => setConfirmed(true)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer' }}
              >
                Confirmer
              </button>
            </div>
            {confirmed && (
              <div style={{ marginTop: 8, color: '#1a7f37' }}>
                Nous estimons que vous avez assez de stock pour les 3 prochaines semaines
              </div>
            )}
          </div>
        </div>

        <div style={{ width: '100%', height: '70vh', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          <MapHeatmap data={sampleData} />
        </div>

        {/* Légende des intensités (cas de grippe/100k/semaine) */}
        <div
          style={{
            position: 'absolute', right: 16, bottom: 16, zIndex: 10,
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid #e5e7eb', borderRadius: 12,
            padding: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Légende</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: 'green', display: 'inline-block' }} />
              <span>Faible &lt; 50 cas/100k</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: 'yellow', display: 'inline-block', border: '1px solid #e5e7eb' }} />
              <span>Modéré 50–100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: '#e75151', display: 'inline-block' }} />
              <span>Élevé 100–200</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: '#b91f1f', display: 'inline-block' }} />
              <span>Très élevé 200–300</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: '#700f0f', display: 'inline-block' }} />
              <span>Critique &gt; 300</span>
            </div>
          </div>
        </div>
      </div>

      {/* Curseur temporel en dessous de la carte */}
      <div style={{ marginTop: 16, textAlign: 'left' }}>
        <label htmlFor="weeks-range" style={{ display: 'block', marginBottom: 8 }}>
          Horizon temporel: {weeks} semaine{weeks > 1 ? 's' : ''} / 8
        </label>
        <input
          id="weeks-range"
          type="range"
          min={0}
          max={8}
          step={1}
          value={weeks}
          onChange={(e) => setWeeks(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}
