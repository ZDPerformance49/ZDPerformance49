// ==============================
// ZDPerformance49 Build 003
// ==============================

// Header beim Scrollen

window.addEventListener("scroll", function () {

    const header = document.querySelector("header");

    if (window.scrollY > 50) {

        header.style.background = "rgba(0,0,0,.92)";
        header.style.padding = "0 7%";
        header.style.height = "75px";

    } else {

        header.style.background = "rgba(10,10,10,.55)";
        header.style.height = "90px";

    }

});

// Scroll Animation

const observer = new IntersectionObserver((entries)=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.classList.add("show");

}

});

});

document.querySelectorAll(".leistung,.about,.cta,.datenbank").forEach(el=>{

el.classList.add("hidden");

observer.observe(el);

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
