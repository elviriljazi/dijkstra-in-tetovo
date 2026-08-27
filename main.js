import "./style.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-polylinedecorator";
import './utilities/streets.js'
import {findNearestNode, loadData} from "./utilities/streets.js";
import MicroModal from 'micromodal';
import {loading, updateProgress} from "./utilities/common.js";
import {blueIcon, greenIcon} from "./utilities/markers.js";
import RouteWorker from "./utilities/dijkstra.worker.js?worker";

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

function drawRouteLeg(path) {
    let polyline = L.polyline(path, {
        color: 'red',
        weight: 3,
        smoothFactor: 1
    }).addTo(map);

    L.polylineDecorator(polyline, {
        patterns: [
            {
                offset: '5%',
                repeat: '8%',
                symbol: L.Symbol.arrowHead({
                    pixelSize: 10,
                    polygon: false,
                    pathOptions: {stroke: true, color: 'red', weight: 2}
                })
            }
        ]
    }).addTo(map);
}

function generateRoute() {
    return new Promise((resolve, reject) => {
        let worker = new RouteWorker();

        worker.onmessage = (event) => {
            let message = event.data;
            switch (message.type) {
                case 'leg':
                    drawRouteLeg(message.path);
                    break;
                case 'progress':
                    updateProgress(message.current, message.total);
                    break;
                case 'done':
                    worker.terminate();
                    resolve();
                    break;
                case 'error':
                    worker.terminate();
                    reject(new Error(message.message));
                    break;
            }
        };

        worker.onerror = (error) => {
            worker.terminate();
            reject(error);
        };

        worker.postMessage({cityMap: data.cityMap, locations});
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
    map.on("click", (event) => {
        if (locations.length !== customerLimit + 1) {
            addLocation([event.latlng.lat, event.latlng.lng]);
        } else {
            map.off('click');
            loading(true);
            generateRoute()
                .then(() => {
                    loading(false)
                })
                .catch((error) => {
                    console.error(error);
                    loading(false);
                })
        }
    })
})


MicroModal.init();
showModal('modal-1');

document.getElementById("next-1")
    .addEventListener('click', () => {
        closeModal('modal-1');
        showModal('modal-3');

        // showModal('modal-2');
    })

