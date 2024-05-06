import "./style.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import './utilities/roads.js'
import {findNearestRoad, graph, roads} from "./utilities/roads.js";
import MicroModal from 'micromodal';

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

roads.forEach(road => L.polyline(road, {
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

function triggerDijkstraWorker(currentLocation, i) {
    return new Promise((resolve, ignore) => {

        dijkstraWorker.postMessage(
            {
                cityMap: graph,
                start: currentLocation
            }
        );
        dijkstraWorker.onmessage = function (e) {
            let dijkstra = e.data;

            let nextLocation = findNearestLocation(locations, dijkstra.distances);
            let path = [];
            String(dijkstra.paths[nextLocation]).split("->")
                .forEach((coordinate) => {
                    path.push(coordinate.split(","));
                })
     //        console.log(`
     // index:  ${i}
     // locations:  ${locations}
     // currentLocation:  ${currentLocation}
     // nextLocation: ${nextLocation}
     // path: ${path}
     //    `)
            L.polyline(path,
                {
                    color: 'red',
                    weight: 3,
                    smoothFactor: 1
                }).addTo(map);
            currentLocation = nextLocation;
            locations = locations.filter(location => location !== nextLocation);
            resolve();
        }
    })
}

async function generateRoute() {
    let currentLocation = locations.shift();
    for (let i = 1; i <= customerLimit; i++) {
        await triggerDijkstraWorker(currentLocation, i);
    }
}

const dijkstraWorker = new Worker('./dijkstra.js');


document.getElementById("next-2").addEventListener("click", function () {
    closeModal('modal-2');
    map.on("click", (event) => {
        if (locations.length === customerLimit + 1) {
            map.off('click');
            generateRoute()
                .then(() => {
                    console.log("Successfully generated routes");
                });
            return;
        }

        let currentNode = [event.latlng.lat, event.latlng.lng];
        let nearestNode = findNearestRoad(currentNode);
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

