'use client'

import { useEffect, useState } from 'react'
import { Thermometer, Droplets, Sun } from 'lucide-react'

interface DayForecast {
  date: string
  maxTemp: number
  minTemp: number
  precipProb: number
  uvIndex: number
  weatherCode: number
}

function weatherDesc(code: number): string {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Cloudy'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 99) return 'Storms'
  return 'Mixed'
}

function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 99) return '⛈️'
  return '🌤️'
}

export function WeatherWidget({ lat, lon }: { lat: number; lon: number }) {
  const [forecast, setForecast] = useState<DayForecast[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,weathercode` +
      `&temperature_unit=fahrenheit&timezone=auto&forecast_days=3`

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const d = data.daily
        const days: DayForecast[] = (d.time as string[]).map((date: string, i: number) => ({
          date,
          maxTemp: Math.round(d.temperature_2m_max[i]),
          minTemp: Math.round(d.temperature_2m_min[i]),
          precipProb: d.precipitation_probability_max[i],
          uvIndex: Math.round(d.uv_index_max[i]),
          weatherCode: d.weathercode[i],
        }))
        setForecast(days)
      })
      .catch(() => {/* silently hide */})
      .finally(() => setLoading(false))
  }, [lat, lon])

  if (!loading && forecast.length === 0) return null

  return (
    <div className="rounded-xl border border-stone-700 bg-stone-800 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-200">
        <Sun className="h-4 w-4 text-amber-400" />
        Weather at this location
      </div>

      {loading ? (
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 flex-1 animate-pulse rounded-lg bg-stone-700" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {forecast.map((day) => (
            <div key={day.date} className="rounded-lg bg-stone-700/50 p-2.5 text-center">
              <div className="text-base">{weatherEmoji(day.weatherCode)}</div>
              <div className="mt-0.5 text-xs text-stone-400">
                {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="mt-1 text-sm font-semibold text-stone-100">{day.maxTemp}°F</div>
              <div className="text-xs text-stone-500">{day.minTemp}°</div>
              <div className="mt-1 flex items-center justify-center gap-1 text-xs text-blue-300">
                <Droplets className="h-3 w-3" />
                {day.precipProb}%
              </div>
              <div className="mt-0.5 flex items-center justify-center gap-1 text-xs text-amber-400">
                <Thermometer className="h-3 w-3" />
                UV {day.uvIndex}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-stone-500">
        Forecast for GPS coordinates · not water conditions
      </p>
    </div>
  )
}
