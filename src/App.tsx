import { useRef, useEffect, useEffectEvent } from "react";
import Map, { Source, Layer, useMap } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import { ActionsMenu } from "@/components/ActionsMenu";
import { Toaster } from "@/components/ui/toaster";
import { useRobots } from "@/hooks/api";

import type { FeatureCollection, Point } from "geojson";
import type { Robot } from "./hooks/api";

/** Converts a Robot array into point data that can be set as a Source */
function robotsToPointCollection(robots: Robot[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: robots.map((robot) => ({
      type: "Feature",
      id: robot.index,
      geometry: {
        type: "Point",
        coordinates: [robot.position[1], robot.position[0]],
      },
      properties: {
        name: `robot ${robot.index}`,
        colorIndex: robot.index % 20,
      },
    })),
  };
}

/** The content that is placed on top of the map */
function MapContent() {
  const { current: map } = useMap();
  const { robots } = useRobots();
  const dataRef = useRef<FeatureCollection<Point>>(
    robotsToPointCollection(robots),
  );
  const animationRef = useRef<number | null>(null);

  // update the source data outside of the React lifecycle, for better performance
  const updateSource = useEffectEvent((data: FeatureCollection<Point>) => {
    // Safety check for map instance
    if (!map) return;

    // Cast the source type to GeoJSONSource to access .setData()
    const source = map.getSource("robots-source") as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(data);
    }
  });

  useEffect(() => {
    // Safety check for map instance
    if (!map) return;

    // if number of robots has changed, no need for smooth animation
    if (dataRef.current.features.length !== robots.length) {
      dataRef.current.features = robotsToPointCollection(robots).features;
      updateSource(dataRef.current);
      return;
    }

    // get the start and end coordinates of our animation
    const startCoords = dataRef.current.features.map(
      (feature) => feature.geometry.coordinates,
    );
    const endCoords = robots.map((robot) => [
      robot.position[1],
      robot.position[0],
    ]);

    let startTime: number | null = null;
    const animationMs = 1000; // animation duration

    // run this for each animation frame
    const frame = (time: number) => {
      if (!startTime) startTime = time;
      const percentProgress = Math.min((time - startTime) / animationMs, 1);

      startCoords.forEach((startCoord, idx) => {
        const endCoord = endCoords[idx];
        const newCoord = [
          startCoord[0] + (endCoord[0] - startCoord[0]) * percentProgress,
          startCoord[1] + (endCoord[1] - startCoord[1]) * percentProgress,
        ];
        dataRef.current.features[idx].geometry.coordinates = newCoord;
      });

      updateSource(dataRef.current);

      if (percentProgress < 1) {
        animationRef.current = requestAnimationFrame(frame);
      }
    };

    // initiate animation
    animationRef.current = requestAnimationFrame(frame);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [map, robots]);

  return (
    <>
      <Toaster />
      <ActionsMenu />

      {/* eslint-disable-next-line react-hooks/refs */}
      <Source id="robots-source" type="geojson" data={dataRef.current}>
        <Layer
          id="point-layer"
          type="circle"
          paint={{
            "circle-radius": 10,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",

            // make the color dynamic to more easily distinguish the robots
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "colorIndex"],
              0,
              "#38e917", // Green
              20,
              "#d51714", // Red
            ],
          }}
        />
      </Source>
    </>
  );
}

/** Our app entry point, the map */
export default function App() {
  return (
    <Map
      id="my-map"
      initialViewState={{
        longitude: -118.25,
        latitude: 34.035,
        zoom: 13,
      }}
      style={{ width: "100vw", height: "100vh" }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
    >
      <MapContent />
    </Map>
  );
}
