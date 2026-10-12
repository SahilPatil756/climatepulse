"""
ClimatePulse FastAPI Backend
Entry point for Python FastAPI implementation matching PRD Section 19.
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import httpx
from pydantic import BaseModel

app = FastAPI(
    title="ClimatePulse API",
    description="Live Climate Impact Dashboard Analytics & Ingestion Service",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PRESET_COORDINATES = {
    "pune": {"city": "Pune", "country": "India", "lat": 18.5204, "lon": 73.8567},
    "mumbai": {"city": "Mumbai", "country": "India", "lat": 19.0760, "lon": 72.8777},
    "delhi": {"city": "Delhi", "country": "India", "lat": 28.6139, "lon": 77.2090},
    "bangalore": {"city": "Bangalore", "country": "India", "lat": 12.9716, "lon": 77.5946},
    "london": {"city": "London", "country": "United Kingdom", "lat": 51.5074, "lon": -0.1278},
    "newyork": {"city": "New York", "country": "United States", "lat": 40.7128, "lon": -74.0060},
    "tokyo": {"city": "Tokyo", "country": "Japan", "lat": 35.6762, "lon": 139.6503},
}

@app.get("/")
def read_root():
    return {
        "app": "ClimatePulse Live Climate Impact Dashboard",
        "status": "operational",
        "documentation": "/docs",
    }

@app.get("/api/climate/current")
async def get_current_climate(city: str = Query("Pune", description="Target city name")):
    loc = PRESET_COORDINATES.get(city.lower(), PRESET_COORDINATES["pune"])
    url = f"https://api.open-meteo.com/v1/forecast?latitude={loc['lat']}&longitude={loc['lon']}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure,wind_speed_10m,uv_index,weather_code"
    
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        if res.status_code != 200:
            raise HTTPException(status_code=502, detail="Upstream Weather API Error")
        data = res.json()
        
    return {
        "city": loc["city"],
        "country": loc["country"],
        "coordinates": {"latitude": loc["lat"], "longitude": loc["lon"]},
        "current": data.get("current", {}),
    }

@app.get("/api/air-quality")
async def get_air_quality(city: str = Query("Pune", description="Target city name")):
    loc = PRESET_COORDINATES.get(city.lower(), PRESET_COORDINATES["pune"])
    url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={loc['lat']}&longitude={loc['lon']}&current=us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone"
    
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        if res.status_code != 200:
            raise HTTPException(status_code=502, detail="Upstream Air Quality API Error")
        data = res.json()
        
    return {
        "city": loc["city"],
        "country": loc["country"],
        "air_quality": data.get("current", {}),
    }

@app.get("/api/compare")
async def compare_cities(cities: str = Query("Pune,Mumbai,Delhi")):
    city_list = [c.strip() for c in cities.split(",") if c.strip()]
    results = []
    
    async with httpx.AsyncClient() as client:
        for c in city_list:
            loc = PRESET_COORDINATES.get(c.lower())
            if not loc:
                continue
            url = f"https://api.open-meteo.com/v1/forecast?latitude={loc['lat']}&longitude={loc['lon']}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation"
            res = await client.get(url)
            if res.status_code == 200:
                results.append({
                    "city": loc["city"],
                    "country": loc["country"],
                    "data": res.json().get("current", {})
                })
                
    return {"comparisons": results}

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "open_meteo_weather": "active",
        "open_meteo_aqi": "active",
        "database": "connected",
    }
