export default function applyDijkstra(cityMap, startPoint) {
    console.log(startPoint)
    // Create an object to store the shortest distance from the start point to every end points
    let distances = {};
    let paths = [];

    // A set to keep track of all visited points
    let visitedPoints = new Set();

    // Get all the points of the city Map
    let points = Object.keys(cityMap);

    // Initially, set the shortest distance to every node as Infinity
    for (let point of points) {
        distances[point] = Infinity;
    }

    // The distance from the start point to itself is 0
    distances[startPoint] = 0;

    // And path is start point coordinates
    paths[startPoint] = startPoint;

    // Loop until all points are visited
    while (points.length) {
        // Sort points by distance and pick the closest unvisited one
        points.sort((a, b) => distances[a] - distances[b]);
        let closestPoint = points.shift();

        // Mark the chosen point as visited
        visitedPoints.add(closestPoint);

        // Iterate for each neighboring point of the current point
        for (let neighborPoint in cityMap[closestPoint]) {
            // If the neighbor hasn't been visited yet
            if (!visitedPoints.has(neighborPoint)) {
                // Calculate tentative distance to the neighboring node
                let newDistance = distances[closestPoint] + cityMap[closestPoint][neighborPoint].distance;

                // If the newly calculated distance is shorter than the previously known distance to this neighbor
                if (newDistance < distances[neighborPoint]) {
                    // Update the shortest distance to this neighbor
                    distances[neighborPoint] = newDistance;
                    paths[neighborPoint] = paths[closestPoint] + "->" + neighborPoint;
                }
            }
        }
    }

    // Return the shortest distance from the start points to all map points
    return {
        distances: distances,
        paths: paths
    }
}