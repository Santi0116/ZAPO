import { MapPin, ExternalLink } from "lucide-react";
export default function StoreLocation(){
  const address=import.meta.env.VITE_STORE_ADDRESS||"Dirección de la sucursal, Bogotá, Colombia";
  const mapUrl=import.meta.env.VITE_GOOGLE_MAPS_EMBED_URL;
  return <main className="section page-content"><span className="eyebrow">VISÍTANOS</span><h1>Nuestra tienda</h1><div className="store-layout"><div><MapPin/><h2>ZAPO</h2><p>{address}</p><a className="button button-dark" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}>Cómo llegar <ExternalLink size={16}/></a></div>{mapUrl?<iframe title="Mapa de la sucursal" src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>:<div className="map-placeholder"><MapPin size={36}/><p>Configura VITE_GOOGLE_MAPS_EMBED_URL para mostrar el mapa aquí.</p><a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}>Abrir en Google Maps</a></div>}</div></main>;
}
