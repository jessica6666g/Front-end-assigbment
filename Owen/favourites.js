function toggleFavourite(sectionID, buttonID) {
    var favourites = JSON.parse(localStorage.getItem("favourites")) || [];

    if (favourites.includes(sectionID)) {
        favourites = favourites.filter((item) => {
            item != sectionID;
        });
        document.getElementById(buttonID).classList.remove("favourite");
    }
    else {
        favourites.push(sectionID);
        document.getElementById(buttonID).classList.add("favourite");
    }
    localStorage.setItem("favourites", JSON.stringify(favourites));
}

function initializeFavourite() {
    var favButtons = Array.from(document.getElementsByClassName("fa-heart"));
    var favourites = JSON.parse(localStorage.getItem("favourites")) || [];

    for (var i = 0; i < favButtons.length; i++) {
        let id = favButtons[i].id;
        let sectionID = "section" + id.charAt(id.length - 1);

        if (favourites.includes(sectionID)) {
            favButtons[i].classList.add("favourite");
        }
    }
}