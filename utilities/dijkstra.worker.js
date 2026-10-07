import applyDijkstra from "./dijkstra.js";

function findNearestLocation(locations, distances) {
    let nearestLocation = undefined;
    let minDistance = Number.MAX_VALUE;
    for (let index = 0; index < locations.length; index++) {
        let location = locations.at(index);
        let distance = distances[location];
        if (distance < minDistance) {
            minDistance = distance;
            nearestLocation = location;
        }
    }
    return nearestLocation;
}

// Number of searched street segments sent to the map at once
const searchBatchSize = 20;

self.onmessage = (event) => {
    const {cityMap, locations} = event.data;

    try {
        let remaining = [...locations];
        const initPoint = remaining.shift();
        let startPoint = initPoint;
        const total = remaining.length + 1;

        for (let i = 0; i < total; i++) {
            let segments = [];
            const flushSegments = () => {
                if (segments.length > 0) {
                    self.postMessage({type: "search", segments});
                    segments = [];
                }
            };

            const dijkstra = applyDijkstra(cityMap, startPoint, {
                targets: remaining.length === 0 ? [initPoint] : remaining,
                onVisit: (point, previousPoint) => {
                    segments.push([previousPoint.split(","), point.split(",")]);
                    if (segments.length >= searchBatchSize) {
                        flushSegments();
                    }
                }
            });
            flushSegments();
            const destinationPoint = remaining.length === 0 ? initPoint
                : findNearestLocation(remaining, dijkstra.distances);

            const path = [];
            String(dijkstra.paths[destinationPoint]).split("->")
                .forEach((coordinate) => {
                    path.push(coordinate.split(","));
                });

            startPoint = destinationPoint;
            remaining = remaining.filter(location => location !== destinationPoint);

            self.postMessage({type: "leg", path});
        }

        self.postMessage({type: "done"});
    } catch (error) {
        self.postMessage({type: "error", message: error.message});
    }
};
