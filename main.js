import "./style.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import './utilities/streets.js'
import {findNearestNode, loadData} from "./utilities/streets.js";
import MicroModal from 'micromodal';
import applyDijkstra from "./utilities/dijkstra.js";
import {loading} from "./utilities/common.js";
import {blueIcon, greenIcon} from "./utilities/markers.js";

const customerLimit = 10;
let data = await loadData();


const map = L.map("map", {
    // zoomControl: false,
    // scrollWheelZoom: false
}).setView([42.00460346805377, 20.966042350751334], 14.5);
// map.dragging.disable();


L.tileLayer("https://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution:
        '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

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

async function generateRoute() {
    return new Promise(async (resolve, reject) => {
        let initPoint = locations.shift();
        let startPoint = initPoint;
        for (let i = 0; i <= customerLimit; i++) {
            let start = Date.now();
            let dijkstra = applyDijkstra(data.cityMap, startPoint);
            let destinationPoint = locations.length === 0
                ? initPoint :
                findNearestLocation(locations, dijkstra.distances);
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

            startPoint = destinationPoint;
            locations = locations.filter(location => location !== destinationPoint);

            L.polyline(path,
                {
                    color: colors[i],
                    weight: 3,
                    smoothFactor: 1
                }).addTo(map)
            console.log(`%c route ${i}  ${(Date.now() - start)}`, `color: ${colors[i]}`);
            resolve();
        }
    })
}

let colors = [
    'red',
    'blue',
    'green',
    'orange',
    'purple',
    'tomato',
    'red',
    'blue',
    'green',
    'orange',
    'purple',
    'tomato',
]

generateRandomLocations()

function generateRandomLocations() {
    let startX = 20.96,
        endX = 20.98,
        startY = 42,
        endY = 42.01;
    let deltaX = endX - startX;
    let deltaY = endY - startY;
    for (let i = 0; i < 11; i++) {
        let lang = startY + Math.random() * deltaY;
        let long = startX + Math.random() * deltaX;
        addLocation([lang, long]);
    }
    loading(true);
    let route = generateRoute();
    route.then(() => {
        loading(false)
    })
}


// let selectedMethod;
// document.getElementById('shorter').addEventListener("click", () => {
//     selectedMethod = 'shorter'
//     closeModal("modal-2")
//     showModal("modal-3")
//     document.getElementById('shorter').removeEventListener("click", () => {
//     })
// });
//
// document.getElementById('faster').addEventListener("click", () => {
//     selectedMethod = 'faster'
//     closeModal("modal-2")
//     showModal("modal-3")
//     document.getElementById('faster').removeEventListener("click", () => {
//     })
// });

function addLocation(currentNode) {
    console.log(currentNode)
    let nearestNode = findNearestNode(data.streets, currentNode);
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
        L.marker(currentNode, {
            icon: greenIcon
        }).addTo(map);
    } else if (locations.length <= customerLimit) {

        L.marker(currentNode, {icon: blueIcon})
            .bindTooltip(String.fromCharCode(64 + locations.length), {
                permanent: true,
                direction: 'left',
                className: 'my-labels'
            })
            .addTo(map)
    }
    locations.push(nearestNode);
}

document.getElementById("next-3").addEventListener("click", () => {
    closeModal('modal-3');

})

map.on("click", (event) => {
    if (locations.length !== customerLimit + 1) {
        addLocation([event.latlng.lat, event.latlng.lng]);
    } else {
        map.off('click');
        loading(true);
        let route = generateRoute();
        route.then(() => {
            loading(false)
        })
    }
})

MicroModal.init();
// showModal('modal-1');

document.getElementById("next-1")
    .addEventListener('click', () => {
        closeModal('modal-1');
        showModal('modal-3');

        // showModal('modal-2');
    })

