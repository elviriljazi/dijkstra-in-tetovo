export function loadData() {
    let streets = [];
    let cityMap = {};
    let fetchData = fetch('./roads.geojson')
        .then(res => res.json());


    return Promise.resolve(fetchData).then(result => {
        let coordinateCount = 0;
        result.features.forEach(feature => {
            if (feature.properties.highway !== 'secondary'
                && feature.properties.highway !== 'residential'
                && feature.properties.highway !== 'tertiary'
            ) {
                return;
            }
            let coordinates = feature.geometry.coordinates;
            coordinateCount += coordinates.length;
            coordinates.forEach(coordinate => coordinate.reverse())

            coordinates.forEach((coordinate, index) => {
                if (index === feature.geometry.coordinates.length - 1) {
                    return
                }
                let obj = {
                    nodeA: coordinate.join(","),
                    nodeB: coordinates[index + 1].join(",")
                }
                if (cityMap[obj.nodeA] === undefined) {
                    cityMap[obj.nodeA] = {};
                }
                if (cityMap[obj.nodeB] === undefined) {
                    cityMap[obj.nodeB] = {};
                }
                cityMap[obj.nodeA][obj.nodeB] = {
                    name: feature.properties.name,
                    surface: feature.properties.surface,
                    distance: getDistance(coordinate, coordinates[index + 1]),
                };
                cityMap[obj.nodeB][obj.nodeA] = {
                    name: feature.properties.name,
                    surface: feature.properties.surface,
                    distance: getDistance(coordinate, coordinates[index + 1]),
                };
                streets.push(obj)
            })
        });

        // console.log(cityMap)
        return {
            cityMap,
            streets
        }
    });
}

export function findNearestNode(streets, currentNode) {
    let nearestNode = undefined;
    let prevDistance = Number.MAX_VALUE;

    streets.forEach(road => {
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
