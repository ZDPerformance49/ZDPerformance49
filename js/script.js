(() => {

    "use strict";


    /* ==================================================
       SEITE IMMER OBEN STARTEN
    ================================================== */

    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }


    if (window.location.hash) {

        history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}`
        );

    }


    window.addEventListener("pageshow", () => {
        window.scrollTo(0, 0);
    });


    window.addEventListener("load", () => {

        requestAnimationFrame(() => {
            window.scrollTo(0, 0);
        });

    });


    /* ==================================================
       EINSTELLUNGEN
    ================================================== */

    const DATA_ROOT = "data/";

    const DEFAULT_IMAGE = "images/logo.png";

    const WHATSAPP_NUMBER = "4954118551025";


    /*
        Dauer der PS-/Nm-Animation:
        1500 Millisekunden = 1,5 Sekunden
    */

    const PERFORMANCE_ANIMATION_DURATION = 3000;

    let performanceAnimationId = 0;


    /* ==================================================
       FESTES FAHRZEUGBILD JE MARKE
    ================================================== */

    const BRAND_IMAGES = {

        "audi":
            "images/brands/audi.png",

        "bmw":
            "images/brands/bmw.png",

        "mercedes":
            "images/brands/mercedes.png",

        "mercedes-benz":
            "images/brands/mercedes.png",

        "porsche":
            "images/brands/porsche.png",

        "seat":
            "images/brands/seat.png",

        "volkswagen":
            "images/brands/volkswagen.png",

        "vw":
            "images/brands/volkswagen.png",

        "skoda":
            "images/brands/skoda.png",

        "škoda":
            "images/brands/skoda.png",

        "cupra":
            "images/brands/cupra.png",

        "ford":
            "images/brands/ford.png",

        "opel":
            "images/brands/opel.png",

        "mini":
            "images/brands/mini.png",

        "hyundai":
            "images/brands/hyundai.png"

    };


    /* ==================================================
       FINDER STATUS
    ================================================== */

    const state = {

        brands: [],

        vehicles: [],

        brand: "",

        series: "",

        generation: "",

        selectedVehicle: null,

        currentStep: null

    };


    const elements = {};


    const stepConfig = {

        brand: {

            eyebrow: "SCHRITT 1 VON 4",

            prompt: "Welche Marke fährst du?",

            placeholder: "Marke suchen, z. B. Mercedes"

        },


        series: {

            eyebrow: "SCHRITT 2 VON 4",

            prompt: "Welche Modellreihe?",

            placeholder: "Modellreihe suchen, z. B. E-Klasse"

        },


        generation: {

            eyebrow: "SCHRITT 3 VON 4",

            prompt: "Welche Generation / Baureihe?",

            placeholder: "Generation suchen, z. B. W213"

        },


        engine: {

            eyebrow: "SCHRITT 4 VON 4",

            prompt: "Welche Motorisierung?",

            placeholder: "Motorisierung suchen, z. B. 3.0 TDI"

        }

    };


    /* ==================================================
       START
    ================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    async function init() {

        cacheElements();

        bindEvents();

        hideVehicleCard();

        await loadBrands();

    }


    /* ==================================================
       HTML-ELEMENTE LADEN
    ================================================== */

    function cacheElements() {

        elements.searchPanel =
            document.getElementById(
                "finderSearch"
            );


        elements.search =
            document.getElementById(
                "searchInput"
            );


        elements.reset =
            document.getElementById(
                "finderReset"
            );


        elements.eyebrow =
            document.getElementById(
                "finderEyebrow"
            );


        elements.prompt =
            document.getElementById(
                "finderPrompt"
            );


        elements.status =
            document.getElementById(
                "finderStatus"
            );


        elements.steps = {

            brand:
                document.getElementById(
                    "brandStep"
                ),

            series:
                document.getElementById(
                    "seriesStep"
                ),

            generation:
                document.getElementById(
                    "generationStep"
                ),

            engine:
                document.getElementById(
                    "engineStep"
                )

        };


        elements.options = {

            brand:
                document.getElementById(
                    "brandOptions"
                ),

            series:
                document.getElementById(
                    "seriesOptions"
                ),

            generation:
                document.getElementById(
                    "generationOptions"
                ),

            engine:
                document.getElementById(
                    "engineOptions"
                )

        };


        elements.summary = {

            brand:
                document.getElementById(
                    "brandSummary"
                ),

            series:
                document.getElementById(
                    "seriesSummary"
                ),

            generation:
                document.getElementById(
                    "generationSummary"
                ),

            engine:
                document.getElementById(
                    "engineSummary"
                )

        };


        elements.card =
            document.getElementById(
                "vehicleCard"
            );


        elements.image =
            document.getElementById(
                "vehicleImage"
            );


        elements.title =
            document.getElementById(
                "vehicleTitle"
            );


        elements.motorText =
            document.getElementById(
                "vehicleMotor"
            );


        elements.stockPs =
            document.getElementById(
                "seriePs"
            );


        elements.stockNm =
            document.getElementById(
                "serieNm"
            );


        elements.stagePs =
            document.getElementById(
                "stagePs"
            );


        elements.stageNm =
            document.getElementById(
                "stageNm"
            );


        elements.price =
            document.getElementById(
                "price"
            );


        elements.note =
            document.getElementById(
                "hinweis"
            );


        elements.whatsapp =
            document.getElementById(
                "vehicleWhatsapp"
            );

    }


    /* ==================================================
       EVENTS
    ================================================== */

    function bindEvents() {

        elements.search.addEventListener(
            "input",
            renderCurrentStep
        );


        elements.reset.addEventListener(
            "click",
            resetFinder
        );


        document
            .querySelectorAll("[data-edit]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        editStep(
                            button.dataset.edit
                        );

                    }
                );

            });


        document
            .querySelectorAll("[data-open-step]")
            .forEach(header => {

                header.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target.closest("button")
                        ) {
                            return;
                        }


                        openStepFromHeader(
                            header.dataset.openStep
                        );

                    }
                );


                header.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {

                            event.preventDefault();

                            openStepFromHeader(
                                header.dataset.openStep
                            );

                        }

                    }
                );

            });

    }


    /* ==================================================
       MARKEN LADEN
    ================================================== */

    async function loadBrands() {

        setStatus(
            "Marken werden geladen …"
        );


        try {

            const brands =
                await fetchJson(
                    `${DATA_ROOT}brands.json`
                );


            if (!Array.isArray(brands)) {

                throw new Error(
                    "brands.json enthält kein gültiges Array."
                );

            }


            state.brands =
                brands

                    .filter(
                        brand =>
                            brand &&
                            brand.aktiv !== false
                    )

                    .sort(
                        (a, b) =>
                            sortText(
                                a.name,
                                b.name
                            )
                    );


            prepareFinderClosed();


            setStatus(
                "Tippe auf „Marke“, um die Fahrzeugauswahl zu öffnen."
            );

        }

        catch (error) {

            console.error(
                "Marken konnten nicht geladen werden:",
                error
            );


            setStatus(
                "Datenbank konnte nicht geladen werden.",
                true
            );

        }

    }


    /* ==================================================
       AKTUELLEN SCHRITT ANZEIGEN
    ================================================== */

    function renderCurrentStep() {

        const query =
            normalizeText(
                elements.search.value
            );


        if (
            state.currentStep === "brand"
        ) {

            renderBrands(query);

        }


        else if (
            state.currentStep === "series"
        ) {

            renderSeries(query);

        }


        else if (
            state.currentStep === "generation"
        ) {

            renderGenerations(query);

        }


        else if (
            state.currentStep === "engine"
        ) {

            renderEngines(query);

        }

    }


    /* ==================================================
       MARKEN
    ================================================== */

    function renderBrands(
        query = ""
    ) {

        const options =
            state.brands

                .map(
                    brand => ({

                        value:
                            brand.name,

                        label:
                            brand.name,

                        meta:
                            "Marke",

                        search: [
                            brand.name,
                            brand.slug || ""
                        ].join(" ")

                    })
                )

                .filter(
                    option =>
                        matchesQuery(
                            option.search,
                            query
                        )
                );


        renderOptions(

            "brand",

            options,

            option =>
                selectBrand(
                    option.value
                )

        );

    }
        /* ==================================================
       MODELLREIHEN
    ================================================== */

    function renderSeries(
        query = ""
    ) {

        const counts =
            countBy(

                state.vehicles,

                vehicle =>
                    vehicle.baureihe

            );


        const options =
            uniqueSorted(

                state.vehicles.map(
                    vehicle =>
                        vehicle.baureihe
                )

            )

            .map(
                series => ({

                    value:
                        series,

                    label:
                        series,

                    meta:
                        pluralize(
                            counts.get(series),
                            "Motorisierung",
                            "Motorisierungen"
                        ),

                    search:
                        series

                })
            )

            .filter(
                option =>
                    matchesQuery(
                        option.search,
                        query
                    )
            );


        renderOptions(

            "series",

            options,

            option =>
                selectSeries(
                    option.value
                )

        );

    }


    /* ==================================================
       GENERATIONEN
    ================================================== */

    function renderGenerations(
        query = ""
    ) {

        const vehicles =
            state.vehicles.filter(
                vehicle =>
                    vehicle.baureihe ===
                    state.series
            );


        const counts =
            countBy(

                vehicles,

                vehicle =>
                    vehicle.generation ||
                    "Ohne Generationsangabe"

            );


        const options =
            uniqueSorted(

                vehicles.map(
                    vehicle =>
                        vehicle.generation ||
                        "Ohne Generationsangabe"
                )

            )

            .map(
                generation => ({

                    value:
                        generation,

                    label:
                        formatGeneration(
                            generation
                        ),

                    meta:
                        pluralize(
                            counts.get(generation),
                            "Motorisierung",
                            "Motorisierungen"
                        ),

                    search:
                        generation

                })
            )

            .filter(
                option =>
                    matchesQuery(
                        option.search,
                        query
                    )
            );


        renderOptions(

            "generation",

            options,

            option =>
                selectGeneration(
                    option.value
                )

        );

    }


    /* ==================================================
       MOTOREN
    ================================================== */

    function renderEngines(
        query = ""
    ) {

        const options =
            state.vehicles

                .filter(
                    vehicle =>

                        vehicle.baureihe ===
                        state.series &&

                        (
                            vehicle.generation ||
                            "Ohne Generationsangabe"
                        ) ===
                        state.generation
                )

                .sort(
                    sortVehicles
                )

                .map(
                    vehicle => ({

                        label:
                            vehicle.modell,

                        meta: [

                            (
                                vehicle.motorcode &&
                                vehicle.motorcode !== "Auf Anfrage"
                            )
                                ? vehicle.motorcode
                                : "",

                            vehicle.baujahr

                        ]
                        .filter(Boolean)
                        .join(" · "),

                        badges: [

                            vehicle.leistungSeriePS
                                ? `${vehicle.leistungSeriePS} PS`
                                : "",

                            vehicle.leistungSerieNM
                                ? `${vehicle.leistungSerieNM} Nm`
                                : "",

                            vehicle.kraftstoff

                        ]
                        .filter(Boolean),

                        search:
                            searchableText(
                                vehicle
                            ),

                        vehicle:
                            vehicle

                    })
                )

                .filter(
                    option =>
                        matchesQuery(
                            option.search,
                            query
                        )
                );


        renderOptions(

            "engine",

            options,

            option =>
                selectEngine(
                    option.vehicle
                )

        );

    }


    /* ==================================================
       AUSWAHL-KARTEN ERZEUGEN
    ================================================== */

    function renderOptions(
        step,
        options,
        onSelect
    ) {

        const container =
            elements.options[step];


        container.innerHTML = "";


        if (
            options.length === 0
        ) {

            const empty =
                document.createElement(
                    "div"
                );


            empty.className =
                "finder-empty";


            empty.innerHTML = `
                <strong>Keine Treffer</strong>
                <span>Suchbegriff ändern oder Auswahl zurückgehen.</span>
            `;


            container.appendChild(
                empty
            );


            return;

        }


        options.forEach(
            option => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    step === "engine"
                        ? "finder-option engine-option"
                        : "finder-option";


                button.addEventListener(
                    "click",
                    () => onSelect(option)
                );


                const copy =
                    document.createElement(
                        "span"
                    );


                copy.className =
                    "finder-option-copy";


                const label =
                    document.createElement(
                        "strong"
                    );


                label.textContent =
                    option.label;


                copy.appendChild(
                    label
                );


                if (
                    option.meta
                ) {

                    const meta =
                        document.createElement(
                            "small"
                        );


                    meta.textContent =
                        option.meta;


                    copy.appendChild(
                        meta
                    );

                }


                if (
                    Array.isArray(option.badges) &&
                    option.badges.length
                ) {

                    const badges =
                        document.createElement(
                            "span"
                        );


                    badges.className =
                        "engine-badges";


                    option.badges.forEach(
                        text => {

                            const badge =
                                document.createElement(
                                    "span"
                                );


                            badge.textContent =
                                text;


                            badges.appendChild(
                                badge
                            );

                        }
                    );


                    copy.appendChild(
                        badges
                    );

                }


                const arrow =
                    document.createElement(
                        "span"
                    );


                arrow.className =
                    "finder-option-arrow";


                arrow.setAttribute(
                    "aria-hidden",
                    "true"
                );


                arrow.textContent =
                    "→";


                button.append(
                    copy,
                    arrow
                );


                container.appendChild(
                    button
                );

            }
        );

    }


    /* ==================================================
       MARKE AUSWÄHLEN
    ================================================== */

    async function selectBrand(
        brandName
    ) {

        const brand =
            state.brands.find(
                item =>
                    item.name === brandName
            );


        if (!brand) {
            return;
        }


        state.brand =
            brandName;


        state.series =
            "";


        state.generation =
            "";


        state.selectedVehicle =
            null;


        state.vehicles =
            [];


        hideVehicleCard();


        updateSummary(
            "brand",
            brandName
        );


        resetSummary(
            "series"
        );


        resetSummary(
            "generation"
        );


        resetSummary(
            "engine"
        );


        collapseStep(
            "brand"
        );


        setStatus(
            `${brandName}: Fahrzeugdaten werden geladen …`
        );


        const files =
            normalizeBrandFiles(
                brand
            );


        if (
            files.length === 0
        ) {

            setStatus(
                `Für ${brandName} wurden keine Fahrzeugdateien gefunden.`,
                true
            );


            editStep(
                "brand"
            );


            return;

        }


        try {

            const results =
                await Promise.allSettled(

                    files.map(
                        file =>
                            fetchJson(
                                `${DATA_ROOT}${file}`
                            )
                    )

                );


            const vehicles = [];


            results.forEach(
                result => {

                    if (
                        result.status === "fulfilled" &&
                        Array.isArray(result.value)
                    ) {

                        vehicles.push(
                            ...result.value
                        );

                    }

                }
            );


            state.vehicles =
                vehicles

                    .filter(
                        isValidVehicle
                    )

                    .map(
                        normalizeVehicle
                    );


            if (
                state.vehicles.length === 0
            ) {

                throw new Error(
                    "Keine gültigen Fahrzeuge gefunden."
                );

            }


            setStatus("");


            setStep(
                "series"
            );

        }

        catch (error) {

            console.error(
                `Fahrzeugdaten für ${brandName} konnten nicht geladen werden:`,
                error
            );


            setStatus(
                "Fahrzeugdaten konnten nicht geladen werden.",
                true
            );


            editStep(
                "brand"
            );

        }

    }


    /* ==================================================
       MODELLREIHE AUSWÄHLEN
    ================================================== */

    function selectSeries(
        series
    ) {

        state.series =
            series;


        state.generation =
            "";


        state.selectedVehicle =
            null;


        hideVehicleCard();


        updateSummary(
            "series",
            series
        );


        resetSummary(
            "generation"
        );


        resetSummary(
            "engine"
        );


        collapseStep(
            "series"
        );


        setStep(
            "generation"
        );

    }


    /* ==================================================
       GENERATION AUSWÄHLEN
    ================================================== */

    function selectGeneration(
        generation
    ) {

        state.generation =
            generation;


        state.selectedVehicle =
            null;


        hideVehicleCard();


        updateSummary(
            "generation",
            formatGeneration(
                generation
            )
        );


        resetSummary(
            "engine"
        );


        collapseStep(
            "generation"
        );


        setStep(
            "engine"
        );

    }


    /* ==================================================
       MOTOR AUSWÄHLEN
    ================================================== */

    function selectEngine(
        vehicle
    ) {

        state.selectedVehicle =
            vehicle;


        updateSummary(

            "engine",

            buildEngineSummary(
                vehicle
            )

        );


        collapseStep(
            "engine"
        );


        elements.search.value =
            "";


        elements.search.blur();


        elements.searchPanel.hidden =
            true;


        showVehicle(
            vehicle
        );


        setStatus("");

    }
        /* ==================================================
       FINDER SCHRITT ÖFFNEN
    ================================================== */

    function setStep(
        step
    ) {

        state.currentStep =
            step;


        elements.searchPanel.hidden =
            false;


        elements.search.value =
            "";


        elements.reset.hidden =
            !state.brand;


        Object.entries(
            elements.steps
        )
        .forEach(
            ([key, element]) => {

                element.classList.remove(
                    "ready"
                );


                element.classList.toggle(
                    "active",
                    key === step
                );


                element.classList.toggle(
                    "locked",
                    stepIndex(key) >
                    stepIndex(step)
                );


                const header =
                    element.querySelector(
                        "[data-open-step]"
                    );


                if (header) {

                    header.setAttribute(
                        "aria-expanded",
                        key === step
                            ? "true"
                            : "false"
                    );

                }

            }
        );


        const config =
            stepConfig[step];


        elements.eyebrow.textContent =
            config.eyebrow;


        elements.prompt.textContent =
            config.prompt;


        elements.search.placeholder =
            config.placeholder;


        renderCurrentStep();

    }


    /* ==================================================
       FINDER BEIM START GESCHLOSSEN
    ================================================== */

    function prepareFinderClosed() {

        state.currentStep =
            null;


        elements.searchPanel.hidden =
            true;


        elements.reset.hidden =
            true;


        Object.entries(
            elements.steps
        )
        .forEach(
            ([key, element]) => {

                element.classList.remove(
                    "active"
                );


                element.classList.toggle(
                    "ready",
                    key === "brand"
                );


                element.classList.toggle(
                    "locked",
                    key !== "brand"
                );


                const header =
                    element.querySelector(
                        "[data-open-step]"
                    );


                if (header) {

                    header.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }

            }
        );

    }


    /* ==================================================
       SCHRITT PER KLICK ÖFFNEN
    ================================================== */

    function openStepFromHeader(
        step
    ) {

        const element =
            elements.steps[step];


        if (
            !element ||
            element.classList.contains("locked")
        ) {

            return;

        }


        if (
            state.currentStep === step
        ) {

            return;

        }


        const hasSelection = {

            brand:
                Boolean(state.brand),

            series:
                Boolean(state.series),

            generation:
                Boolean(state.generation),

            engine:
                Boolean(state.selectedVehicle)

        }[step];


        if (
            hasSelection
        ) {

            editStep(
                step
            );

        }

        else {

            setStep(
                step
            );

        }

    }


    /* ==================================================
       SCHRITT SCHLIESSEN
    ================================================== */

    function collapseStep(
        step
    ) {

        elements.steps[step]
            .classList.remove(
                "active",
                "locked"
            );


        const editButton =
            elements.steps[step]
                .querySelector(
                    "[data-edit]"
                );


        if (editButton) {

            editButton.hidden =
                false;

        }

    }


    /* ==================================================
       AUSWAHL ÄNDERN
    ================================================== */

    function editStep(
        step
    ) {

        hideVehicleCard();

        setStatus("");


        if (
            step === "brand"
        ) {

            state.brand =
                "";

            state.series =
                "";

            state.generation =
                "";

            state.selectedVehicle =
                null;

            state.vehicles =
                [];


            resetSummary(
                "brand"
            );

            resetSummary(
                "series"
            );

            resetSummary(
                "generation"
            );

            resetSummary(
                "engine"
            );

        }


        else if (
            step === "series"
        ) {

            state.series =
                "";

            state.generation =
                "";

            state.selectedVehicle =
                null;


            resetSummary(
                "series"
            );

            resetSummary(
                "generation"
            );

            resetSummary(
                "engine"
            );

        }


        else if (
            step === "generation"
        ) {

            state.generation =
                "";

            state.selectedVehicle =
                null;


            resetSummary(
                "generation"
            );

            resetSummary(
                "engine"
            );

        }


        else if (
            step === "engine"
        ) {

            state.selectedVehicle =
                null;


            resetSummary(
                "engine"
            );

        }


        setStep(
            step
        );

    }


    /* ==================================================
       FINDER KOMPLETT ZURÜCKSETZEN
    ================================================== */

    function resetFinder() {

        state.brand =
            "";

        state.series =
            "";

        state.generation =
            "";

        state.selectedVehicle =
            null;

        state.vehicles =
            [];


        hideVehicleCard();


        resetSummary(
            "brand"
        );

        resetSummary(
            "series"
        );

        resetSummary(
            "generation"
        );

        resetSummary(
            "engine"
        );


        document
            .querySelectorAll("[data-edit]")
            .forEach(
                button => {
                    button.hidden = true;
                }
            );


        prepareFinderClosed();


        setStatus(
            "Tippe auf „Marke“, um die Fahrzeugauswahl zu öffnen."
        );

    }


    /* ==================================================
       ZUSAMMENFASSUNGEN
    ================================================== */

    function updateSummary(
        step,
        text
    ) {

        elements.summary[step]
            .textContent =
            text;

    }


    function resetSummary(
        step
    ) {

        const defaults = {

            brand:
                "Marke auswählen",

            series:
                "z. B. E-Klasse",

            generation:
                "z. B. W213",

            engine:
                "Motor auswählen"

        };


        elements.summary[step]
            .textContent =
            defaults[step];

    }


    /* ==================================================
       FAHRZEUGERGEBNIS ANZEIGEN
    ================================================== */

    function showVehicle(
        vehicle
    ) {

        /* Fahrzeugbild je Marke */

        elements.image.src =
            getBrandImage(
                vehicle.marke
            );


        elements.image.alt =
            `${vehicle.marke} – ZD PERFORMANCE49`;


        /*
            Falls Bilddatei fehlt:
            Logo statt kaputtem Bild anzeigen.
        */

        elements.image.onerror =
            () => {

                elements.image.onerror =
                    null;


                elements.image.src =
                    DEFAULT_IMAGE;

            };


        /* Fahrzeugtitel */

        elements.title.textContent =
            `${vehicle.marke} ${vehicle.modell}`.trim();


        /* Fahrzeugbeschreibung */

        elements.motorText.textContent =
            [

                formatGeneration(
                    vehicle.generation
                ),

                vehicle.baujahr,

                vehicle.kraftstoff,

                vehicle.hubraum
                    ? `${vehicle.hubraum} cm³`
                    : ""

            ]
            .filter(Boolean)
            .join(" · ");


        /* ==================================================
           PS UND NM AUF NULL SETZEN
        ================================================== */

        elements.stockPs.textContent =
            vehicle.leistungSeriePS
                ? "0 PS"
                : "–";


        elements.stockNm.textContent =
            vehicle.leistungSerieNM
                ? "0 Nm"
                : "–";


        elements.stagePs.textContent =
            vehicle.leistungStage1PS
                ? "0 PS"
                : "–";


        elements.stageNm.textContent =
            vehicle.leistungStage1NM
                ? "0 Nm"
                : "–";


        /* Preis */

        elements.price.textContent =
            formatPrice(
                vehicle.preis
            );


        /* Fahrzeugdetails */

        elements.note.textContent =
            buildNote(
                vehicle
            );


        /* WhatsApp Nachricht */

        elements.whatsapp.href =
            buildWhatsappUrl(
                vehicle
            );


        /* Karte anzeigen */

        elements.card.classList.add(
            "active"
        );


        requestAnimationFrame(
            () => {

                elements.card.scrollIntoView({

                    behavior:
                        "smooth",

                    block:
                        "nearest"

                });


                /*
                    Ganz kurze Pause,
                    danach startet das Hochzählen.
                */

                window.setTimeout(
                    () => {

                        animatePerformanceValues(
                            vehicle
                        );

                    },
                    200
                );

            }
        );

    }


    /* ==================================================
       FAHRZEUGERGEBNIS AUSBLENDEN
    ================================================== */

    function hideVehicleCard() {

        /*
            Laufende PS/Nm-Animation stoppen.
        */

        performanceAnimationId++;


        elements.card.classList.remove(
            "active"
        );

    }


    /* ==================================================
       1,5 SEKUNDEN PS-/NM-ANIMATION
    ================================================== */

    function animatePerformanceValues(
        vehicle
    ) {

        performanceAnimationId++;


        const animationId =
            performanceAnimationId;


        const startTime =
            performance.now();


        const values = [

            {
                element:
                    elements.stockPs,

                target:
                    Number(
                        vehicle.leistungSeriePS
                    ) || 0,

                unit:
                    "PS"
            },


            {
                element:
                    elements.stockNm,

                target:
                    Number(
                        vehicle.leistungSerieNM
                    ) || 0,

                unit:
                    "Nm"
            },


            {
                element:
                    elements.stagePs,

                target:
                    Number(
                        vehicle.leistungStage1PS
                    ) || 0,

                unit:
                    "PS"
            },


            {
                element:
                    elements.stageNm,

                target:
                    Number(
                        vehicle.leistungStage1NM
                    ) || 0,

                unit:
                    "Nm"
            }

        ];


        function animateFrame(
            now
        ) {

            /*
                Wurde zwischenzeitlich ein anderes
                Fahrzeug ausgewählt, stoppen.
            */

            if (
                animationId !==
                performanceAnimationId
            ) {

                return;

            }


            const elapsed =
                now - startTime;


            const progress =
                Math.min(

                    elapsed /
                    PERFORMANCE_ANIMATION_DURATION,

                    1

                );


            /*
                Ease-Out-Cubic:
                zuerst etwas schneller,
                zum Ende sanft abbremsen.
            */

            const eased =
                1 -
                Math.pow(
                    1 - progress,
                    3
                );


            values.forEach(
                item => {

                    if (
                        item.target <= 0
                    ) {

                        item.element.textContent =
                            "–";

                        return;

                    }


                    const current =
                        Math.round(
                            item.target *
                            eased
                        );


                    item.element.textContent =
                        `${current} ${item.unit}`;

                }
            );


            if (
                progress < 1
            ) {

                requestAnimationFrame(
                    animateFrame
                );

            }

            else {

                /*
                    Zum Schluss exakt
                    den echten Endwert einsetzen.
                */

                values.forEach(
                    item => {

                        item.element.textContent =
                            item.target > 0
                                ? `${item.target} ${item.unit}`
                                : "–";

                    }
                );

            }

        }


        requestAnimationFrame(
            animateFrame
        );

    }


    /* ==================================================
       MARKENBILD BESTIMMEN
    ================================================== */

    function getBrandImage(
        brand
    ) {

        const key =
            normalizeText(
                brand
            );


        return (
            BRAND_IMAGES[key] ||
            DEFAULT_IMAGE
        );

    }
        /* ==================================================
       WHATSAPP
    ================================================== */

    function buildWhatsappUrl(
        vehicle
    ) {

        const message =
`Hallo ZD PERFORMANCE49,

ich interessiere mich für eine Softwareoptimierung für folgendes Fahrzeug:

Marke: ${vehicle.marke || "–"}
Modellreihe: ${vehicle.baureihe || "–"}
Generation: ${formatGeneration(vehicle.generation) || "–"}
Motorisierung: ${vehicle.modell || "–"}

Serienleistung:
${formatPower(vehicle.leistungSeriePS, "PS")} / ${formatPower(vehicle.leistungSerieNM, "Nm")}

Stage 1:
${formatPower(vehicle.leistungStage1PS, "PS")} / ${formatPower(vehicle.leistungStage1NM, "Nm")}

Bitte schickt mir weitere Informationen und einen Termin-/Preisvorschlag.`;


        return (
            `https://wa.me/${WHATSAPP_NUMBER}?text=` +
            encodeURIComponent(
                message
            )
        );

    }


    /* ==================================================
       FAHRZEUGDETAILS
    ================================================== */

    function buildNote(
        vehicle
    ) {

        const parts = [];


        if (
            vehicle.motorcode
        ) {

            parts.push(
                `Motorcode: ${vehicle.motorcode}`
            );

        }


        if (
            vehicle.ecu
        ) {

            parts.push(
                `ECU: ${vehicle.ecu}`
            );

        }


        if (
            vehicle.getriebe
        ) {

            parts.push(
                `Getriebe: ${vehicle.getriebe}`
            );

        }


        if (
            Array.isArray(vehicle.optionen) &&
            vehicle.optionen.length
        ) {

            parts.push(
                `Optionen: ${vehicle.optionen.join(", ")}`
            );

        }


        if (
            vehicle.hinweis
        ) {

            parts.push(
                vehicle.hinweis
            );

        }


        return (
            parts.join(" | ") ||
            "Weitere Details auf Anfrage"
        );

    }


    /* ==================================================
       MOTOR-ZUSAMMENFASSUNG
    ================================================== */

    function buildEngineSummary(
        vehicle
    ) {

        return [

            vehicle.modell,

            vehicle.leistungSeriePS
                ? `${vehicle.leistungSeriePS} PS`
                : ""

        ]
        .filter(Boolean)
        .join(" · ");

    }


    /* ==================================================
       DATEIEN EINER MARKE
    ================================================== */

    function normalizeBrandFiles(
        brand
    ) {

        if (
            Array.isArray(
                brand.dateien
            )
        ) {

            return brand.dateien
                .filter(Boolean);

        }


        if (
            typeof brand.datei === "string" &&
            brand.datei.trim()
        ) {

            return [
                brand.datei.trim()
            ];

        }


        return [];

    }


    /* ==================================================
       FAHRZEUGDATEN NORMALISIEREN
    ================================================== */

    function normalizeVehicle(
        vehicle
    ) {

        return {

            ...vehicle,


            marke:
                String(
                    vehicle.marke || ""
                ),


            baureihe:
                String(
                    vehicle.baureihe || ""
                ),


            generation:
                String(
                    vehicle.generation || ""
                ),


            modell:
                String(
                    vehicle.modell || ""
                ),


            motorcode:
                String(
                    vehicle.motorcode || ""
                ),


            baujahr:
                String(
                    vehicle.baujahr || ""
                ),


            hubraum:
                String(
                    vehicle.hubraum || ""
                ),


            kraftstoff:
                String(
                    vehicle.kraftstoff || ""
                ),


            ecu:
                String(
                    vehicle.ecu || ""
                ),


            getriebe:
                String(
                    vehicle.getriebe || ""
                ),


            leistungSeriePS:
                numberOrZero(
                    vehicle.leistungSeriePS
                ),


            leistungSerieNM:
                numberOrZero(
                    vehicle.leistungSerieNM
                ),


            leistungStage1PS:
                numberOrZero(
                    vehicle.leistungStage1PS
                ),


            leistungStage1NM:
                numberOrZero(
                    vehicle.leistungStage1NM
                ),


            preis:
                numberOrZero(
                    vehicle.preis
                ) || 399,


            hinweis:
                String(
                    vehicle.hinweis || ""
                ),


            optionen:
                Array.isArray(
                    vehicle.optionen
                )
                    ? vehicle.optionen
                    : []

        };

    }


    /* ==================================================
       FAHRZEUGDATENSATZ PRÜFEN
    ================================================== */

    function isValidVehicle(
        vehicle
    ) {

        return Boolean(

            vehicle &&

            typeof vehicle === "object" &&

            vehicle.marke &&

            vehicle.baureihe &&

            vehicle.modell

        );

    }


    /* ==================================================
       SUCHTEXT
    ================================================== */

    function searchableText(
        vehicle
    ) {

        return [

            vehicle.marke,

            vehicle.baureihe,

            vehicle.generation,

            vehicle.modell,

            vehicle.motorcode,

            vehicle.baujahr,

            vehicle.hubraum,

            vehicle.kraftstoff,

            vehicle.ecu,

            vehicle.getriebe,

            ...(
                vehicle.optionen ||
                []
            )

        ]
        .join(" ");

    }


    /* ==================================================
       GENERATION FORMATIEREN
    ================================================== */

    function formatGeneration(
        value
    ) {

        return String(
            value || ""
        )

        .replaceAll(
            "/",
            " / "
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim();

    }


    /* ==================================================
       STATUS TEXT
    ================================================== */

    function setStatus(
        message,
        isError = false
    ) {

        elements.status.textContent =
            message;


        elements.status.classList.toggle(
            "error",
            isError
        );

    }


    /* ==================================================
       SUCHFUNKTION
    ================================================== */

    function matchesQuery(
        value,
        query
    ) {

        return (
            !query ||
            normalizeText(value)
                .includes(query)
        );

    }


    /* ==================================================
       WERTE ZÄHLEN
    ================================================== */

    function countBy(
        items,
        getKey
    ) {

        const map =
            new Map();


        items.forEach(
            item => {

                const key =
                    getKey(item);


                map.set(

                    key,

                    (
                        map.get(key) ||
                        0
                    ) + 1

                );

            }
        );


        return map;

    }


    /* ==================================================
       EINZAHL / MEHRZAHL
    ================================================== */

    function pluralize(
        count,
        singular,
        plural
    ) {

        return (
            `${count || 0} ` +
            (
                count === 1
                    ? singular
                    : plural
            )
        );

    }


    /* ==================================================
       SCHRITTINDEX
    ================================================== */

    function stepIndex(
        step
    ) {

        return [

            "brand",

            "series",

            "generation",

            "engine"

        ].indexOf(
            step
        );

    }


    /* ==================================================
       JSON LADEN
    ================================================== */

    async function fetchJson(
        url
    ) {

        const response =
            await fetch(

                url,

                {
                    cache:
                        "no-store"
                }

            );


        if (
            !response.ok
        ) {

            throw new Error(
                `${response.status} ${response.statusText}: ${url}`
            );

        }


        return response.json();

    }


    /* ==================================================
       DOPPELTE WERTE ENTFERNEN
    ================================================== */

    function uniqueSorted(
        values
    ) {

        return [

            ...new Set(
                values.filter(Boolean)
            )

        ]
        .sort(
            sortText
        );

    }


    /* ==================================================
       TEXT SORTIEREN
    ================================================== */

    function sortText(
        a,
        b
    ) {

        return String(a)
            .localeCompare(

                String(b),

                "de",

                {
                    numeric: true,
                    sensitivity: "base"
                }

            );

    }


    /* ==================================================
       MOTOREN SORTIEREN
    ================================================== */

    function sortVehicles(
        a,
        b
    ) {

        return (

            a.modell.localeCompare(

                b.modell,

                "de",

                {
                    numeric: true,
                    sensitivity: "base"
                }

            )

            ||

            numberOrZero(
                a.leistungSeriePS
            ) -

            numberOrZero(
                b.leistungSeriePS
            )

        );

    }


    /* ==================================================
       LEISTUNGSWERTE
    ================================================== */

    function formatPower(
        value,
        unit
    ) {

        return value
            ? `${value} ${unit}`
            : "–";

    }


    /* ==================================================
       PREIS
    ================================================== */

    function formatPrice(
        value
    ) {

        const amount =
            numberOrZero(
                value
            ) || 399;


        return new Intl.NumberFormat(

            "de-DE",

            {

                style:
                    "currency",

                currency:
                    "EUR",

                maximumFractionDigits:
                    0

            }

        )
        .format(
            amount
        );

    }


    /* ==================================================
       ZAHL PRÜFEN
    ================================================== */

    function numberOrZero(
        value
    ) {

        const number =
            Number(
                value
            );


        return Number.isFinite(
            number
        )
            ? number
            : 0;

    }


    /* ==================================================
       TEXT NORMALISIEREN
    ================================================== */

    function normalizeText(
        value
    ) {

        return String(
            value || ""
        )

        .toLocaleLowerCase(
            "de-DE"
        )

        .normalize(
            "NFD"
        )

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .trim();

    }


})();
