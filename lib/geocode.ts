import { GeoPoint } from "./types";
import { readGeocodeCache, writeGeocodeCache } from "./storage";

const DELAY_MS = 1100;
let queueTail: Promise<void> = Promise.resolve();

async function throttledFetch(url: string): Promise<Response> {
  const run = queueTail.then(() => fetch(url));
  queueTail = run.then(
      () => new Promise((resolve) => setTimeout(resolve, DELAY_MS)),
      () => new Promise((resolve) => setTimeout(resolve, DELAY_MS))
  );
  return run;
}

function normalize(s: string): string {
  return s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // accents
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
}

/** True if the two place names plausibly refer to the same commune.
 *  Handles cases like commune="LYON 3" vs address city="Lyon" by
 *  checking containment once normalized. */
function sameCommune(a: string, b: string): boolean {
  if (!a || !b) return false;
  const na = normalize(a);
  const nb = normalize(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

async function runQuery(
    params: Record<string, string>
): Promise<{ point: GeoPoint; postcode: string } | null> {
  const search = new URLSearchParams({
    format: "json",
    limit: "1",
    countrycodes: "fr",
    addressdetails: "1",
    ...params,
  });
  const url = `https://nominatim.openstreetmap.org/search?${search.toString()}`;
  try {
    const res = await throttledFetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const hit = data[0];
      return {
        point: { lat: parseFloat(hit.lat), lon: parseFloat(hit.lon) },
        postcode: hit.address?.postcode ?? "",
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Rejects a result whose returned postcode isn't in the same
 *  département as the one we asked for — this is what catches a
 *  street name that matched somewhere else in France entirely. */
function inExpectedDepartement(resultPostcode: string, expectedPostcode: string): boolean {
  if (!resultPostcode || !expectedPostcode) return true; // can't verify, don't block
  return resultPostcode.slice(0, 2) === expectedPostcode.slice(0, 2);
}

function extractStreet(adresse: string, codePostal: string): string {
  if (!adresse || !codePostal) return "";
  const idx = adresse.indexOf(codePostal);
  if (idx === -1) return "";
  return adresse.slice(0, idx).replace(/,+\s*$/, "").trim();
}

/** Text following the postal code in "12 Rue X, 69800 Saint-Priest"
 *  i.e. the city name as it actually appears in the address string. */
function extractCityFromAddress(adresse: string, codePostal: string): string {
  const idx = adresse.indexOf(codePostal);
  if (idx === -1) return "";
  return adresse.slice(idx + codePostal.length).trim();
}

export async function geocodeAddress(
    adresse: string,
    commune: string,
    codePostal: string
): Promise<GeoPoint | null> {
  const cache = readGeocodeCache();
  const cacheKey = (adresse || `${codePostal} ${commune}`).trim().toLowerCase();
  if (cacheKey in cache) return cache[cacheKey];

  const street = extractStreet(adresse, codePostal);
  const addressCity = extractCityFromAddress(adresse, codePostal);
  const cityMismatch = !!addressCity && !!commune && !sameCommune(addressCity, commune);

  // adresse + codePostal travel together in the source data and agree
  // with each other even when `commune` doesn't. When they disagree,
  // trust the city embedded in `adresse`, not the `commune` field.
  const effectiveCity = cityMismatch ? addressCity : commune;

  let result: { point: GeoPoint; postcode: string } | null = null;

  if (street && codePostal && effectiveCity) {
    result = await runQuery({
      street,
      postalcode: codePostal,
      city: effectiveCity,
      country: "France",
    });
    if (result && !inExpectedDepartement(result.postcode, codePostal)) {
      result = null;
    }
  }

  if (!result && codePostal && effectiveCity) {
    result = await runQuery({
      postalcode: codePostal,
      city: effectiveCity,
      country: "France",
    });
    if (result && !inExpectedDepartement(result.postcode, codePostal)) {
      result = null;
    }
  }

  // Last resort: try the *other* city name too, in case effectiveCity
  // itself fails to resolve (e.g. a very small hamlet).
  if (!result && codePostal && cityMismatch && commune) {
    result = await runQuery({ postalcode: codePostal, city: commune, country: "France" });
    if (result && !inExpectedDepartement(result.postcode, codePostal)) {
      result = null;
    }
  }

  if (!result) {
    result = await runQuery({ q: `${effectiveCity || commune}, France` });
    if (result && !inExpectedDepartement(result.postcode, codePostal)) {
      result = null;
    }
  }

  const point = result?.point ?? null;
  cache[cacheKey] = point;
  writeGeocodeCache(cache);
  return point;
}