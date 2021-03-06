class Location {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toString() {
        return '{' + this.x.toString() + ', ' + this.y.toString() + '}';
    }
}

class TriMesh {
    vertices = new Array();
    midpoints = new Array();

    midpointFrom(loc1, loc2) {
        return new Location((loc1.x + loc2.x) / 2, (loc1.y + loc2.y) / 2);
    }

    genMidpoints() {
        // create array of midpoints
        let midpoints = new Array();
        midpoints.push(this.midpointFrom(this.vertices[0], this.vertices[1]));
        midpoints.push(this.midpointFrom(this.vertices[1], this.vertices[2]));
        midpoints.push(this.midpointFrom(this.vertices[0], this.vertices[2]));
        return midpoints;
    }

    genSegments() {
        let segments = new Array();
        segments.push([this.vertices[0], this.vertices[1]]);
        segments.push([this.vertices[1], this.vertices[2]]);
        segments.push([this.vertices[0], this.vertices[2]]);
        return segments;
    }

    has(loc) {
        for (const vtx of this.vertices) {
            if (locsMatch(vtx, loc)) { return true; }
        }
        return false;
    }

    toString() {
        let str = new String();
        str += '{';
        str += arrCString(this.vertices);
        //str += ', ';
        //str += arrCString(this.midpoints);
        str += '}\n';
        return str;
    }
}

class Graph {
    nodes = new LocationMap();
    meshes = new Array();
    boundaries = new Array();
    inside_edges = new Array();

    clone() {
        var cpy = new Graph();
        cpy.nodes = this.nodes.clone();
        cpy.meshes = this.meshes.slice();
        return cpy;
    }

    addLoc(loc, nbor) {
        // if vertex is already in the map, access it and add neighbor to its neighbors
        if (this.nodes.has(loc)) {
            let nbors = this.nodes.get(loc).slice();
            let nborInNbors = false;
            nbors.forEach(function(itm) {
                nborInNbors = nborInNbors || locsMatch(itm, nbor);
            });
            if (!nborInNbors) {
                nbors.push(nbor);
                this.nodes.set(loc, nbors);
            }
        } else {
            // else add vertex to map and create new array with neighbor
            this.nodes.set(loc, Array.from([nbor]));
        }
    }

    addVertex(vtx, nbor) {
        // kludge that I might have to resolve later:
        if (locsMatch(vtx, nbor)) return;
        this.addLoc(vtx, nbor);
        this.addLoc(nbor, vtx);
    }

    removeNeighbor(loc, nbor) {
        if (this.nodes.has(loc)) {
            let idx = indexOfLoc(nbor, this.nodes.get(loc));
            if (idx != -1) {
                let nbors = this.nodes.get(loc).slice();
                nbors.splice(idx, 1);
                if (nbors.length == 0) {
                    this.nodes.delete(loc);
                } else {
                    this.nodes.set(loc, nbors);
                }
            }
        }
    }

    removeMeshNeighbors(mesh) {
        this.removeNeighbor(mesh.vertices[0], mesh.vertices[1]);
        this.removeNeighbor(mesh.vertices[0], mesh.vertices[2]);
        this.removeNeighbor(mesh.vertices[1], mesh.vertices[0]);
        this.removeNeighbor(mesh.vertices[1], mesh.vertices[2]);
        this.removeNeighbor(mesh.vertices[2], mesh.vertices[0]);
        this.removeNeighbor(mesh.vertices[2], mesh.vertices[1]);
    }

    genMidpoints() {
        // generate all possible midpoints -> store in hash map
        let midpointMap = new LocationMap();
        this.meshes.forEach(function(mesh) {
            let midpoints = mesh.genMidpoints();
            midpoints.forEach(function(point) {
                if (midpointMap.has(point)) {
                    midpointMap.set(point, midpointMap.get(point) + 1);
                } else {
                    midpointMap.set(point, 1);
                }
            });
        });
        // go through meshes -> store only midpoints that show up more than once
        for (const mesh of this.meshes) {
            let midpoints = mesh.genMidpoints();
            for (const point of midpoints) {
                if (midpointMap.get(point) > 1) {
                    // connect midpoints to mesh nodes
                    for (const itm of mesh.midpoints) {this.addVertex(point, itm);}
                    mesh.midpoints.push(point);
                    this.addVertex(point, mesh.vertices[0]);
                    this.addVertex(point, mesh.vertices[1]);
                    this.addVertex(point, mesh.vertices[2]);
                }
            }
        }
    }

    genEdges() {
        let segmentMap = new SegmentMap();
        for (const mesh of this.meshes) {
            let segments = mesh.genSegments();
            for (const segment of segments) {
                if (segmentMap.has(segment)) {
                    segmentMap.set(segment, segmentMap.get(segment) + 1);
                } else {
                    segmentMap.set(segment, 1);
                }
            }
        }
        for (const pair of segmentMap.segmentPairs) {
            if (pair[1] == 1) this.boundaries.push(pair[0]);
            else this.inside_edges.push(pair[0]);
        }
    }

    deleteMeshesWith(loc) {
        var remainingMeshes = new Array();
        for (const mesh of this.meshes) {
            if (!mesh.has(loc)) {
                remainingMeshes.push(mesh);
            } else {
                this.removeMeshNeighbors(mesh);
            }
        }
        this.meshes = remainingMeshes;
    }
}

class LocationMap {
    locPairs = new Array();

    clone() {
        var cpy = new LocationMap();
        cpy.locPairs = this.locPairs.slice();
        return cpy;
    }

    has(point) {
        var cond = false;
        this.locPairs.forEach(function(pair) {
            if (locsMatch(pair[0], point)) cond = true;
        });
        return cond;
    }

    get(point) {
        var val = undefined;
        this.locPairs.forEach(function(pair) {
            if (locsMatch(pair[0], point)) val = pair[1];
        });
        return val;
    }

    set(point, val) {
        for (const pair of this.locPairs) {
            if (locsMatch(pair[0], point)) {
                let newPair = [point, val];
                this.locPairs[this.locPairs.indexOf(pair)] = newPair;
                return
            }
        }
        this.locPairs.push([point, val]);
    }

    delete(point) {
        for (var i = 0; i < this.locPairs.length; i++) {
            if (locsMatch(this.locPairs[i][0], point)) {
                this.locPairs.splice(i, 1);
                return true;
            }
        }
        return false;
    }
}

// segment:
//  pair of locations
//  which is just a length two array of locations
function segmentsMatch(seg1, seg2) {
    if ((locsMatch(seg1[0], seg2[0]) && locsMatch(seg1[1], seg2[1]))
        || (locsMatch(seg1[0], seg2[1]) && locsMatch(seg1[1], seg2[0]))) return true;
    return false;
}

class SegmentMap {
    segmentPairs = new Array();

    has(segment) {
        var cond = false;
        this.segmentPairs.forEach(function(pair) {
            if (segmentsMatch(pair[0], segment)) cond = true;
        });
        return cond;
    }

    get(segment) {
        var val = undefined;
        this.segmentPairs.forEach(function(pair) {
            if (segmentsMatch(pair[0], segment)) val = pair[1];
        });
        return val;
    }

    set(segment, val) {
        for (const pair of this.segmentPairs) {
            if (segmentsMatch(pair[0], segment)) {
                let newPair = [segment, val];
                this.segmentPairs[this.segmentPairs.indexOf(pair)] = newPair;
                return
            }
        }
        this.segmentPairs.push([segment, val]);
    }

    delete(segment) {
        for (var i = 0; i < this.segmentPairs.length; i++) {
            if (segmentsMatch(this.segmentPairs[i][0], segment)) {
                this.segmentPairs.splice(i, 1);
                return true;
            }
        }
        return false;
    }
}

var graph = new Graph();
var tempMesh = new TriMesh();
var locations = new Array();

var reader = new FileReader();
var ctx = document.getElementById('bbmap').getContext('2d');
ctx.imageSmoothingEnabled = false;

var canvasFunc;

var img = new Image();
reader.onload = function(e) {
    img.src = e.target.result;
    img.onload = function() {
        ctx.drawImage(img, 0, 0, 640, 400);
    };
};

function getOffsetLoc(e) {
    let x = e.offsetX - 1;
    let y = e.offsetY - 3;
    if (x < 0) x = 0;
    if (y < 0) x = 0;
    x = x - (x % 2);
    y = y - (y % 2);
    return new Location(x, y);
}

function locsMatch(loc1, loc2) { return loc1.y == loc2.y && loc1.x == loc2.x; }

function indexOfLoc(loc, list) {
    for (var i = 0; i < list.length; i++) {
        if (locsMatch(loc, list[i])) { return i; }
    }
    return -1;
}

function addLocation(e) {
    let loc = getOffsetLoc(e);
    locations.push(loc);
}

function selectLocation(loc) {
    let sel = -1;
    locations.forEach(function(itm, idx) {
        if ((loc.x <= itm.x + 2 && loc.x >= itm.x - 2) && (loc.y >= itm.y - 2 && loc.y <= itm.y + 2)) {
            sel = idx; return;
        }
    });
    return sel;
}

function removeLocation(e) {
    let idx = selectLocation(getOffsetLoc(e));
    if (idx != -1) {
        let loc = locations[idx];
        graph.deleteMeshesWith(loc);
        locations.splice(idx, 1);
    }
}

function checkTempMesh(loc) {
    let alreadyPresent = false;
    if (tempMesh.vertices[0]) {
        let loc1 = tempMesh.vertices[0];
        alreadyPresent = alreadyPresent || locsMatch(loc, loc1);
    }
    if (tempMesh.vertices[1]) {
        let loc2 = tempMesh.vertices[1];
        alreadyPresent = alreadyPresent || locsMatch(loc, loc2);
    }
    return alreadyPresent;
}

function constructTriMesh(e) {
    let idx = selectLocation(getOffsetLoc(e));
    if (idx != -1) {
        var loc = locations[idx];
        if (checkTempMesh(loc)) return;
        tempMesh.vertices.push(loc);
        if (tempMesh.vertices.length == 2) {
            // add new vertex to mesh, connect vertex in mesh to new vertex as neighbor
            graph.addVertex(tempMesh.vertices[0], loc);
        } else if (tempMesh.vertices.length == 3) {
            // add new vertex to mesh, connect vertices in mesh to new vertex, save mesh in map, create new temp mesh
            graph.addVertex(tempMesh.vertices[0], loc);
            graph.addVertex(tempMesh.vertices[1], loc);
            graph.meshes.push(tempMesh);
            tempMesh = new TriMesh();
        }
    }
}

function calc_area(v1, v2, v3) {
    let det = 0;
    det = (
        (v1.x - v3.x) *
        (v2.y - v3.y)) - (
        (v2.x - v3.x) *
        (v1.y - v3.y));
    return Math.abs(det / 2);
}

function contains_point(mesh, loc) {
    var vertices = mesh.vertices;
    var total = calc_area(vertices[0], vertices[1], vertices[2]);
    var area1 = calc_area(loc, vertices[1], vertices[2]);
    var area2 = calc_area(loc, vertices[0], vertices[2]);
    var area3 = calc_area(loc, vertices[0], vertices[1]);

    return (area1 + area2 + area3) <= total
}

function destroyTriangle(e) {
    let loc = getOffsetLoc(e);
    // see if click is inside triangle
    // if it is, delete that mesh
    graph.meshes.forEach(function(itm, idx) {
        if (contains_point(itm, loc)) {
            graph.removeMeshNeighbors(itm);
            graph.meshes.splice(idx, 1);
            return;
        }
    });
}

function readImage(input) {
    if (input.files && input.files[0]) {
        reader.readAsDataURL(input.files[0]);
    }
}

function setImage() { readImage(document.querySelector('input[type="file"]')); }

function drawDots(arr) {
    arr.forEach(function(itm) {
        ctx.fillRect(itm.x - 3, itm.y, 4, 4);
    });
}

function canvasClick(e) {
    if (canvasFunc) canvasFunc(e);
    updateCanvas();
}

function updateCanvas() {
    // clear everything
    ctx.clearRect(0, 0, 640, 400);
    // draw image
    if (img) ctx.drawImage(img, 0, 0, 640, 400);
    // draw meshes
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    graph.meshes.forEach(function(itm) {
        // first vertex
        ctx.beginPath();
        ctx.moveTo(itm.vertices[0].x, itm.vertices[0].y);
        // second vertex
        ctx.lineTo(itm.vertices[1].x, itm.vertices[1].y);
        // third vertex
        ctx.lineTo(itm.vertices[2].x, itm.vertices[2].y);
        ctx.fill();
    });
    // draw locations array
    ctx.fillStyle = 'red';
    drawDots(locations);
    // draw any locations in tempmesh as green
    ctx.fillStyle = 'lime';
    drawDots(tempMesh.vertices);
}

function selectButton(btn) {
    if (document.getElementById('selected-btn'))
        document.getElementById('selected-btn').id = null;
    btn.id = 'selected-btn';
}

function setAddVertex(e) {
    selectButton(e.target);
    canvasFunc = addLocation;
}

function setRemoveVertex(e) {
    selectButton(e.target);
    canvasFunc = removeLocation;
}

function setCreateTriangle(e) {
    selectButton(e.target);
    canvasFunc = constructTriMesh;
}

function setDestroyTriangle(e) {
    selectButton(e.target);
    canvasFunc = destroyTriangle;
}

function arrArrCString(arr) {
    let str = '{';
    if (arr[0]) str += '{' + arr[0].toString() + '}';
    arr.forEach(function(itm, idx) {
        if (idx > 0) str += ', ' + '{' + itm.toString() + '}';
    });
    str += '}';
    return str;
}

function arrCString(arr) {
    let str = '{';
    if (arr[0]) str += arr[0].toString();
    arr.forEach(function(itm, idx) {
        if (idx > 0) str += ', ' + itm.toString();
    });
    str += '}';
    return str;
}

function exportJSON() {
    var jsonString = JSON.stringify({graph, locations});
    window.open(URL.createObjectURL(new Blob([jsonString], {type : 'application/json'})));
}

var jsonReader = new FileReader();

jsonReader.onload = function(e) {
    locations = new Array();
    for (const loc of JSON.parse(e.target.result).locations) {
        locations.push(new Location(loc.x, loc.y));
    }
    graph = new Graph();
    jsonGraph = JSON.parse(e.target.result).graph;
    // create a new Location with the LocationMap first pair member, copy over second member
    for (const pair of jsonGraph.nodes.locPairs) {
        let nbors = new Array();
        for (const loc of pair[1]) {
            nbors.push(new Location(loc.x, loc.y));
        }
        graph.nodes.locPairs.push([new Location(pair[0].x, pair[0].y), nbors]);
    }

    for (const mesh of jsonGraph.meshes) {
        // fill out a new mesh here
        let newMesh = new TriMesh();
        for (const vtx of mesh.vertices) {
            newMesh.vertices.push(new Location(vtx.x, vtx.y));
        }
        graph.meshes.push(newMesh);
    }
    updateCanvas();
};

function readJSON(input) {
    if (input.files && input.files[0]) {
        jsonReader.readAsText(input.files[0]);
    }
}

function importJSON() { readJSON(document.querySelector('#import-json')); }

// exporting graph data:
// straightforward approach for now - only export Graph struct, save it all as literals
// don't really need references to individual locations
// later: figure out logic for how midpoints will be generated
// idea: create new graph for export with all the midpoints
//   will have to connect each midpoint to all the other midpoints and vertices in the mesh
// idea to generate less superfluous midpoints: only generate midpoints that match for more than one mesh
//   can be implemented simply by adding all midpoints to a map and checking for any doubles
function exportData() {
    var dataString = new String();
    var exportGraph = graph.clone();
    exportGraph.genEdges();
    //exportGraph.genMidpoints();
    dataString += '#include "graph.h"\n\n';
    dataString += 'Graph exportedGraph {{\n';
    // location unordered map
    for (const pair of exportGraph.nodes.locPairs) {
        dataString += '{' + pair[0].toString() + ', ';
        dataString += arrCString(pair[1]);
        dataString += '},\n';
    }
    dataString += '},\n';
    // graph mesh array
    dataString += arrCString(exportGraph.meshes);
    dataString += ',\n';
    // boundaries array
    dataString += arrArrCString(exportGraph.boundaries);
    dataString += ',\n';
    // edges array
    dataString += arrArrCString(exportGraph.inside_edges);
    dataString += '\n};'
    window.open(URL.createObjectURL(new Blob([dataString], {type : 'text/plain'})));
}
