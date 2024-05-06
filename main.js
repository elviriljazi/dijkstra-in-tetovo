import "./style.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import './utilities/streets.js'
import {findNearestNode, cityMap, streets} from "./utilities/streets.js";
import MicroModal from 'micromodal';
import applyDijkstra from "./utilities/dijkstra.js";

const customerLimit = 10;

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

streets.forEach(road => L.polyline(road, {
        color: 'green',
        weight: 3,
        smoothFactor: 1
    }).addTo(map)
);


let locations = [];

function showModal(modal) {
    MicroModal.show(modal);
}

function closeModal(modal) {
    MicroModal.close(modal);
}

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

let routes = [];

async function generateRoute() {
    let startPoint = locations.shift();
    for (let i = 1; i <= customerLimit; i++) {
        await new Promise((resolve, ignore) => {
            let dijkstra = applyDijkstra(cityMap, startPoint);
            let destinationPoint = findNearestLocation(locations, dijkstra.distances);
            let path = [];
            String(dijkstra.paths[destinationPoint]).split("->")
                .forEach((coordinate) => {
                    path.push(coordinate.split(","));
                })
            // console.log(`
            // index:  ${i}
            // locations:  ${locations}
            // startPoint:  ${startPoint}
            // destinationPoint: ${destinationPoint}
            // path: ${path}
            //    `)
            routes.push(path);
            startPoint = destinationPoint;
            locations = locations.filter(location => location !== destinationPoint);
            resolve();
        });


    }
}

document.getElementById("next-2").addEventListener("click", function () {
    closeModal('modal-2');
    map.on("click", (event) => {
        if (locations.length === customerLimit + 1) {
            map.off('click');
            generateRoute()
                .then(() => {
                    routes.forEach(route => {
                        setTimeout(() => {
                            L.polyline(route,
                                {
                                    color: 'red',
                                    weight: 3,
                                    smoothFactor: 1
                                }).addTo(map);
                        }, 700);
                    });


                })
            return;
        }

        let currentNode = [event.latlng.lat, event.latlng.lng];
        let nearestNode = findNearestNode(currentNode);
        L.polyline([
            currentNode,
            nearestNode
        ], {
            color: 'red',
            weight: 3,
            smoothFactor: 1,
            dashArray: '1, 5'
        }).addTo(map)

        if (locations.length === 0) {
            L.marker(currentNode, {icon: greenIcon})
                .addTo(map);
        } else if (locations.length <= customerLimit) {
            L.marker(currentNode, {icon: blueIcon}).addTo(map)
        }
        locations.push(nearestNode);
    })
})


MicroModal.init();
showModal('modal-1');

document.getElementById("next-1")
    .addEventListener('click', () => {
        closeModal('modal-1');
        showModal('modal-2');
    })

