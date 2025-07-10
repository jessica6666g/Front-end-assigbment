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

// Function to set a cookie
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Function to get a cookie
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Language dictionary
const translations = {
    en: {
        "site-title": "Marvelous Malaysia",
        "blog-link": "Blog",
        "heritage-link": "Heritage & Culture",
        "eco-link": "Eco & Nature",
        "adventure-link": "Adventure & Entertainment",
        "shopping-link": "Shopping",
        "travelplan-link": "Travel Planning",
        "gallery-link":"Gallery",
        "hero-title": "Explore the Wonders of Malaysia",
        "hero-text": "Discover hidden gems, cultural heritage, and thrilling adventures.",
        "start-journey-link": "Start Plan Your Journey",
        "travel-themes": "Travel Themes.",
        "heritage-card": "Heritage And Culture",
        "heritage-desc": "Explore Malaysia's Rich Cultural Heritage and Historical sites.",
        "eco-card": "Eco and Nature",
        "eco-desc": "Discover breathtaking Natural landscapes and Eco-Tourism spots.",
        "adventure-card": "Adventure & Entertainment",
        "adventure-desc": "Experience thrilling adventures and exciting entertainment options.",
        "shopping-card": "Shopping",
        "shopping-desc": "Explore top shopping destinations and local markets in Malaysia.",
        "top-destinations-label": "Top Destinations",
        "most-visited": "Most Places Visited in Malaysia",
        "kl-destination": "Kuala Lumpur",
        "cameron-destination": "Cameron Highlands",
        "georgetown-destination": "George Town",
        "malacca-destination": "Malacca",
        "langkawi-destination": "Langkawi",
        "footer-title": "Marvelous Malaysia",
        "footer-desc": "Explore the Wonders of Malaysia",
        "footer-share-thoughts": "Feel Free to Share Your Thoughts",
        "footer-email": "MarvelousMsia@gmail.com",
        "footer-follow": "Follow us",
        "quick-link": "Quick Link",
        "footer-about-us": "About Us",
        "footer-contact-us": "Contact Us",
        "footer-privacy-policy": "Privacy Policy",
        "footer-help": "Help",
        "gallery-header":"gallery",
        "gallery-par":"Share Your Memories",
        "gallery-upload":"Upload Here",
        "select-language":"Choose Your Language",
    },
    ms:{
        "site-title": "Malaysia Hebat",
        "blog-link": "Blog",
        "heritage-link": "Warisan & Budaya",
        "eco-link": "Ekologi & Alam",
        "adventure-link": "Pengembaraan & Hiburan",
        "shopping-link": "Membeli-belah",
        "travelplan-link": "Perancangan Perjalanan",
        "gallery-link":"Galeri",
        "hero-title": "Jelajahi Keajaiban Malaysia",
        "hero-text": "Temui permata tersembunyi, warisan budaya, dan pengembaraan yang mendebarkan.",
        "start-journey-link": "Mula Rancangkan Pengembaraan Anda",
        "travel-themes": "Tema Perjalanan.",
        "heritage-card": "Warisan Dan Budaya",
        "heritage-desc": "Terokai Warisan Budaya dan Tapak Sejarah Malaysia.",
        "eco-card": "Ekologi dan Alam",
        "eco-desc": "Temui Landskap Alam yang Menakjubkan dan Tempat Eko-Pelancongan.",
        "adventure-card": "Pengembaraan & Hiburan",
        "adventure-desc": "Alami Pengembaraan yang Mendebarkan dan Pilihan Hiburan yang Menyeronokkan.",
        "shopping-card": "Membeli-belah",
        "shopping-desc": "Terokai Destinasi Membeli-belah Teratas dan Pasar Tempatan di Malaysia.",
        "top-destinations-label": "Destinasi Teratas",
        "most-visited": "Tempat Paling Kerap Dilawati di Malaysia",
        "kl-destination": "Kuala Lumpur",
        "cameron-destination": "Cameron Highlands",
        "georgetown-destination": "George Town",
        "malacca-destination": "Melaka",
        "langkawi-destination": "Langkawi",
        "footer-title": "Malaysia Hebat",
        "footer-desc": "Jelajahi Keajaiban Malaysia",
        "footer-share-thoughts": "Jangan Ragu untuk Berkongsi Pendapat Anda",
        "footer-email": "MarvelousMsia@gmail.com",
        "footer-follow": "Ikuti kami",
        "quick-link":"Pautan cepat",
        "footer-about-us": "Tentang Kami",
        "footer-contact-us": "Hubungi Kami",
        "footer-privacy-policy": "Dasar Privasi",
        "footer-help": "Bantuan",
        "gallery-header":"Galeri",
        "gallery-par":"Kongsi Kenangan Anda",
        "gallery-upload":"Muat Naik",
        "select-language":"Pilih Bahasa Anda ",
    },
    zh: {
        "site-title": "神奇的马来西亚",
        "blog-link": "博客",
        "heritage-link": "文化与传统",
        "eco-link": "生态与自然",
        "adventure-link": "冒险与娱乐",
        "shopping-link": "购物",
        "travelplan-link": "旅行规划",
        "gallery-link":"相册",
        "hero-title": "探索马来西亚的奇观",
        "hero-text": "发现隐藏的宝藏、文化遗产和惊险的冒险。",
        "start-journey-link": "开始计划您的旅程",
        "travel-themes": "旅行主题",
        "heritage-card": "文化与传统",
        "heritage-desc": "探索马来西亚丰富的文化遗产和历史遗迹。",
        "eco-card": "生态与自然",
        "eco-desc": "发现令人惊叹的自然景观和生态旅游景点。",
        "adventure-card": "冒险与娱乐",
        "adventure-desc": "体验惊险的冒险和激动人心的娱乐选项。",
        "shopping-card": "购物",
        "shopping-desc": "探索马来西亚的顶级购物目的地和当地市场。",
        "top-destinations-label": "热门目的地",
        "most-visited": "马来西亚最受欢迎的地方",
        "kl-destination": "吉隆坡",
        "cameron-destination": "金马仑高原",
        "georgetown-destination": "乔治镇",
        "malacca-destination": "马六甲",
        "langkawi-destination": "兰卡威",
        "footer-title": "神奇的马来西亚",
        "footer-desc": "探索马来西亚的奇观",
        "footer-share-thoughts": "随时分享您的想法",
        "footer-email": "MarvelousMsia@gmail.com",
        "footer-follow": "关注我们",
        "quick-link":"链接",
        "footer-about-us": "关于我们",
        "footer-contact-us": "联系我们",
        "footer-privacy-policy": "隐私政策",
        "footer-help": "帮助",
        "gallery-header":"相册",
        "gallery-par":"回忆里的风景",
        "gallery-upload":"上传",
        "select-language":"选择您的语言",
    }
};

// Function to check the language cookie and set the dropdown
function checkLanguageCookie() {
    const language = getCookie("selectedLanguage");
    if (language) {
        document.getElementById("language").value = language;
        translateContent(language);
    } else {
        translateContent('en'); // Default to English
    }
}

document.getElementById('language').addEventListener('change', function () {
    const selectedLanguage = this.value;
    console.log('Selected Language:', selectedLanguage); // Debugging
    setCookie('selectedLanguage', selectedLanguage, 30);
    translateContent(selectedLanguage);
});

// Function to translate the content
function translateContent(language) {
    document.getElementById("site-title").textContent = translations[language]["site-title"];
    document.getElementById("blog-link").textContent = translations[language]["blog-link"];
    document.getElementById("heritage-link").textContent = translations[language]["heritage-link"];
    document.getElementById("eco-link").textContent = translations[language]["eco-link"];
    document.getElementById("adventure-link").textContent = translations[language]["adventure-link"];
    document.getElementById("shopping-link").textContent = translations[language]["shopping-link"];
    document.getElementById("travelplan-link").textContent = translations[language]["travelplan-link"];
    document.getElementById("gallery-link").textContent = translations[language]["gallery-link"];
    document.getElementById("hero-title").textContent = translations[language]["hero-title"];
    document.getElementById("hero-text").textContent = translations[language]["hero-text"];
    document.getElementById("start-journey-link").textContent = translations[language]["start-journey-link"];
    document.getElementById("travel-themes").textContent = translations[language]["travel-themes"];
    document.getElementById("heritage-card").textContent = translations[language]["heritage-card"];
    document.getElementById("heritage-desc").textContent = translations[language]["heritage-desc"];
    document.getElementById("eco-card").textContent = translations[language]["eco-card"];
    document.getElementById("eco-desc").textContent = translations[language]["eco-desc"];
    document.getElementById("adventure-card").textContent = translations[language]["adventure-card"];
    document.getElementById("adventure-desc").textContent = translations[language]["adventure-desc"];
    document.getElementById("shopping-card").textContent = translations[language]["shopping-card"];
    document.getElementById("shopping-desc").textContent = translations[language]["shopping-desc"];
    document.getElementById("top-destinations-label").textContent = translations[language]["top-destinations-label"];
    document.getElementById("most-visited").textContent = translations[language]["most-visited"];
    document.getElementById("kl-destination").textContent = translations[language]["kl-destination"];
    document.getElementById("cameron-destination").textContent = translations[language]["cameron-destination"];
    document.getElementById("georgetown-destination").textContent = translations[language]["georgetown-destination"];
    document.getElementById("malacca-destination").textContent = translations[language]["malacca-destination"];
    document.getElementById("langkawi-destination").textContent = translations[language]["langkawi-destination"];
    document.getElementById("gallery-header").textContent = translations[language]["gallery-header"];
    document.getElementById("gallery-par").textContent = translations[language]["gallery-par"];
    document.getElementById("gallery-upload").textContent = translations[language]["gallery-upload"];
    document.getElementById("footer-title").textContent = translations[language]["footer-title"];
    document.getElementById("footer-desc").textContent = translations[language]["footer-desc"];
    document.getElementById("footer-share-thoughts").textContent = translations[language]["footer-share-thoughts"];
    document.getElementById("footer-email").textContent = translations[language]["footer-email"];
    document.getElementById("footer-follow").textContent = translations[language]["footer-follow"];
    document.getElementById("quick-link").textContent = translations[language]["quick-link"];
    document.getElementById("blog-link2").textContent = translations[language]["blog-link"];
    document.getElementById("heritage-link2").textContent = translations[language]["heritage-link"];
    document.getElementById("eco-link2").textContent = translations[language]["eco-link"];
    document.getElementById("adventure-link2").textContent = translations[language]["adventure-link"];
    document.getElementById("shopping-link2").textContent = translations[language]["shopping-link"];
    document.getElementById("travelplan-link2").textContent = translations[language]["travelplan-link"];
    document.getElementById("gallery-link2").textContent = translations[language]["gallery-link"];
    document.getElementById("footer-about-us").textContent = translations[language]["footer-about-us"];
    document.getElementById("footer-contact-us").textContent = translations[language]["footer-contact-us"];
    document.getElementById("footer-privacy-policy").textContent = translations[language]["footer-privacy-policy"];
    document.getElementById("footer-help").textContent = translations[language]["footer-help"];
    document.getElementById("select-language").textContent = translations[language]["select-language"];
}

// Event listener for language selector
document.getElementById('language').addEventListener('change', function () {
    const selectedLanguage = this.value;
    setCookie('selectedLanguage', selectedLanguage, 30);
    translateContent(selectedLanguage);
});
// Check for stored language preference on page load
window.onload=checkLanguageCookie();