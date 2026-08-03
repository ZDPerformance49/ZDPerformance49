(() => {

    "use strict";


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


    const DATA_ROOT = "data/";

    const DEFAULT_IMAGE = "images/logo.png";

    const WHATSAPP_NUMBER = "4954118551025";


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
            placeholder: "Motorisierung suchen"
        }

    };


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


    function cacheElements() {

        elements.searchPanel =
            document.getElementById("finderSearch");

        elements.search =
            document.getElementById("searchInput");

        elements.reset =
            document.getElementById("finderReset");

        elements.eyebrow =
            document.getElementById("finderEyebrow");

        elements.prompt =
            document.getElementById("finderPrompt");

        elements.status =
            document.getElementById("finderStatus");


        elements.steps = {

            brand:
                document.getElementById("brandStep"),

            series:
                document.getElementById("seriesStep"),

            generation:
                document.getElementById("generationStep"),

            engine:
                document.getElementById("engineStep")

        };


        elements.options = {

            brand:
                document.getElementById("brandOptions"),

            series:
                document.getElementById("seriesOptions"),

            generation:
                document.getElementById("generationOptions"),

            engine:
                document.getElementById("engineOptions")

        };


        elements.summary = {

            brand:
                document.getElementById("brandSummary"),

            series:
                document.getElementById("seriesSummary"),

            generation:
                document.getElementById("generationSummary"),

            engine:
                document.getElementById("engineSummary")

        };


        elements.card =
            document.getElementById("vehicleCard");

        elements.image =
            document.getElementById("vehicleImage");

        elements.title =
            document.getElementById("vehicleTitle");

        elements.motorText =
            document.getElementById("vehicleMotor");

        elements.stockPs =
            document.getElementById("seriePs");

        elements.stockNm =
            document.getElementById("serieNm");

        elements.stagePs =
            document.getElementById("stagePs");

        elements.stageNm =
            document.getElementById("stageNm");

        elements.price =
            document.getElementById("price");

        elements.note =
            document.getElementById("hinweis");

        elements.whatsapp =
            document.getElementById("vehicleWhatsapp");

    }


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

            });

    }


    async function loadBrands() {

        setStatus(
            "Marken werden geladen …"
        );


        try {

            const brands =
                await fetchJson(
                    `${DATA_ROOT}brands.json`
                );


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

            console.error(error);

            setStatus(
                "Datenbank konnte nicht geladen werden.",
                true
            );

        }

    }


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


    function renderBrands(
        query = ""
    ) {

        const options =
            state.brands
                .map(
                    brand => ({

                        value: brand.name,

                        label: brand.name,

                        meta: "Marke",

                        search:
                            `${brand.name} ${brand.slug || ""}`

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

                    value: series,

                    label: series,

                    meta:
                        `${counts.get(series)} Motorisierungen`,

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


    function renderGenerations(
        query = ""
    ) {

        const vehicles =
            state.vehicles.filter(
                vehicle =>
                    vehicle.baureihe ===
                    state.series
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

                    value: generation,

                    label:
                        formatGeneration(
                            generation
                        ),

                    meta:
                        `${vehicles.filter(v =>
                            (v.generation || "Ohne Generationsangabe") === generation
                        ).length} Motorisierungen`,

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
                .sort(sortVehicles)
                .map(
                    vehicle => ({

                        label:
                            vehicle.modell,

                        meta:
                            [
                                vehicle.motorcode,
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

                        ].filter(Boolean),

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

            container.innerHTML =
                `
                    <div class="finder-empty">
                        <strong>Keine Treffer</strong>
                        <span>Suchbegriff ändern.</span>
                    </div>
                `;

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
                    () =>
                        onSelect(
                            option
                        )
                );


                const copy =
                    document.createElement(
                        "span"
                    );


                copy.className =
                    "finder-option-copy";


                copy.innerHTML =
                    `
                        <strong>${escapeHtml(option.label)}</strong>
                        ${
                            option.meta
                                ? `<small>${escapeHtml(option.meta)}</small>`
                                : ""
                        }
                    `;


                if (
                    option.badges
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


    async function selectBrand(
        brandName
    ) {

        const brand =
            state.brands.find(
                item =>
                    item.name ===
                    brandName
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


        hideVehicleCard();


        updateSummary(
            "brand",
            brandName
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


        try {

            const results =
                await Promise.all(

                    files.map(
                        file =>
                            fetchJson(
                                `${DATA_ROOT}${file}`
                            )
                    )

                );


            state.vehicles =
                results
                    .flat()
                    .filter(isValidVehicle)
                    .map(normalizeVehicle);


            setStatus("");


            setStep(
                "series"
            );

        }

        catch (error) {

            console.error(error);

            setStatus(
                "Fahrzeugdaten konnten nicht geladen werden.",
                true
            );

        }

    }


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


        collapseStep(
            "series"
        );


        setStep(
            "generation"
        );

    }


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


        collapseStep(
            "generation"
        );


        setStep(
            "engine"
        );

    }


    function selectEngine(
        vehicle
    ) {

        state.selectedVehicle =
            vehicle;


        updateSummary(
            "engine",
            `${vehicle.modell} · ${vehicle.leistungSeriePS || ""} PS`
        );


        collapseStep(
            "engine"
        );


        elements.searchPanel.hidden =
            true;


        showVehicle(
            vehicle
        );


        setStatus("");

    }


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

            }
        );


        elements.eyebrow.textContent =
            stepConfig[step].eyebrow;


        elements.prompt.textContent =
            stepConfig[step].prompt;


        elements.search.placeholder =
            stepConfig[step].placeholder;


        renderCurrentStep();

    }


    function prepareFinderClosed() {

        state.currentStep =
            null;


        elements.searchPanel.hidden =
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

            }
        );

    }


    function openStepFromHeader(
        step
    ) {

        const element =
            elements.steps[step];


        if (
            element.classList.contains(
                "locked"
            )
        ) {

            return;

        }


        if (
            state.currentStep === step
        ) {

            return;

        }


        editStep(
            step
        );

    }


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


        if (
            editButton
        ) {

            editButton.hidden =
                false;

        }

    }


    function editStep(
        step
    ) {

        hideVehicleCard();


        if (
            step === "brand"
        ) {

            state.brand = "";
            state.series = "";
            state.generation = "";
            state.selectedVehicle = null;
            state.vehicles = [];

        }


        if (
            step === "series"
        ) {

            state.series = "";
            state.generation = "";
            state.selectedVehicle = null;

        }


        if (
            step === "generation"
        ) {

            state.generation = "";
            state.selectedVehicle = null;

        }


        if (
            step === "engine"
        ) {

            state.selectedVehicle = null;

        }


        setStep(
            step
        );

    }


    function resetFinder() {

        state.brand = "";
        state.series = "";
        state.generation = "";
        state.selectedVehicle = null;
        state.vehicles = [];


        hideVehicleCard();


        elements.summary.brand.textContent =
            "Marke auswählen";

        elements.summary.series.textContent =
            "z. B. E-Klasse";

        elements.summary.generation.textContent =
            "z. B. W213";

        elements.summary.engine.textContent =
            "Motor auswählen";


        prepareFinderClosed();

    }


    function updateSummary(
        step,
        text
    ) {

        elements.summary[step]
            .textContent =
            text;

    }


    function showVehicle(
        vehicle
    ) {

        elements.image.src =
            getBrandImage(
                vehicle.marke
            );


        elements.image.onerror =
            () => {

                elements.image.onerror =
                    null;

                elements.image.src =
                    DEFAULT_IMAGE;

            };


        elements.title.textContent =
            `${vehicle.marke} ${vehicle.modell}`;


        elements.motorText.textContent =
            [
                formatGeneration(
                    vehicle.generation
                ),
                vehicle.baujahr,
                vehicle.kraftstoff
            ]
            .filter(Boolean)
            .join(" · ");


        elements.stockPs.textContent =
            formatPower(
                vehicle.leistungSeriePS,
                "PS"
            );


        elements.stockNm.textContent =
            formatPower(
                vehicle.leistungSerieNM,
                "Nm"
            );


        elements.stagePs.textContent =
            formatPower(
                vehicle.leistungStage1PS,
                "PS"
            );


        elements.stageNm.textContent =
            formatPower(
                vehicle.leistungStage1NM,
                "Nm"
            );


        elements.price.textContent =
            formatPrice(
                vehicle.preis
            );


        elements.note.textContent =
            buildNote(
                vehicle
            );


        elements.whatsapp.href =
            buildWhatsappUrl(
                vehicle
            );


        elements.card.classList.add(
            "active"
        );


        requestAnimationFrame(
            () => {

                elements.card.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest"
                });

            }
        );

    }


    function hideVehicleCard() {

        elements.card.classList.remove(
            "active"
        );

    }


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


    function buildWhatsappUrl(
        vehicle
    ) {

        const text = `Hallo ZD PERFORMANCE49,

ich interessiere mich für eine Softwareoptimierung:

Marke: ${vehicle.marke}
Modellreihe: ${vehicle.baureihe}
Generation: ${formatGeneration(vehicle.generation)}
Motorisierung: ${vehicle.modell}

Serie:
${formatPower(vehicle.leistungSeriePS, "PS")} / ${formatPower(vehicle.leistungSerieNM, "Nm")}

Stage 1:
${formatPower(vehicle.leistungStage1PS, "PS")} / ${formatPower(vehicle.leistungStage1NM, "Nm")}

Bitte schickt mir weitere Informationen.`;


        return (
            `https://wa.me/${WHATSAPP_NUMBER}?text=` +
            encodeURIComponent(text)
        );

    }


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


    function normalizeBrandFiles(
        brand
    ) {

        if (
            Array.isArray(
                brand.dateien
            )
        ) {

            return brand.dateien;

        }


        if (
            brand.datei
        ) {

            return [
                brand.datei
            ];

        }


        return [];

    }


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
                Number(
                    vehicle.leistungSeriePS
                ) || 0,

            leistungSerieNM:
                Number(
                    vehicle.leistungSerieNM
                ) || 0,

            leistungStage1PS:
                Number(
                    vehicle.leistungStage1PS
                ) || 0,

            leistungStage1NM:
                Number(
                    vehicle.leistungStage1NM
                ) || 0,

            preis:
                Number(
                    vehicle.preis
                ) || 399

        };

    }


    function isValidVehicle(
        vehicle
    ) {

        return Boolean(
            vehicle &&
            vehicle.marke &&
            vehicle.baureihe &&
            vehicle.modell
        );

    }


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
            vehicle.kraftstoff,
            vehicle.ecu,
            vehicle.getriebe
        ]
        .join(" ");

    }


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
        .trim();

    }


    function setStatus(
        message,
        error = false
    ) {

        elements.status.textContent =
            message;


        elements.status.classList.toggle(
            "error",
            error
        );

    }


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
                    (map.get(key) || 0) + 1
                );

            }
        );


        return map;

    }


    function stepIndex(
        step
    ) {

        return [
            "brand",
            "series",
            "generation",
            "engine"
        ].indexOf(step);

    }


    async function fetchJson(
        url
    ) {

        const response =
            await fetch(
                url,
                {
                    cache: "no-store"
                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `${response.status}: ${url}`
            );

        }


        return response.json();

    }


    function uniqueSorted(
        values
    ) {

        return [
            ...new Set(
                values.filter(Boolean)
            )
        ].sort(sortText);

    }


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


    function sortVehicles(
        a,
        b
    ) {

        return a.modell.localeCompare(
            b.modell,
            "de",
            {
                numeric: true,
                sensitivity: "base"
            }
        );

    }


    function formatPower(
        value,
        unit
    ) {

        return value
            ? `${value} ${unit}`
            : "–";

    }


    function formatPrice(
        value
    ) {

        const amount =
            Number(value) || 399;


        return new Intl.NumberFormat(
            "de-DE",
            {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0
            }
        )
        .format(amount);

    }


    function normalizeText(
        value
    ) {

        return String(
            value || ""
        )
        .toLocaleLowerCase(
            "de-DE"
        )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim();

    }


    function escapeHtml(
        text
    ) {

        return String(text)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


})();
