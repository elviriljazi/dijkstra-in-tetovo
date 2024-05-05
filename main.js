import "./style.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import './utilities/roads.js'
import {getDistance, roads} from "./utilities/roads.js";

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

roads.forEach(road => L.polyline(road, {
        color: 'green',
        weight: 3,
        smoothFactor: 1
    }).addTo(map)
);

function findShortestPath(locations, map) {

}

function findNearestNode(currentNode) {
    let nearestNode = null;
    let prevDistance = Number.MAX_VALUE;
    roads.forEach(road => {
        road.forEach((node) => {
            let distance = getDistance(currentNode, node)
            if (distance < prevDistance) {
                prevDistance = distance;
                nearestNode = node;
            }
        })
    })
    return nearestNode;
}


let locations = [];
map.on("click", (event) => {
    let currentNode = [event.latlng.lat, event.latlng.lng];
    let nearestNode = findNearestNode(currentNode);
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
        L.marker(currentNode).addTo(map)
    } else {
        map.off("click")
    }

    if (locations.length === 2) {
        findShortestPath(locations, map);
    }
    locations.push(currentNode);
})





