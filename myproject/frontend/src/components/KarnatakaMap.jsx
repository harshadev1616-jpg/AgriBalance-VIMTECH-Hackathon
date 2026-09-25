import { useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIconRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const center = [14.5204, 75.7224];

function SelectionMarker({ selected, onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat.toFixed(4), lon: event.latlng.lng.toFixed(4) });
    },
  });

  return (
    <Marker position={[selected.lat, selected.lon]}>
      <Popup>
        Selected field
        <br />
        {selected.lat}, {selected.lon}
      </Popup>
    </Marker>
  );
}

export default function KarnatakaMap({ selected, onSelect }) {
  const [tileError, setTileError] = useState(false);

  return (
    <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 p-4">
        <h2 className="text-base font-semibold text-stone-900">Karnataka Field Map</h2>
        <p className="text-sm text-stone-500">{selected.lat}, {selected.lon}</p>
      </div>
      <div className="relative h-[420px]">
        <MapContainer className="h-full w-full" center={center} zoom={7} scrollWheelZoom>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            eventHandlers={{
              load: () => setTileError(false),
              tileerror: () => setTileError(true),
            }}
          />
          <SelectionMarker selected={selected} onSelect={onSelect} />
        </MapContainer>
        {tileError ? (
          <div className="pointer-events-none absolute inset-3 z-[1000] flex items-end">
            <p className="rounded-md border border-amber-200/30 bg-slate-950/90 px-3 py-2 text-xs text-amber-100">
              Map tiles are unavailable. Field selection still works; coordinates remain visible above.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
