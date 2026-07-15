import { useQuery } from '@tanstack/react-query';

type Geocode = { latitude: number; longitude: number };

type WeatherResult = {
  temperatureF: number;
  condition: string;
  code: number;
};

async function geocode(placeName: string): Promise<Geocode | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    placeName
  )}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const json = await res.json();
  const hit = json?.results?.[0];
  if (!hit) return null;
  return { latitude: hit.latitude, longitude: hit.longitude };
}

async function fetchCurrent(coords: Geocode): Promise<WeatherResult> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  const json = await res.json();
  const code = json?.current?.weather_code ?? 0;
  return {
    temperatureF: Math.round(json?.current?.temperature_2m ?? 0),
    condition: weatherCodeLabel(code),
    code,
  };
}

// https://open-meteo.com/en/docs — WMO weather interpretation codes
function weatherCodeLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mostly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Unknown';
}

export function useWeather(placeName: string | null | undefined) {
  return useQuery({
    queryKey: ['weather', placeName],
    enabled: !!placeName,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const coords = await geocode(placeName!);
      if (!coords) return null;
      return fetchCurrent(coords);
    },
  });
}
