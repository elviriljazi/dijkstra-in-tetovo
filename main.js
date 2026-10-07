import "./style.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-polylinedecorator";
import './utilities/streets.js'
import {findNearestNode, loadData} from "./utilities/streets.js";
import MicroModal from 'micromodal';
import {blueIcon, greenIcon} from "./utilities/markers.js";
import RouteWorker from "./utilities/dijkstra.worker.js?worker";

const customerLimit = 10;
// One color per route, reused from the start when there are more routes than colors
const routeColors = [
    '#e6194b',
    '#f58231',
    '#b8860b',
    '#3cb44b',
    '#008080',
    '#4363d8',
    '#911eb4',
    '#f032e6',
    '#800000',
    '#9a6324'
];
let routeCount = 0;
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

const legend = L.control({position: 'bottomright'});
legend.onAdd = () => {
    const container = L.DomUtil.create('div', 'legend');
    container.innerHTML = `
        <div class="legend__item">
            <svg class="legend__symbol" viewBox="0 0 30 20">
                ${routeColors.map((color, index) =>
                    `<line x1="${index * 3}" y1="10" x2="${index * 3 + 3}" y2="10" stroke="${color}" stroke-width="3"/>`
                ).join('')}
            </svg>
            <span>Route</span>
        </div>
        <div class="legend__item">
            <svg class="legend__symbol" viewBox="0 0 30 20">
                <polyline points="10,3 20,10 10,17" fill="none" stroke="#333" stroke-width="2"/>
            </svg>
            <span>Direction</span>
        </div>
        <div class="legend__item">
            <svg class="legend__symbol" viewBox="0 0 30 20">
                <line x1="2" y1="10" x2="28" y2="10" stroke="#00449e" stroke-width="2" stroke-opacity="0.6"/>
            </svg>
            <span>Searched streets</span>
        </div>
        <div class="legend__item">
            <svg class="legend__symbol" viewBox="0 0 30 20">
                <line x1="2" y1="10" x2="28" y2="10" stroke="red" stroke-width="3" stroke-dasharray="1, 5"/>
            </svg>
            <span>Nearest street</span>
        </div>
        <div class="legend__item">
            <img class="legend__symbol" src="${greenIcon.options.iconUrl}" alt="Green marker"/>
            <span>Warehouse</span>
        </div>
        <div class="legend__item">
            <img class="legend__symbol" src="${blueIcon.options.iconUrl}" alt="Blue marker"/>
            <span>Customer</span>
        </div>`;
    L.DomEvent.disableClickPropagation(container);
    return container;
};
legend.addTo(map);

let locations = [];

function showModal(modal) {
    MicroModal.show(modal);
}

function closeModal(modal) {
    MicroModal.close(modal);
}

const searchRenderer = L.canvas();
const searchLayer = L.layerGroup().addTo(map);

function drawSearch(segments) {
    L.polyline(segments, {
        renderer: searchRenderer,
        color: '#00449e',
        weight: 2,
        opacity: 0.6,
        interactive: false
    }).addTo(searchLayer);
}

function drawRouteLeg(path) {
    searchLayer.clearLayers();
    let color = routeColors[routeCount % routeColors.length];
    routeCount++;
    let polyline = L.polyline(path, {
        color: color,
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
                    pathOptions: {stroke: true, color: color, weight: 2}
                })
            }
        ]
    }).addTo(map);
}

function generateRoute() {
    return new Promise((resolve, reject) => {
        let worker = new RouteWorker();

        // Messages are drawn one search batch per frame, so the search stays visible as it advances
        let queue = [];
        let drawing = false;

        function drawQueue() {
            while (queue.length > 0) {
                let message = queue.shift();
                switch (message.type) {
                    case 'search':
                        drawSearch(message.segments);
                        requestAnimationFrame(drawQueue);
                        return;
                    case 'leg':
                        drawRouteLeg(message.path);
                        break;
                    case 'done':
                        resolve();
                        break;
                }
            }
            drawing = false;
        }

        worker.onmessage = (event) => {
            let message = event.data;
            if (message.type === 'error') {
                worker.terminate();
                queue = [];
                searchLayer.clearLayers();
                reject(new Error(message.message));
                return;
            }
            if (message.type === 'done') {
                worker.terminate();
            }
            queue.push(message);
            if (!drawing) {
                drawing = true;
                requestAnimationFrame(drawQueue);
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
            generateRoute()
                .catch((error) => {
                    console.error(error);
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

