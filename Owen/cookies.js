function setCookie(key, value, days) {
    var expires = "";

    if (days > 0) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "expires=" + date.toUTCString();
    }
    document.cookie = key + "=" + value + "; " + expires + "; path=/";
}

function getCookie(key) {
    var cname = key + "=";
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) == " ") {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(cname) == 0) {
            return cookie.substring(cname.length, cookie.length);
        }
    }
    return "";
}

function deleteCookie(key) {
    if (getCookie(key) != "") {
        document.cookie = key + "=; expires=Sat, 01 Jan 2000 00:00:00 UTC; path=/;";
    }
}

function checkCookie() {
    var username = getCookie("username");

    if (username != "") {
        window.alert("Welcome Back, " + username + "!");
    }
    else {
        username = window.prompt("Please enter your name:", "");
        setCookie("username", username, 7);
    }
}