import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export default function DebugMap() {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
    console.log("token=", import.meta.env.VITE_MAPBOX_TOKEN);
    const map = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [2.2137, 46.2276],
      zoom: 4.5,
      cooperativeGestures: true,
    });
    mapRef.current = map;

    map.on("load", () => {
      console.log("map loaded");
      map.resize(); // utile si le conteneur était caché à l'init
    });
    map.on("error", (e) => console.error("mapbox error:", e.error));

    return () => map.remove();
  }, []);

  return <div id="map" ref={ref} />;
}