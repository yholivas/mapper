const loc = {x: 0, y: 0};
var locations = [loc]

function addLocation(x, y) {
    let loc = {x: x, y: y};
    locations.push(loc);
    let printedList = "";
    locations.forEach(
        function(item, index, array) {
            printedList += item.x.toString() + item.y.toString()
        }
    );
    document.getElementById("locations").textContent = printedList;
}
