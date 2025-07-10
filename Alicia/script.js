const bars=document.querySelector(".bar"),
close = document.querySelector(".close"),
menu=document.querySelector(".menu");

bars.addEventListener("click",()=>{
    menu.classList.add("active");
});

close.addEventListener("click",()=>{
    menu.classList.remove("active")
});

$(document).ready(function()
{
    const apiKey = 'dd683bd7c61e727c6a8d8db2d8ce3fed';
    const city = 'Kuala Lumpur';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    $.getJSON(url, function(data)
    {
        $('#temperature').text(`${data.main.temp} °C`);
    }).fail(function() 
    {s
        $('#temperature').text('Failed to retrieve data');
        $('#condition').text('Please try again later');
    });
});


// scroll to top function
window.onscroll = function() {
    scrollFunction();
};

function scrollFunction() {
    const scrollBtn = document.getElementById("scrollBtn");
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        scrollBtn.style.display = "block";
    } else {
        scrollBtn.style.display = "none";
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openVideo() {
    document.getElementById("hNc_videoPopup").style.display = "block";
}

function closeVideo() {
    document.getElementById("hNc_videoPopup").style.display = "none";
}

window.onclick = function(event) {
    if (event.target == document.getElementById("hNc_videoPopup")) {
        closeVideo();
    }
}

//heritage & culture - upcoming events (previous next button)
let currentPage = 1;
const eventsPerPage = 3;
const eventBoxes = document.querySelectorAll('.event-box');

function showPage(page) {
    const start = (page - 1) * eventsPerPage;
    const end = start + eventsPerPage;
    eventBoxes.forEach((box, index) => {
        box.style.display = (index >= start && index < end) ? 'flex' : 'none';
    });
}

function changePage(direction) {
    const totalPages = Math.ceil(eventBoxes.length / eventsPerPage);
    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    showPage(currentPage);
}

// Initial display
showPage(currentPage);

/*Show more button*/
function toggleText(button) {
    var overviewText = document.getElementById('overview-text');
    if (overviewText.style.maxHeight) {
        overviewText.style.maxHeight = null;
        button.textContent = 'Show More';
    } else {
        overviewText.style.maxHeight = overviewText.scrollHeight + 'px';
        button.textContent = 'Show Less';
    }
}



// Function to set a cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Function to get a cookie
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Function to change font size
function changeFontSize(change) {
    let fontSize = parseInt(getCookie("fontSize")) || 16; // Default size is 16px
    fontSize += change;
    const minFontSize = 10; 
    const maxFontSize = 24; 
    
    if (fontSize < minFontSize) fontSize = minFontSize;
    if (fontSize > maxFontSize) fontSize = maxFontSize;
    
    setCookie("fontSize", fontSize, 365);
    applyFontSize();
}

// Function to apply the font size
function applyFontSize() {
    const fontSize = getCookie("fontSize");
    if (fontSize) {
        document.documentElement.style.fontSize = fontSize + "px";
    }
}

// Apply font size on page load
window.onload = applyFontSize;



















