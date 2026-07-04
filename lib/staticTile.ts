// lib/staticTile.ts

/** Convertit lat/lon en coordonnées de tuile OSM (format slippy map). */
function lonToTileX(lon: number, zoom: number): number {
    return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function latToTileY(lat: number, zoom: number): number {
    const rad = (lat * Math.PI) / 180;
    return Math.floor(
        ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
        Math.pow(2, zoom)
    );
}

/** URL d'une tuile OSM unique centrée approximativement sur le point,
 *  utilisable comme aperçu miniature dans une liste. */
export function staticTileUrl(lat: number, lon: number, zoom = 15): string {
    const x = lonToTileX(lon, zoom);
    const y = latToTileY(lat, zoom);
    return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}