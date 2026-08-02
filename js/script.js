/* ==================================================
   ZD PERFORMANCE49 – Fahrzeug-Finder
   Auswahl: Marke → Modellreihe → Generation → Motor
   GitHub-Pages-kompatibel, ohne Serververzeichnis-Scan
   ================================================== */

(() => {
    "use strict";

    const DATA_ROOT = "data/";
    const DEFAULT_IMAGE = "images/hero.png";

    const state = {
        brands: [],
        vehicles: [],
        brand: "",
        series: "",
        generation: "",
        selectedVehicle: null,
        currentStep: "brand",
        options: []
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
            placeholder: "Motorisierung suchen, z. B. E 220 d"
        }
    };

    document.addEventListener("DOMContentLoaded", init);

    async function init() {
        cacheElements();

        if (!requiredElementsExist()) {
            console.error("ZD PERFORMANCE49: Benötigte Elemente für den Fahrzeug-Finder fehlen.");
            return;
        }

        bindEvents();
        hideVehicleCard();
        await loadBrands();
    }

    function cacheElements() {
        elements.search = document.getElementById("searchInput");
        elements.reset = document.getElementById("finderReset");
        elements.eyebrow = document.getElementById("finderEyebrow");
        elements.prompt = document.getElementById("finderPrompt");
        elements.status = document.getElementById("finderStatus");

        elements.steps = {
            brand: document.getElementById("brandStep"),
            series: document.getElementById("seriesStep"),
            generation: document.getElementById("generationStep"),
            engine: document.getElementById("engineStep")
        };

        elements.options = {
            brand: document.getElementById("brandOptions"),
            series: document.getElementById("seriesOptions"),
            generation: document.getElementById("generationOptions"),
            engine: document.getElementById("engineOptions")
        };

        elements.summary = {
            brand: document.getElementById("brandSummary"),
            series: document.getElementById("seriesSummary"),
            generation: document.getElementById("generationSummary"),
            engine: document.getElementById("engineSummary")
        };

        elements.card = document.getElementById("vehicleCard");
        elements.image = document.getElementById("vehicleImage");
        elements.title = document.getElementById("vehicleTitle");
        elements.motorText = document.getElementById("vehicleMotor");
        elements.stockPs = document.getElementById("seriePs");
        elements.stockNm = document.getElementById("serieNm");
        elements.stagePs = document.getElementById("stagePs");
        elements.stageNm = document.getElementById("stageNm");
        elements.price = document.getElementById("price");
        elements.note = document.getElementById("hinweis");
    }

    function requiredElementsExist() {
        return Boolean(
            elements.search &&
            elements.reset &&
            elements.eyebrow &&
            elements.prompt &&
            elements.status &&
            Object.values(elements.steps).every(Boolean) &&
            Object.values(elements.options).every(Boolean) &&
            Object.values(elements.summary).every(Boolean) &&
            elements.card
        );
    }

    function bindEvents() {
        elements.search.addEventListener("input", debounce(renderCurrentStep, 100));
        elements.reset.addEventListener("click", resetFinder);

        document.querySelectorAll("[data-edit]").forEach(button => {
            button.addEventListener("click", () => editStep(button.dataset.edit));
        });
    }

    async function loadBrands() {
        setStatus("Marken werden geladen …");

        try {
            const brands = await fetchJson(`${DATA_ROOT}brands.json`);

            if (!Array.isArray(brands)) {
                throw new Error("brands.json muss ein Array enthalten.");
            }

            state.brands = brands
                .filter(brand => brand && brand.aktiv !== false)
                .sort((a, b) => sortText(a.name, b.name));

            setStep("brand");
            setStatus("");
        } catch (error) {
            console.error("ZD PERFORMANCE49: Marken konnten nicht geladen werden.", error);
            setStatus("Datenbank konnte nicht geladen werden. Bitte Seite neu laden.", true);
        }
    }

    function renderCurrentStep() {
        const query = normalizeText(elements.search.value);

        if (state.currentStep === "brand") {
            renderBrands(query);
        } else if (state.currentStep === "series") {
            renderSeries(query);
        } else if (state.currentStep === "generation") {
            renderGenerations(query);
        } else if (state.currentStep === "engine") {
            renderEngines(query);
        }
    }

    function renderBrands(query = "") {
        const options = state.brands
            .map(brand => ({
                value: brand.name,
                label: brand.name,
                meta: "Marke",
                search: [
                    brand.name,
                    brand.slug,
                    brand.name === "Mercedes-Benz" ? "Mercedes" : ""
                ].join(" ")
            }))
            .filter(option => matchesQuery(option.search, query));

        renderOptions("brand", options, option => selectBrand(option.value));
    }

    function renderSeries(query = "") {
        const counts = countBy(
            state.vehicles,
            vehicle => vehicle.baureihe
        );

        const options = uniqueSorted(
            state.vehicles.map(vehicle => vehicle.baureihe)
        )
            .map(series => ({
                value: series,
                label: series,
                meta: pluralize(
                    counts.get(series),
                    "Motorisierung",
                    "Motorisierungen"
                ),
                search: series
            }))
            .filter(option => matchesQuery(option.search, query));

        renderOptions(
            "series",
            options,
            option => selectSeries(option.value)
        );
    }

    function renderGenerations(query = "") {
        const vehicles = state.vehicles.filter(
            vehicle => vehicle.baureihe === state.series
        );

        const counts = countBy(
            vehicles,
            vehicle => vehicle.generation || "Ohne Generationsangabe"
        );

        const options = uniqueSorted(
            vehicles.map(
                vehicle =>
                    vehicle.generation ||
                    "Ohne Generationsangabe"
            )
        )
            .map(generation => ({
                value: generation,
                label: formatGeneration(generation),
                meta: pluralize(
                    counts.get(generation),
                    "Motorisierung",
                    "Motorisierungen"
                ),
                search: generation
            }))
            .filter(option => matchesQuery(option.search, query));

        renderOptions(
            "generation",
            options,
            option => selectGeneration(option.value)
        );
    }

    function renderEngines(query = "") {
        const options = state.vehicles
            .filter(vehicle =>
                vehicle.baureihe === state.series &&
                (
                    vehicle.generation ||
                    "Ohne Generationsangabe"
                ) === state.generation
            )
            .sort(sortVehicles)
            .map(vehicle => ({
                value: vehicle.id,
                label: vehicle.modell,
                meta: buildEngineMeta(vehicle),
                badges: buildEngineBadges(vehicle),
                search: searchableText(vehicle),
                vehicle
            }))
            .filter(option =>
                matchesQuery(option.search, query)
            );

        renderOptions(
            "engine",
            options,
            option => selectEngine(option.vehicle)
        );
    }

    function renderOptions(step, options, onSelect) {
        const container = elements.options[step];

        container.innerHTML = "";
        state.options = options;

        if (options.length === 0) {
            const empty = document.createElement("div");

            empty.className = "finder-empty";

            empty.innerHTML = `
                <strong>Keine Treffer</strong>
                <span>
                    Suchbegriff ändern oder Auswahl zurückgehen.
                </span>
            `;

            container.appendChild(empty);
            return;
        }

        options.forEach(option => {
            const button = document.createElement("button");

            button.type = "button";

            button.className =
                step === "engine"
                    ? "finder-option engine-option"
                    : "finder-option";

            button.addEventListener(
                "click",
                () => onSelect(option)
            );

            const copy = document.createElement("span");
            copy.className = "finder-option-copy";

            const label = document.createElement("strong");
            label.textContent = option.label;

            copy.appendChild(label);

            if (option.meta) {
                const meta = document.createElement("small");

                meta.textContent = option.meta;

                copy.appendChild(meta);
            }

            if (
                Array.isArray(option.badges) &&
                option.badges.length
            ) {
                const badges =
                    document.createElement("span");

                badges.className = "engine-badges";

                option.badges.forEach(text => {
                    const badge =
                        document.createElement("span");

                    badge.textContent = text;

                    badges.appendChild(badge);
                });

                copy.appendChild(badges);
            }

            const arrow =
                document.createElement("span");

            arrow.className = "finder-option-arrow";

            arrow.setAttribute(
                "aria-hidden",
                "true"
            );

            arrow.textContent = "→";

            button.append(copy, arrow);

            container.appendChild(button);
        });
    }

    async function selectBrand(brandName) {
        const brand = state.brands.find(
            item => item.name === brandName
        );

        if (!brand) return;

        state.brand = brandName;
        state.series = "";
        state.generation = "";
        state.selectedVehicle = null;
        state.vehicles = [];

        hideVehicleCard();

        updateSummary(
            "brand",
            brandName
        );

        collapseStep("brand");

        setStatus(
            `${brandName}: Fahrzeugdaten werden geladen …`
        );

        const files = normalizeBrandFiles(brand);

        if (files.length === 0) {
            setStatus(
                `Für ${brandName} sind noch keine Fahrzeugdateien eingetragen.`,
                true
            );

            editStep("brand");
            return;
        }

        try {
            const results =
                await Promise.allSettled(
                    files.map(file =>
                        fetchJson(
                            `${DATA_ROOT}${file}`
                        )
                    )
                );

            const vehicles = [];
            const failedFiles = [];

            results.forEach(
                (result, index) => {
                    if (
                        result.status === "fulfilled" &&
                        Array.isArray(result.value)
                    ) {
                        vehicles.push(
                            ...result.value
                        );
                    } else {
                        failedFiles.push(
                            files[index]
                        );
                    }
                }
            );

            state.vehicles = vehicles
                .filter(isValidVehicle)
                .map(normalizeVehicle);

            if (
                state.vehicles.length === 0
            ) {
                throw new Error(
                    "Keine gültigen Fahrzeugdatensätze gefunden."
                );
            }

            if (failedFiles.length) {
                console.warn(
                    "Nicht geladene Fahrzeugdateien:",
                    failedFiles
                );
            }

            setStatus("");

            setStep("series");
        } catch (error) {
            console.error(
                `ZD PERFORMANCE49: Daten für ${brandName} konnten nicht geladen werden.`,
                error
            );

            setStatus(
                "Fahrzeugdaten konnten nicht geladen werden.",
                true
            );

            editStep("brand");
        }
    }

    function selectSeries(series) {
        state.series = series;
        state.generation = "";
        state.selectedVehicle = null;

        hideVehicleCard();

        updateSummary(
            "series",
            series
        );

        collapseStep("series");

        setStep("generation");
    }

    function selectGeneration(generation) {
        state.generation = generation;
        state.selectedVehicle = null;

        hideVehicleCard();

        updateSummary(
            "generation",
            formatGeneration(generation)
        );

        collapseStep("generation");

        setStep("engine");
    }

    function selectEngine(vehicle) {
        state.selectedVehicle = vehicle;

        updateSummary(
            "engine",
            buildEngineSummary(vehicle)
        );

        collapseStep("engine");

        elements.search.value = "";
        elements.search.blur();

        elements.prompt.textContent =
            "Fahrzeug gefunden";

        elements.eyebrow.textContent =
            "AUSWAHL ABGESCHLOSSEN";

        elements.search.placeholder =
            "Auswahl abgeschlossen";

        showVehicle(vehicle);

        setStatus("");
    }

    function setStep(step) {
        state.currentStep = step;

        elements.search.value = "";

        elements.reset.hidden =
            !state.brand;

        Object.entries(
            elements.steps
        ).forEach(([key, element]) => {
            element.classList.toggle(
                "active",
                key === step
            );

            element.classList.toggle(
                "locked",
                stepIndex(key) >
                    stepIndex(step)
            );
        });

        const config =
            stepConfig[step];

        elements.eyebrow.textContent =
            config.eyebrow;

        elements.prompt.textContent =
            config.prompt;

        elements.search.placeholder =
            config.placeholder;

        elements.search.disabled = false;

        renderCurrentStep();

        requestAnimationFrame(() => {
            elements.steps[step]
                .scrollIntoView({
                    behavior: "smooth",
                    block: "nearest"
                });
        });
    }

    function collapseStep(step) {
        elements.steps[step]
            .classList.remove(
                "active",
                "locked"
            );

        const editButton =
            elements.steps[step]
                .querySelector("[data-edit]");

        if (editButton) {
            editButton.hidden = false;
        }
    }

    function editStep(step) {
        hideVehicleCard();

        setStatus("");

        if (step === "brand") {
            state.brand = "";
            state.series = "";
            state.generation = "";
            state.selectedVehicle = null;
            state.vehicles = [];

            resetSummary("brand");
            resetSummary("series");
            resetSummary("generation");
            resetSummary("engine");

            resetEditButtonsFrom("brand");

        } else if (step === "series") {
            state.series = "";
            state.generation = "";
            state.selectedVehicle = null;

            resetSummary("series");
            resetSummary("generation");
            resetSummary("engine");

            resetEditButtonsFrom("series");

        } else if (step === "generation") {
            state.generation = "";
            state.selectedVehicle = null;

            resetSummary("generation");
            resetSummary("engine");

            resetEditButtonsFrom("generation");

        } else if (step === "engine") {
            state.selectedVehicle = null;

            resetSummary("engine");

            resetEditButtonsFrom("engine");
        }

        setStep(step);
    }

    function resetFinder() {
        state.brand = "";
        state.series = "";
        state.generation = "";
        state.selectedVehicle = null;
        state.vehicles = [];

        hideVehicleCard();

        setStatus("");

        [
            "brand",
            "series",
            "generation",
            "engine"
        ].forEach(step => {
            resetSummary(step);

            const editButton =
                elements.steps[step]
                    .querySelector(
                        "[data-edit]"
                    );

            if (editButton) {
                editButton.hidden = true;
            }
        });

        setStep("brand");
    }

    function resetEditButtonsFrom(step) {
        const start =
            stepIndex(step);

        Object.keys(
            elements.steps
        ).forEach(key => {
            if (
                stepIndex(key) >= start
            ) {
                const editButton =
                    elements.steps[key]
                        .querySelector(
                            "[data-edit]"
                        );

                if (editButton) {
                    editButton.hidden = true;
                }
            }
        });
    }

    function updateSummary(step, text) {
        elements.summary[step]
            .textContent = text;
    }

    function resetSummary(step) {
        const defaults = {
            brand: "Marke auswählen",
            series: "z. B. E-Klasse",
            generation: "z. B. W213",
            engine: "Motor auswählen"
        };

        updateSummary(
            step,
            defaults[step]
        );
    }

    function showVehicle(vehicle) {
        if (elements.image) {
            elements.image.src =
                vehicle.bild ||
                DEFAULT_IMAGE;

            elements.image.alt =
                `${vehicle.marke} ${vehicle.modell}`;

            elements.image.onerror =
                () => {
                    elements.image.onerror =
                        null;

                    elements.image.src =
                        DEFAULT_IMAGE;
                };
        }

        if (elements.title) {
            elements.title.textContent =
                `${vehicle.marke} ${vehicle.modell}`.trim();
        }

        if (elements.motorText) {
            elements.motorText.textContent =
                buildVehicleDescription(
                    vehicle
                );
        }

        if (elements.stockPs) {
            elements.stockPs.textContent =
                formatPower(
                    vehicle.leistungSeriePS,
                    "PS"
                );
        }

        if (elements.stockNm) {
            elements.stockNm.textContent =
                formatPower(
                    vehicle.leistungSerieNM,
                    "Nm"
                );
        }

        if (elements.stagePs) {
            elements.stagePs.textContent =
                formatPower(
                    vehicle.leistungStage1PS,
                    "PS"
                );
        }

        if (elements.stageNm) {
            elements.stageNm.textContent =
                formatPower(
                    vehicle.leistungStage1NM,
                    "Nm"
                );
        }

        if (elements.price) {
            elements.price.textContent =
                formatPrice(vehicle.preis);
        }

        if (elements.note) {
            elements.note.textContent =
                buildNote(vehicle);
        }

        elements.card.classList.add(
            "active"
        );

        elements.card.removeAttribute(
            "hidden"
        );

        saveSelection(vehicle);

        requestAnimationFrame(() => {
            elements.card.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        });
    }

    function hideVehicleCard() {
        elements.card.classList.remove(
            "active"
        );
    }

    function buildVehicleDescription(vehicle) {
        return [
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
    }

    function buildEngineSummary(vehicle) {
        return [
            vehicle.modell,
            vehicle.leistungSeriePS
                ? `${vehicle.leistungSeriePS} PS`
                : ""
        ]
            .filter(Boolean)
            .join(" · ");
    }

    function buildEngineMeta(vehicle) {
        return [
            vehicle.motorcode &&
            vehicle.motorcode !==
                "Auf Anfrage"
                ? vehicle.motorcode
                : "",
            vehicle.baujahr
        ]
            .filter(Boolean)
            .join(" · ");
    }

    function buildEngineBadges(vehicle) {
        return [
            vehicle.leistungSeriePS
                ? `${vehicle.leistungSeriePS} PS`
                : "",
            vehicle.leistungSerieNM
                ? `${vehicle.leistungSerieNM} Nm`
                : "",
            vehicle.kraftstoff
        ].filter(Boolean);
    }

    function buildNote(vehicle) {
        const parts = [];

        if (vehicle.motorcode) {
            parts.push(
                `Motorcode: ${vehicle.motorcode}`
            );
        }

        if (vehicle.ecu) {
            parts.push(
                `ECU: ${vehicle.ecu}`
            );
        }

        if (vehicle.getriebe) {
            parts.push(
                `Getriebe: ${vehicle.getriebe}`
            );
        }

        if (
            Array.isArray(
                vehicle.optionen
            ) &&
            vehicle.optionen.length
        ) {
            parts.push(
                `Optionen: ${vehicle.optionen.join(", ")}`
            );
        }

        if (vehicle.hinweis) {
            parts.push(
                vehicle.hinweis
            );
        }

        return (
            parts.join(" | ") ||
            "Weitere Details auf Anfrage"
        );
    }

    function normalizeBrandFiles(brand) {
        if (
            Array.isArray(
                brand.dateien
            )
        ) {
            return brand.dateien
                .filter(Boolean);
        }

        if (
            typeof brand.datei ===
                "string" &&
            brand.datei.trim()
        ) {
            return [
                brand.datei.trim()
            ];
        }

        return [];
    }

    function normalizeVehicle(
        vehicle,
        index
    ) {
        const fallbackId = [
            vehicle.marke,
            vehicle.baureihe,
            vehicle.generation,
            vehicle.modell,
            vehicle.motorcode,
            vehicle.leistungSeriePS,
            index
        ]
            .map(normalizeText)
            .filter(Boolean)
            .join("-");

        return {
            ...vehicle,

            id: String(
                vehicle.id ||
                fallbackId
            ),

            marke: String(
                vehicle.marke || ""
            ),

            baureihe: String(
                vehicle.baureihe || ""
            ),

            generation: String(
                vehicle.generation || ""
            ),

            modell: String(
                vehicle.modell || ""
            ),

            motorcode: String(
                vehicle.motorcode || ""
            ),

            baujahr: String(
                vehicle.baujahr || ""
            ),

            hubraum: String(
                vehicle.hubraum || ""
            ),

            kraftstoff: String(
                vehicle.kraftstoff || ""
            ),

            ecu: String(
                vehicle.ecu || ""
            ),

            getriebe: String(
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

            hinweis: String(
                vehicle.hinweis || ""
            ),

            bild: String(
                vehicle.bild || ""
            ),

            optionen:
                Array.isArray(
                    vehicle.optionen
                )
                    ? vehicle.optionen
                    : []
        };
    }

    function isValidVehicle(vehicle) {
        return Boolean(
            vehicle &&
            typeof vehicle === "object" &&
            vehicle.marke &&
            vehicle.baureihe &&
            vehicle.modell
        );
    }

    function searchableText(vehicle) {
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
            ...(vehicle.optionen || [])
        ].join(" ");
    }

    function formatGeneration(value) {
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
        const map = new Map();

        items.forEach(item => {
            const key =
                getKey(item);

            map.set(
                key,
                (map.get(key) || 0) + 1
            );
        });

        return map;
    }

    function pluralize(
        count,
        singular,
        plural
    ) {
        return `${count || 0} ${
            count === 1
                ? singular
                : plural
        }`;
    }

    function stepIndex(step) {
        return [
            "brand",
            "series",
            "generation",
            "engine"
        ].indexOf(step);
    }

    async function fetchJson(url) {
        const response =
            await fetch(
                url,
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                `${response.status} ${response.statusText}: ${url}`
            );
        }

        return response.json();
    }

    function uniqueSorted(values) {
        return [
            ...new Set(
                values.filter(Boolean)
            )
        ].sort(sortText);
    }

    function sortText(a, b) {
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

    function sortVehicles(a, b) {
        return (
            a.modell.localeCompare(
                b.modell,
                "de",
                {
                    numeric: true,
                    sensitivity: "base"
                }
            ) ||

            numberOrZero(
                a.leistungSeriePS
            ) -
            numberOrZero(
                b.leistungSeriePS
            ) ||

            a.baujahr.localeCompare(
                b.baujahr,
                "de",
                {
                    numeric: true
                }
            )
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

    function formatPrice(value) {
        const amount =
            numberOrZero(value) ||
            399;

        return new Intl.NumberFormat(
            "de-DE",
            {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0
            }
        ).format(amount);
    }

    function numberOrZero(value) {
        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    }

    function normalizeText(value) {
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

    function saveSelection(vehicle) {
        try {
            sessionStorage.setItem(
                "zdSelectedVehicle",
                JSON.stringify(vehicle)
            );
        } catch (error) {
            console.warn(
                "Fahrzeugauswahl konnte nicht gespeichert werden.",
                error
            );
        }
    }

    function debounce(
        callback,
        delay
    ) {
        let timer;

        return (...args) => {
            window.clearTimeout(
                timer
            );

            timer =
                window.setTimeout(
                    () =>
                        callback(
                            ...args
                        ),
                    delay
                );
        };
    }
})();
