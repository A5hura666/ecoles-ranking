"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/** Pin en forme de goutte classique, pointe en bas — plus lisible qu'un
 *  simple rond quand deux marqueurs de couleurs différentes se trouvent
 *  proches l'un de l'autre sur une petite carte. */
function makePinIcon(color: string, size = 24) {
    return L.divIcon({
        html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2px solid #f6f4ee;
      box-shadow:0 1px 2px rgba(0,0,0,0.4);
    "></div>`,
        className: "",
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
    });
}

const referenceIcon = makePinIcon("#3b6e8f"); // bleu — adresse de référence
const destinationIcon = makePinIcon("#b5623a"); // rouge/clay — école

interface Props {
    destLat: number;
    destLon: number;
    refLat: number;
    refLon: number;
}

export default function MiniMap({ destLat, destLon, refLat, refLon }: Props) {
    const bounds = L.latLngBounds([
        [refLat, refLon],
        [destLat, destLon],
    ]);

    return (
        <MapContainer
            bounds={bounds}
            boundsOptions={{ padding: [28, 28] }}
            style={{ height: "100%", width: "100%" }}
            dragging={false}
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            boxZoom={false}
            keyboard={false}
            touchZoom={false}
            attributionControl={false}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[refLat, refLon]} icon={referenceIcon} />
            <Marker position={[destLat, destLon]} icon={destinationIcon} />
        </MapContainer>
    );
}