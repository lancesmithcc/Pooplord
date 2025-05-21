// components/game/GameMap.tsx
import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    initMap?: () => void; // Made initMap optional
    google?: any; // Made google optional. Consider using @types/google.maps for better type safety
  }
}

interface GameMapProps {
  onMapLoaded: (map: any /* google.maps.Map */) => void;
  apiKey: string;
}

const GameMap: React.FC<GameMapProps> = ({ onMapLoaded, apiKey }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true); // To prevent updates on unmounted component

  useEffect(() => {
    isMounted.current = true;
    let mapInstance: any = null; // google.maps.Map

    window.initMap = () => {
      if (mapRef.current && isMounted.current) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (!isMounted.current) return;
              const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
              mapInstance = new window.google.maps.Map(mapRef.current, {
                center: userLocation,
                zoom: 19, // Zoomed in a bit more for local feel
                mapTypeId: 'satellite',
                disableDefaultUI: true,
                draggableCursor: 'grab',
                draggingCursor: 'grabbing',
              });
              onMapLoaded(mapInstance);
            },
            () => { // Handle error or default location
              if (!isMounted.current) return;
              console.warn('Geolocation permission denied or failed. Defaulting...');
              const defaultLocation = { lat: 37.7749, lng: -122.4194 }; // SF
              mapInstance = new window.google.maps.Map(mapRef.current, {
                center: defaultLocation, zoom: 19, mapTypeId: 'satellite',
                disableDefaultUI: true, draggableCursor: 'grab', draggingCursor: 'grabbing',
              });
              onMapLoaded(mapInstance);
            },
            { enableHighAccuracy: true } // Geolocation options
          );
        } else { // Browser doesn't support Geolocation
          if (!isMounted.current) return;
          console.warn('Geolocation not supported. Defaulting...');
          const defaultLocation = { lat: 37.7749, lng: -122.4194 };
          mapInstance = new window.google.maps.Map(mapRef.current, {
            center: defaultLocation, zoom: 19, mapTypeId: 'satellite',
            disableDefaultUI: true, draggableCursor: 'grab', draggingCursor: 'grabbing',
          });
          onMapLoaded(mapInstance);
        }
      }
    };

    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      console.error('ERROR: Google Maps API Key is missing or is a placeholder.');
      if (mapRef.current) {
        mapRef.current.innerHTML = '<p style="color: red; text-align: center; padding-top: 20px;">Error: Google Maps API Key is missing.</p>';
      }
      return;
    }

    // Check if Google Maps script is already loaded
    if (!window.google || !window.google.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=geometry`; // Added geometry library
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      // Clean up script tag if component unmounts before script loads
      return () => {
        isMounted.current = false;
        document.head.removeChild(script);
        delete window.initMap; // Corrected delete usage
      };
    } else if (window.google && window.google.maps) {
      // If script is already there, just call initMap (e.g., on HMR)
      window.initMap?.(); // Safely call initMap using optional chaining
    }

    return () => {
      isMounted.current = false;
      // Note: Google Maps might not fully clean up itself. 
      // For complex scenarios, manual destruction of mapInstance might be needed.
      if (mapRef.current) mapRef.current.innerHTML = ''; // Clear map div
      delete window.initMap; // Corrected delete usage
    };
  }, [apiKey, onMapLoaded]);

  return (
    <div ref={mapRef} style={{ border: '1px solid black', height: '100%', width: '100%' }}>
      {/* Map will be rendered here */}
    </div>
  );
};

export default GameMap;
