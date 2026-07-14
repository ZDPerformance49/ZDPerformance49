// ==========================================
// ZD PERFORMANCE49
// Version 1.0
// ==========================================

// Header beim Scrollen

const header = document.querySelector("header");

window.addEventListener("scroll", () => {

    if(window.scrollY > 40){

        header.style.background="rgba(0,0,0,.92)";
        header.style.height="75px";
        header.style.boxShadow="0 10px 30px rgba(0,0,0,.35)";

    }

    else{

        header.style.background="rgba(0,0,0,.45)";
        header.style.height="90px";
        header.style.boxShadow="none";

    }

});


// Smooth Scroll

document.querySelectorAll('a[href^="#"]').forEach(anchor=>{

anchor.addEventListener("click",function(e){

e.preventDefault();

const target=document.querySelector(this.getAttribute("href"));

if(target){

target.scrollIntoView({

behavior:"smooth"

});

}

});

});


// Scroll Animation

const observer=new IntersectionObserver((entries)=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.classList.add("show");

}

});

},{threshold:.15});

document.querySelectorAll(".card,.vehicle-card,.step,.contact-form").forEach(el=>{

el.classList.add("hidden");

observer.observe(el);

});


// Aktuelles Jahr im Footer

const copyright=document.querySelector(".copyright");

if(copyright){

copyright.innerHTML=`© ${new Date().getFullYear()} ZD PERFORMANCE49 · Alle Rechte vorbehalten.`;

}
// ==========================================
// Fahrzeugdaten laden
// ==========================================

let vehicles = [];

fetch("data/fahrzeuge.json")

.then(response => response.json())

.then(data=>{

vehicles=data;

});


// ==========================================
// Suche
// ==========================================

const searchInput=document.getElementById("searchInput");

const result=document.getElementById("vehicleResult");

if(searchInput){

searchInput.addEventListener("input",()=>{

const value=searchInput.value.toLowerCase().trim();

if(value.length<2){

result.innerHTML="";

return;

}

const vehicle=vehicles.find(v=>

v.name.toLowerCase().includes(value)

);

if(vehicle){

showVehicle(vehicle);

}

});

}


// ==========================================
// Fahrzeug anzeigen
// ==========================================

function showVehicle(vehicle){

result.innerHTML=`

<div class="vehicle-card">

<div class="vehicle-image">

<img src="${vehicle.image}" alt="${vehicle.name}">

</div>

<div class="vehicle-info">

<h2>${vehicle.name}</h2>

<p>${vehicle.series}</p>

<table>

<tr>

<td>Motor</td>

<td>${vehicle.engine}</td>

</tr>

<tr>

<td>Motorcode</td>

<td>${vehicle.enginecode}</td>

</tr>

<tr>

<td>Hubraum</td>

<td>${vehicle.displacement}</td>

</tr>

<tr>

<td>Steuergerät</td>

<td>${vehicle.ecu}</td>

</tr>

</table>

<div class="power-box">

<div class="power">

<h4>Serie</h4>

<h2>${vehicle.ps} PS</h2>

<p>${vehicle.nm} Nm</p>

</div>

<div class="arrow">

↓

</div>

<div class="power stage">

<h4>Stage 1</h4>

<h2>${vehicle.stageps} PS</h2>

<p>${vehicle.stagenm} Nm</p>

<span>+${vehicle.stageps-vehicle.ps} PS</span>

<span>+${vehicle.stagenm-vehicle.nm} Nm</span>

</div>

</div>

</div>

<div class="price-box">

<h3>Stage 1</h3>

<h1>${vehicle.price}</h1>

<p>Stage 2 auf Anfrage</p>

<a href="#kontakt">

TERMIN BUCHEN

</a>

</div>

</div>

`;

}
