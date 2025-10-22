// src/MapHeatmap.tsx
import { useEffect, useRef } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import type { FeatureCollection, Point } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
if (!mapboxgl.accessToken) console.error("Missing VITE_MAPBOX_TOKEN");

type Props = { data: FeatureCollection<Point, { weight?: number }> };

export default function MapHeatmap({ data }: Props) {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initedRef = useRef(false); // évite double init et timing

  // Init carte une seule fois quand le conteneur a une taille > 0
  useEffect(() => {
    if (!containerRef.current || initedRef.current) return;

    const startIfReady = () => {
      const el = containerRef.current!;
      if (el.offsetWidth === 0 || el.offsetHeight === 0) return false;

      const map = new mapboxgl.Map({
        container: el,
        style: "mapbox://styles/mapbox/light-v11",
        center: [2.2137, 46.2276],
        zoom: 4.5,
        projection: "mercator",
        cooperativeGestures: true,
      });
      mapRef.current = map;
      initedRef.current = true;

      map.on("load", () => {
        // source initiale
        map.addSource("points", { type: "geojson", data });
        // layer heatmap
        map.addLayer({
          id: "heat",
          type: "heatmap",
          source: "points",
          maxzoom: 15,
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["coalesce", ["get", "weight"], 1],
              0, 0,
              1, 1
            ],
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0, 0.6,
              15, 2.0
            ],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(0,0,255,0)",
              0.2, "green",
              0.4, "yellow",
              0.6, "rgba(231, 81, 81, 0)",
              0.8, "rgba(185, 31, 31, 0)",
              1, "rgba(112, 15, 15, 0)"
            ],
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0, 2,
              9, 20,
              13, 40
            ],
            "heatmap-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10, 1,
              15, 0.6
            ],
          },
        });

        map.resize(); // si parent était caché
      });

      const onResize = () => map.resize();
      window.addEventListener("resize", onResize);
      map.on("error", (e) => console.error("Mapbox error:", e.error));

      return () => {
        window.removeEventListener("resize", onResize);
        map.remove();
        mapRef.current = null;
        initedRef.current = false;
      };
    };

    // tente immédiatement, sinon observe jusqu’à avoir une taille
    const cleanup = startIfReady();
    if (cleanup) return cleanup;

    const ro = new ResizeObserver(() => {
      const done = startIfReady();
      if (done) ro.disconnect();
    });
    ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, []);

  // The map fills its parent. Parent should control height.
  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

export const sampleData: FeatureCollection<Point, { weight?: number }> = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.3522, 48.8566] } }, // Paris
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.3698, 43.2965] } }, // Marseille
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.8357, 45.7640] } }, // Lyon
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.4442, 43.6045] } }, // Toulouse
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [7.2620, 43.7102] } }, // Nice
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-1.5536, 47.2184] } }, // Nantes
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [3.8767, 43.6119] } }, // Montpellier
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [7.7521, 48.5734] } }, // Strasbourg
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-0.5792, 44.8378] } }, // Bordeaux
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [3.0573, 50.6292] } }, // Lille
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-1.6778, 48.1173] } }, // Rennes
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.0317, 49.2583] } }, // Reims
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.3903, 45.4397] } }, // Saint-Étienne
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.9280, 43.1242] } }, // Toulon
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.7245, 45.1885] } }, // Grenoble
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.0415, 47.3220] } }, // Dijon
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-0.5632, 47.4784] } }, // Angers
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.3601, 43.8367] } }, // Nîmes
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.8790, 45.7660] } }, // Villeurbanne
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [0.1079, 49.4944] } }, // Le Havre
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [3.0870, 45.7772] } }, // Clermont-Ferrand
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.4474, 43.5297] } }, // Aix-en-Provence
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-4.4861, 48.3904] } }, // Brest
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.2611, 45.8336] } }, // Limoges
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [0.6848, 47.3941] } }, // Tours
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.2957, 49.8941] } }, // Amiens
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.8956, 42.6887] } }, // Perpignan
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [6.1757, 49.1193] } }, // Metz
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [6.0253, 47.2378] } }, // Besançon
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.2410, 48.8397] } }, // Boulogne-Billancourt
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.9093, 47.9029] } }, // Orléans
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [7.3379, 47.7508] } }, // Mulhouse
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.0993, 49.4431] } }, // Rouen
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-0.3707, 49.1829] } }, // Caen
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [6.1844, 48.6921] } }, // Nancy
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.2474, 48.9472] } }, // Argenteuil
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.4432, 48.8642] } }, // Montreuil
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.3570, 48.9362] } }, // Saint-Denis
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [3.1710, 50.6942] } }, // Roubaix
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.8055, 43.9493] } }, // Avignon
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [0.3404, 46.5802] } }, // Poitiers
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.2070, 48.8924] } }, // Nanterre
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.4556, 48.7904] } }, // Créteil
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.1301, 48.8049] } }, // Versailles
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-0.3708, 43.2951] } }, // Pau
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-1.1511, 46.1603] } }, // La Rochelle
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [6.1294, 45.8992] } }, // Annecy
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-1.4748, 43.4929] } }, // Bayonne
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-2.2060, 47.2735] } }, // Saint-Nazaire
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [7.3556, 48.0793] } }, // Colmar
    { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.0473, 49.2333] } }, // Charleville-Mézières
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [3.0823, 50.5189] } }, // Tourcoing
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.7250, 47.9961] } }, // Blois
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.1508, 49.0210] } }, // Évreux
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [0.1960, 49.3570] } }, // Le Havre Agglo
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.0284, 49.2750] } }, // Châlons-en-Champagne
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [6.1540, 47.6333] } }, // Belfort
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-1.4989, 43.5050] } }, // Biarritz
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.7324, 44.1030] } }, // Albi
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [3.0819, 45.0333] } }, // Aurillac
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [6.8667, 47.6167] } }, // Montbéliard
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.0803, 48.2973] } }, // Troyes
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.8853, 50.2869] } }, // Lens
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.2064, 48.7743] } }, // Vitry-sur-Seine
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.2640, 48.7954] } }, // Antony
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.3822, 48.8600] } }, // Ivry-sur-Seine
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.3933, 43.6123] } }, // Muret
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.4189, 43.5283] } }, // Aubagne
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [7.7486, 48.5800] } }, // Schiltigheim
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.8065, 44.9336] } }, // Valence
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [0.3433, 46.5833] } }, // Châtellerault
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [0.7428, 47.3644] } }, // Saint-Cyr-sur-Loire
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.8531, 45.7617] } }, // Caluire-et-Cuire
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [6.1864, 44.5583] } }, // Gap
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.7967, 50.2899] } }, // Douai
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [3.0717, 49.4233] } }, // Soissons
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [3.9522, 49.2436] } }, // Épernay
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.0884, 49.9241] } }, // Dieppe
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [3.9419, 43.5908] } }, // Lunel
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.0944, 48.3000] } }, // Sainte-Savine
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.4581, 48.8050] } }, // Maisons-Alfort
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.7078, 49.7640] } }, // Sedan
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [7.2025, 43.7047] } }, // Cagnes-sur-Mer
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.8798, 43.9542] } }, // Orange
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.9195, 43.1235] } }, // La Seyne-sur-Mer
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [7.0519, 43.5413] } }, // Antibes
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.0415, 47.3230] } }, // Chenôve
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [3.5621, 45.7619] } }, // Issoire
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.0993, 48.8025] } }, // Suresnes
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.2520, 48.8340] } }, // Clamart
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.3634, 48.9092] } }, // Aubervilliers
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.8378, 45.7485] } }, // Oullins
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.0612, 48.2962] } }, // Saint-André-les-Vergers
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.9104, 43.1204] } }, // Six-Fours-les-Plages
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.8350, 45.7333] } }, // Saint-Fons
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.0481, 47.3271] } }, // Talant
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.9020, 47.9000] } }, // Saint-Jean-de-Braye
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.0876, 49.2550] } }, // Tinqueux
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [7.4290, 47.7510] } }, // Illzach
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-2.0170, 48.6493] } }, // Saint-Malo
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-2.7603, 47.6582] } }, // Vannes
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-3.3666, 47.7486] } }, // Lorient
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-4.1027, 47.9959] } }, // Quimper
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-0.8780, 47.0606] } }, // Cholet
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-0.7703, 48.0733] } }, // Laval
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [0.1996, 48.0061] } }, // Le Mans
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [0.0931, 48.4313] } }, // Alençon
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.4890, 48.4469] } }, // Chartres
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.3950, 47.0810] } }, // Bourges
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [3.1590, 46.9896] } }, // Nevers
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.6930, 46.8100] } }, // Châteauroux
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-1.4260, 46.6700] } }, // La Roche-sur-Yon
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-0.4630, 46.3240] } }, // Niort
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [0.1562, 45.6484] } }, // Angoulême
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [0.7217, 45.1843] } }, // Périgueux
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.5333, 45.1591] } }, // Brive-la-Gaillarde
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.7700, 45.2700] } }, // Tulle
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.4400, 44.4500] } }, // Cahors
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [1.3540, 44.0180] } }, // Montauban
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [0.6210, 44.2040] } }, // Agen
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [0.5860, 43.6460] } }, // Auch
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [0.0723, 43.2325] } }, // Tarbes
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-1.0536, 43.7102] } }, // Dax
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [-0.4989, 43.8902] } }, // Mont-de-Marsan
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.2400, 43.6040] } }, // Castres
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [2.3490, 43.2130] } }, // Carcassonne
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [3.2158, 43.3442] } }, // Béziers
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [3.7000, 43.4020] } }, // Sète
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [3.0000, 43.1843] } }, // Narbonne
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.6300, 43.6767] } }, // Arles
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.0970, 43.6420] } }, // Salon-de-Provence
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.9896, 43.5105] } }, // Istres
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.0553, 43.4053] } }, // Martigues
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [6.7350, 43.4326] } }, // Fréjus
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [7.0174, 43.5528] } }, // Cannes
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [6.9217, 43.6588] } }, // Grasse
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [6.2350, 44.0922] } }, // Digne-les-Bains
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.7869, 43.8340] } }, // Manosque
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [6.6427, 44.8999] } }, // Briançon
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.7490, 44.5586] } }, // Montélimar
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.0513, 45.0469] } }, // Romans-sur-Isère
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.9178, 45.5646] } }, // Chambéry
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.9229, 45.6838] } }, // Aix-les-Bains
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [6.2377, 46.1944] } }, // Annemasse
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [6.4797, 46.3720] } }, // Thonon-les-Bains
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.2258, 46.2057] } }, // Bourg-en-Bresse
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.8336, 46.3069] } }, // Mâcon
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.0744, 46.0340] } }, // Roanne
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.5120, 45.4742] } }, // Saint-Chamond
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [4.8716, 45.5257] } }, // Vienne
  { type: "Feature", properties: { weight: Math.random() * 0.7 + 0.3 }, geometry: { type: "Point", coordinates: [5.2760, 45.5860] } }, // Bourgoin-Jallieu
  ],
};
