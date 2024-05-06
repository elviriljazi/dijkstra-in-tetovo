let fetchData = fetch('./roads.geojson')
    .then(res => res.json());


export let roads = [];
export let graph = {};
Promise.resolve(fetchData).then(r => {
    r.features.forEach(feature => {
        if (feature.properties.highway !== 'secondary'
            && feature.properties.highway !== 'residential'
            && feature.properties.highway !== 'tertiary'
        ) {
            return;
        }
        let coordinates = feature.geometry.coordinates;
        coordinates.forEach(coordinate => coordinate.reverse())

        coordinates.forEach((coordinate, index) => {
            if (index === feature.geometry.coordinates.length - 1) {
                return
            }
            let obj = {
                nodeA: coordinate.join(","),
                nodeB: coordinates[index + 1].join(",")
            }
            if (graph[obj.nodeA] === undefined) {
                graph[obj.nodeA] = {};
            }
            if (graph[obj.nodeB] === undefined) {
                graph[obj.nodeB] = {};
            }
            graph[obj.nodeA][obj.nodeB] = {
                name: feature.properties.name,
                surface: feature.properties.surface,
                distance: getDistance(coordinate, coordinates[index + 1]),
            };
            graph[obj.nodeB][obj.nodeA] = {
                name: feature.properties.name,
                surface: feature.properties.surface,
                distance: getDistance(coordinate, coordinates[index + 1]),
            };
            roads.push(obj)
        })
    });

    // console.log(graph)
});

export function findNearestRoad(currentNode) {
    let nearestNode = undefined;
    let prevDistance = Number.MAX_VALUE;

    roads.forEach(road => {
        let distance = getDistance(currentNode, road.nodeA.split(","))
        if (distance < prevDistance) {
            prevDistance = distance;
            nearestNode = road.nodeA.split(",");
        }
    })
    return nearestNode;
}

export function getDistance(node1, node2) {
    let latDistance = node2[0] - node1[0];
    let longDistance = node2[1] - node1[1];
    return Math.sqrt(Math.pow(latDistance, 2) + Math.pow(longDistance, 2))
}
