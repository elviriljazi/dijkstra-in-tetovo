import "./style.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import './utilities/roads.js'
import {findNearestRoad, graph, roads} from "./utilities/roads.js";
import {applyDijkstra} from "./utilities/dijikstra.js";

let appNode = document.getElementById("app");
appNode.innerHTML = `
<div id="map"></div>
`;

const map = L.map("map", {
    // zoomControl: false,
    // scrollWheelZoom: false
}).setView([42.00460346805377, 20.966042350751334], 14.5);
// map.dragging.disable();


L.tileLayer("https://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution:
        '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


let greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

let blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

roads.forEach(road => L.polyline(road, {
        color: 'green',
        weight: 3,
        smoothFactor: 1
    }).addTo(map)
);


let locations = [];
map.on("click", (event) => {
    if (locations.length === 10) {
        map.off("click")
    }

    let currentNode = [event.latlng.lat, event.latlng.lng];
    let nearestNode = findNearestRoad(currentNode);
    L.polyline([
        currentNode,
        nearestNode
    ], {
        color: 'red',
        weight: 3,
        smoothFactor: 1
    }).addTo(map)

    if (locations.length === 0) {
        L.marker(currentNode, {icon: greenIcon})
            .addTo(map);
    } else if (locations.length <= 10) {
        L.marker(currentNode, {icon: blueIcon}).addTo(map)
    }
    locations.push(nearestNode);

    if (locations.length === 2) {
        applyDijkstra(graph, String(locations[0]), String(locations[1]), map)
    }
})





