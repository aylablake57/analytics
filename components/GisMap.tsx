'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
  id: number;
  title: string;
  lat: number;
  lng: number;
  sector: string;
  risk_level: string;
  user: {
    name: string;
    email: string;
  };
}

interface GisMapProps {
  locations: Location[];
  onLocationClick?: (location: Location) => void;
}

export default function GisMap({ locations, onLocationClick }: GisMapProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || locations.length === 0) return;

    // Initialize map
    const map = L.map('map').setView([31.5204, 74.3587], 10); // Default: Pakistan

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add markers for each location
    locations.forEach((location) => {
      const color = getRiskColor(location.risk_level);
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-${color}-500 border-2 border-white shadow-lg">
            <span class="text-white text-xs font-bold">●</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([location.lat, location.lng], { icon }).addTo(map);

      marker.bindPopup(`
        <div class="p-3 min-w-48">
          <h4 class="font-bold text-gray-800 mb-1">${location.title}</h4>
          <p class="text-sm text-gray-600 mb-2">
            <strong>Sector:</strong> ${location.sector}
          </p>
          <p class="text-sm text-gray-600 mb-2">
            <strong>Risk Level:</strong> 
            <span class="ml-1 px-2 py-1 rounded text-white text-xs font-bold" style="background-color: ${getRiskColor(location.risk_level)}">
              ${location.risk_level.toUpperCase()}
            </span>
          </p>
          <p class="text-sm text-gray-600">
            <strong>Contact:</strong> ${location.user.name}
          </p>
        </div>
      `);

      marker.on('click', () => {
        setSelectedLocation(location);
        onLocationClick?.(location);
      });
    });

    // Cleanup
    return () => {
      map.remove();
    };
  }, [mounted, locations, onLocationClick]);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="animate-pulse">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div id="map" className="w-full h-full rounded-lg shadow-md" />
      {selectedLocation && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs animate-slide-in-up">
          <button
            onClick={() => setSelectedLocation(null)}
            className="float-right text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
          <h4 className="font-bold text-gray-800 mb-2">{selectedLocation.title}</h4>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Sector:</strong> {selectedLocation.sector}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Contact:</strong> {selectedLocation.user.name}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Email:</strong> {selectedLocation.user.email}
          </p>
        </div>
      )}
    </div>
  );
}

function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'high':
      return 'red';
    case 'medium':
      return 'orange';
    case 'low':
      return 'green';
    default:
      return 'gray';
  }
}
