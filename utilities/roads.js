let fetchData = fetch('./roads.geojson')
    .then(res => res.json());

export let roads = [];
Promise.resolve(fetchData).then(r => {
    r.features.forEach(feature => {
        if (feature.geometry === null) {
            return;
        }
        if (feature.properties.highway !== 'secondary'
            && feature.properties.highway !== 'residential'
            && feature.properties.highway !== 'tertiary'
        ) {
            return;
        }

        feature.geometry.coordinates.forEach(coordinate => coordinate.reverse())
        roads.push(feature.geometry.coordinates)

    });
});


export function getDistance(node1, node2) {
    let latDistance = node2[0] - node1[0];
    let longDistance = node2[1] - node1[1];
    return Math.sqrt(Math.pow(latDistance, 2) + Math.pow(longDistance, 2))
}
