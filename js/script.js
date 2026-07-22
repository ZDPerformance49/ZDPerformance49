/*==================================================
 ZD PERFORMANCE49
 Fahrzeugdatenbank
==================================================*/

let fahrzeuge = [];

/* Elemente */
const suche = document.getElementById("searchInput");

const markeSelect = document.getElementById("marke");
const baureiheSelect = document.getElementById("baureihe");
const modellSelect = document.getElementById("modell");
const motorSelect = document.getElementById("motor");

const fahrzeugKarte = document.getElementById("vehicleCard");

/*==================================================
 DATEN LADEN
==================================================*/

async function ladeFahrzeuge() {

    try {

        const response = await fetch("data/fahrzeuge.json");

        fahrzeuge = await response.json();

        initialisiereMarken();

    } catch (error) {

        console.error("Fehler beim Laden:", error);

    }

}

/*==================================================
 START
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    ladeFahrzeuge();

});

/*==================================================
 MARKEN LADEN
==================================================*/

function initialisiereMarken() {

    const marken = [...new Set(fahrzeuge.map(f => f.marke))].sort();

    markeSelect.innerHTML = '<option value="">Marke wählen</option>';

    marken.forEach(marke => {

        const option = document.createElement("option");

        option.value = marke;
        option.textContent = marke;

        markeSelect.appendChild(option);

    });

}

/*==================================================
 BAUREIHEN LADEN
==================================================*/

markeSelect.addEventListener("change", () => {

    const marke = markeSelect.value;

    const baureihen = [...new Set(

        fahrzeuge
            .filter(f => f.marke === marke)
            .map(f => f.baureihe)

    )].sort();

    baureiheSelect.innerHTML =
        '<option value="">Baureihe wählen</option>';

    modellSelect.innerHTML =
        '<option value="">Modell wählen</option>';

    motorSelect.innerHTML =
        '<option value="">Motor wählen</option>';

    baureihen.forEach(baureihe => {

        const option = document.createElement("option");

        option.value = baureihe;
        option.textContent = baureihe;

        baureiheSelect.appendChild(option);

    });

});

/*==================================================
 MODELLE LADEN
==================================================*/

baureiheSelect.addEventListener("change", () => {

    const marke = markeSelect.value;
    const baureihe = baureiheSelect.value;

    const modelle = [...new Set(

        fahrzeuge
            .filter(f =>
                f.marke === marke &&
                f.baureihe === baureihe
            )
            .map(f => f.modell)

    )].sort();

    modellSelect.innerHTML =
        '<option value="">Modell wählen</option>';

    motorSelect.innerHTML =
        '<option value="">Motor wählen</option>';

    modelle.forEach(modell => {

        const option = document.createElement("option");

        option.value = modell;
        option.textContent = modell;

        modellSelect.appendChild(option);

    });

});

/*==================================================
 MOTOREN LADEN
==================================================*/

modellSelect.addEventListener("change", () => {

    const marke = markeSelect.value;
    const baureihe = baureiheSelect.value;
    const modell = modellSelect.value;

    const motoren = fahrzeuge.filter(f =>
        f.marke === marke &&
        f.baureihe === baureihe &&
        f.modell === modell
    );

    motorSelect.innerHTML =
        '<option value="">Motor wählen</option>';

    motoren.forEach(fahrzeug => {

        const option = document.createElement("option");

        option.value = fahrzeug.motor;

        option.textContent = fahrzeug.motor;

        motorSelect.appendChild(option);

    });

});

/*==================================================
 FAHRZEUG ANZEIGEN
==================================================*/

motorSelect.addEventListener("change", () => {

    const fahrzeug = fahrzeuge.find(f =>

        f.marke === markeSelect.value &&
        f.baureihe === baureiheSelect.value &&
        f.modell === modellSelect.value &&
        f.motor === motorSelect.value

    );

    if (!fahrzeug) return;

    zeigeFahrzeug(fahrzeug);

});

/*==================================================
 FAHRZEUGKARTE FÜLLEN
==================================================*/

function zeigeFahrzeug(fahrzeug){

    document.getElementById("vehicleImage").src =
        fahrzeug.bild;

    document.getElementById("vehicleTitle").textContent =
        fahrzeug.marke + " " + fahrzeug.modell;

    document.getElementById("vehicleMotor").textContent =
        fahrzeug.motor;

    document.getElementById("seriePs").textContent =
        fahrzeug.psSerie + " PS";

    document.getElementById("serieNm").textContent =
        fahrzeug.nmSerie + " Nm";

    document.getElementById("stagePs").textContent =
        fahrzeug.psStage1 + " PS";

    document.getElementById("stageNm").textContent =
        fahrzeug.nmStage1 + " Nm";

    document.getElementById("price").textContent =
        fahrzeug.preis;

    document.getElementById("hinweis").textContent =
        fahrzeug.hinweis || "";

    fahrzeugKarte.classList.add("active");

}

/*==================================================
 LIVE-SUCHE
==================================================*/

suche.addEventListener("input", () => {

    const suchtext = suche.value.trim().toLowerCase();

    if (suchtext.length < 2) {

        fahrzeugKarte.classList.remove("active");
        return;

    }

    const treffer = fahrzeuge.find(f => {

        return (

            f.marke.toLowerCase().includes(suchtext) ||
            f.baureihe.toLowerCase().includes(suchtext) ||
            f.modell.toLowerCase().includes(suchtext) ||
            f.motor.toLowerCase().includes(suchtext)

        );

    });

    if (treffer) {

        markeSelect.value = treffer.marke;

        markeSelect.dispatchEvent(new Event("change"));

        baureiheSelect.value = treffer.baureihe;

        baureiheSelect.dispatchEvent(new Event("change"));

        modellSelect.value = treffer.modell;

        modellSelect.dispatchEvent(new Event("change"));

        motorSelect.value = treffer.motor;

        zeigeFahrzeug(treffer);

    } else {

        fahrzeugKarte.classList.remove("active");

    }

});

/*==================================================
 HILFSFUNKTIONEN
==================================================*/

function auswahlZuruecksetzen(abEbene) {

    switch (abEbene) {

        case "marke":

            baureiheSelect.innerHTML =
                '<option value="">Baureihe wählen</option>';

            modellSelect.innerHTML =
                '<option value="">Modell wählen</option>';

            motorSelect.innerHTML =
                '<option value="">Motor wählen</option>';

            break;

        case "baureihe":

            modellSelect.innerHTML =
                '<option value="">Modell wählen</option>';

            motorSelect.innerHTML =
                '<option value="">Motor wählen</option>';

            break;

        case "modell":

            motorSelect.innerHTML =
                '<option value="">Motor wählen</option>';

            break;

    }

    fahrzeugKarte.classList.remove("active");

}

/*==================================================
 EVENTS
==================================================*/

markeSelect.addEventListener("change", () => {

    auswahlZuruecksetzen("marke");

});

baureiheSelect.addEventListener("change", () => {

    auswahlZuruecksetzen("baureihe");

});

modellSelect.addEventListener("change", () => {

    auswahlZuruecksetzen("modell");

});

/*==================================================
 FEHLERBEHANDLUNG
==================================================*/

window.addEventListener("error", (event) => {

    console.error("JavaScript-Fehler:", event.message);

});

/*==================================================
 ENDE
==================================================*/

console.log("ZD PERFORMANCE49 Datenbank geladen.");
