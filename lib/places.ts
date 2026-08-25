/** Demo km from the buyer mandi. Not GPS. Spec match still wins over distance. */
export const BUYER_HUB = "Firozabad mandi";

const KM_FROM_HUB: Record<string, number> = {
  "North": 6,
  "Ramnagar": 2,
  "South": 7,
  "Suhag Nagar": 4
};

export const HOUSE_PLACE: Record<string, string> = {
  "HH-01": "Ramnagar",
  "HH-02": "Suhag Nagar",
  "HH-03": "Ramnagar",
  "HH-04": "South",
  "HH-05": "Ramnagar",
  "HH-06": "Suhag Nagar",
  "HH-07": "North",
  "HH-08": "South",
  "HH-09": "Ramnagar",
  "HH-10": "Suhag Nagar",
  "HH-11": "North",
  "HH-12": "South",
  "HH-13": "Ramnagar",
  "HH-14": "Suhag Nagar",
  "HH-15": "North",
  "HH-16": "South",
  "HH-17": "Ramnagar",
  "HH-18": "Suhag Nagar",
  "HH-19": "North",
  "HH-20": "South",
};

/** Demo pins around Firozabad. Not live GPS. */
export const PLACE_GEO: Record<string, { lat: number; lng: number }> = {
  "Firozabad mandi": { lat: 27.1591, lng: 78.3958 },
  North: { lat: 27.1785, lng: 78.394 },
  Ramnagar: { lat: 27.1682, lng: 78.3815 },
  South: { lat: 27.1412, lng: 78.3975 },
  "Suhag Nagar": { lat: 27.1508, lng: 78.4122 },
};

export function placeGeo(locality: string) {
  return PLACE_GEO[locality] ?? { lat: 27.155, lng: 78.4 };
}

export function kmFromHub(locality: string) {
  return KM_FROM_HUB[locality] ?? 9;
}

export function distanceLabel(locality: string, lang: "hi" | "en" = "en") {
  const km = kmFromHub(locality);
  return lang === "hi" ? `~${km} किमी · ${locality}` : `~${km} km · ${locality}`;
}
