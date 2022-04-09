
document.addEventListener("load", loaded)

function loaded() {
    console.log("loaded")
    let listParentDiv = document.getElementsById("listParentDiv")
    listParentDiv.innerHTML = "hello there"
}
