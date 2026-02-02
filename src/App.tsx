import { useRef, useCallback, useEffect } from 'react';
import Map, { Source, Layer, useMap } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useAutoStepRobots, useMoveRobots, useReset, useRobots } from './hooks/api';

import type { FeatureCollection, Point } from 'geojson';
import type { Robot } from './hooks/api';

import css from './App.module.css'

function robotsToPointCollection(robots: Robot[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: robots.map((robot) => ({
      type: 'Feature',
      id: robot.index,
      geometry: {
        type: 'Point',
        coordinates: [robot.position[1], robot.position[0]],
      },
      properties: { name: `robot ${robot.index}`},
    }))
  }
}

function MapContent() {
  const { current: map } = useMap();
  const { robots } = useRobots()
  const dataRef = useRef<FeatureCollection<Point>>(robotsToPointCollection(robots));

  useEffect(() => {
    console.log('effect triggered')
    // Safety check for map instance
    if (!map) return;

    dataRef.current.features = robotsToPointCollection(robots).features

    // Cast the source type to GeoJSONSource to access .setData()
    const source = map.getSource('robots-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(dataRef.current);
      console.log('set the data')
    }
  }, [map, robots])

  return (
    <>
      <Source id="robots-source" type="geojson" data={dataRef.current}>
        <Layer
          id="point-layer"
          type="circle"
          paint={{
            'circle-radius': 10,
            'circle-color': '#ef4444',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }}
        />
      </Source>
    </>
  );
}

const INITIAL_DATA: FeatureCollection<Point> = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    id: 1,
    geometry: {
      type: 'Point',
      coordinates: [-118.2437, 34.0522]
    },
    properties: { name: 'Moving Marker' }
  }]
};

function MapContentOld() {
  const { current: map } = useMap();

  const dataRef = useRef<FeatureCollection<Point>>(INITIAL_DATA);
  const animationRef = useRef<number | null>(null);

  const startDirectAnimation = useCallback((targetLng: number, targetLat: number) => {
    // Safety check for map instance and existing feature
    if (!map || !dataRef.current.features[0]) return;

    const start = dataRef.current.features[0].geometry.coordinates as [number, number];
    const end: [number, number] = [targetLng, targetLat];
    let startTime: number | null = null;

    const frame = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / 1000, 1);

      const lng = start[0] + (end[0] - start[0]) * progress;
      const lat = start[1] + (end[1] - start[1]) * progress;
      dataRef.current.features[0].geometry.coordinates = [lng, lat];

      // Cast the source to GeoJSONSource to access .setData()
      const source = map.getSource('moving-source') as maplibregl.GeoJSONSource;

      if (source) {
        source.setData(dataRef.current);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(frame);
      }
    };

    animationRef.current = requestAnimationFrame(frame);
  }, [map]);

  return (
    <>
      <button
        className={css.button}
        onClick={() => startDirectAnimation(-118.26, 34.04)}
      >
        Move to LA Live
      </button>

      <Source id="moving-source" type="geojson" data={dataRef.current}>
        <Layer
          id="point-layer"
          type="circle"
          paint={{
            'circle-radius': 12,
            'circle-color': '#ef4444',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff'
          }}
        />
      </Source>
    </>
  );
}

export default function App() {
  return (
    <Map
      id="my-map"
      initialViewState={{
        longitude: -118.25,
        latitude: 34.035,
        zoom: 13
      }}
      style={{ width: '100vw', height: '100vh' }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
    >
      <MapContent />
    </Map>
  );
}
