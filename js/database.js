/*==================================================
 ZD PERFORMANCE49
 Fahrzeugdatenbank
==================================================*/

(() => {
    "use strict";

    const DATA_PATH = "data/";
    const FALLBACK_IMAGE = "images/hero.png";

    const state = {
        brands: [],
        vehicles: [],
        loadedFiles: new Set(),
        currentBrand: ""
    };

    const elements = {};

    document.addEventListener("DOMContentLoaded", initDatabase);

    async function initDatabase() {
        cacheElements();

        if (
            !elements.brand ||
            !elements.series ||
            !elements.model ||
            !elements.engine
        ) {
            console.warn(
                "ZD PERFORMANCE49: Datenbank-Filter wurden nicht gefunden."
            );
            return;
        }

        bindEvents();
        resetVehicleCard();

        try {
            state.brands = await fetchJson(
                `${DATA_PATH}brands.json`
            );

            renderBrands();
            await preloadActiveBrands();
        } catch (error) {
            console.error(
                "ZD PERFORMANCE49: brands.json konnte nicht geladen werden.",
                error
            );

            setSelectMessage(
                elements.brand,
                "Datenbank nicht verfügbar"
            );
        }
    }

    function cacheElements() {
        elements.search =
            document.getElementById("searchInput");

        elements.brand =
            document.getElementById("marke");

        elements.series =
            document.getElementById("baureihe");

        elements.model =
            document.getElementById("modell");

        elements.engine =
            document.getElementById("motor");

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
    }

    function bindEvents() {
        elements.brand.addEventListener(
            "change",
            handleBrandChange
        );

        elements.series.addEventListener(
            "change",
            handleSeriesChange
        );

        elements.model.addEventListener(
            "change",
            handleModelChange
        );

        elements.engine.addEventListener(
            "change",
            handleEngineChange
        );

        if (elements.search) {
            elements.search.addEventListener(
                "input",
                debounce(handleSearch, 180)
            );
        }
    }

    async function handleBrandChange() {
        resetSelect(
            elements.series,
            "Baureihe wählen"
        );

        resetSelect(
            elements.model,
            "Modell wählen"
        );

        resetSelect(
            elements.engine,
            "Motor wählen"
        );

        hideVehicleCard();

        const brandName = elements.brand.value;

        state.currentBrand = brandName;

        if (!brandName) {
            return;
        }

        const brand = state.brands.find(
            item => item.name === brandName
        );

        if (!brand || brand.aktiv === false) {
            return;
        }

        try {
            await loadBrandVehicles(brand);
            renderSeries(brandName);
        } catch (error) {
            console.error(
                `ZD PERFORMANCE49: ${brand.datei} konnte nicht geladen werden.`,
                error
            );

            setSelectMessage(
                elements.series,
                "Fahrzeugdaten fehlen"
            );
        }
    }

    function handleSeriesChange() {
        resetSelect(
            elements.model,
            "Modell wählen"
        );

        resetSelect(
            elements.engine,
            "Motor wählen"
        );

        hideVehicleCard();

        if (!elements.series.value) {
            return;
        }

        renderModels(
            elements.brand.value,
            elements.series.value
        );
    }

    function handleModelChange() {
        resetSelect(
            elements.engine,
            "Motor wählen"
        );

        hideVehicleCard();

        if (!elements.model.value) {
            return;
        }

        renderEngines(
            elements.brand.value,
            elements.series.value,
            elements.model.value
        );
    }

    function handleEngineChange() {
        hideVehicleCard();

        const id = elements.engine.value;

        if (!id) {
            return;
        }

        const vehicle = state.vehicles.find(
            item => item.id === id
        );

        if (vehicle) {
            showVehicle(vehicle);
        }
    }

    async function handleSearch() {
        const query = normalize(
            elements.search.value
        );

        if (query.length < 2) {
            hideVehicleCard();
            return;
        }

        await preloadActiveBrands();

        const result = state.vehicles.find(
            vehicle =>
                searchableText(vehicle).includes(query)
        );

        if (!result) {
            hideVehicleCard();
            return;
        }

        await selectVehicle(result);
    }

    async function selectVehicle(vehicle) {
        elements.brand.value = vehicle.marke;
        state.currentBrand = vehicle.marke;

        renderSeries(vehicle.marke);

        elements.series.value =
            getSeriesValue(vehicle);

        renderModels(
            vehicle.marke,
            getSeriesValue(vehicle)
        );

        elements.model.value =
            vehicle.modell || "";

        renderEngines(
            vehicle.marke,
            getSeriesValue(vehicle),
            vehicle.modell || ""
        );

        elements.engine.value = vehicle.id;

        showVehicle(vehicle);
    }

    function renderBrands() {
        resetSelect(
            elements.brand,
            "Marke wählen"
        );

        [...state.brands]
            .sort((a, b) =>
                a.name.localeCompare(
                    b.name,
                    "de"
                )
            )
            .forEach(brand => {
                const option =
                    document.createElement("option");

                option.value = brand.name;

                option.textContent =
                    brand.aktiv === false
                        ? `${brand.name} – in Vorbereitung`
                        : brand.name;

                option.disabled =
                    brand.aktiv === false;

                elements.brand.appendChild(option);
            });
    }

    function renderSeries(brandName) {
        const values = uniqueSorted(
            state.vehicles
                .filter(
                    vehicle =>
                        vehicle.marke === brandName
                )
                .map(getSeriesValue)
        );

        fillSelect(
            elements.series,
            "Baureihe wählen",
            values
        );
    }

    function renderModels(
        brandName,
        seriesValue
    ) {
        const values = uniqueSorted(
            state.vehicles
                .filter(
                    vehicle =>
                        vehicle.marke === brandName &&
                        getSeriesValue(vehicle) ===
                            seriesValue
                )
                .map(
                    vehicle =>
                        vehicle.modell
                )
        );

        fillSelect(
            elements.model,
            "Modell wählen",
            values
        );
    }

    function renderEngines(
        brandName,
        seriesValue,
        modelName
    ) {
        resetSelect(
            elements.engine,
            "Motor wählen"
        );

        state.vehicles
            .filter(
                vehicle =>
                    vehicle.marke === brandName &&
                    getSeriesValue(vehicle) ===
                        seriesValue &&
                    vehicle.modell === modelName
            )
            .sort((a, b) =>
                engineLabel(a).localeCompare(
                    engineLabel(b),
                    "de",
                    {
                        numeric: true
                    }
                )
            )
            .forEach(vehicle => {
                const option =
                    document.createElement("option");

                option.value = vehicle.id;
                option.textContent =
                    engineLabel(vehicle);

                elements.engine.appendChild(option);
            });
    }
      async function preloadActiveBrands() {
        const activeBrands = state.brands.filter(
            brand => brand.aktiv !== false
        );

        for (const brand of activeBrands) {
            await loadBrandVehicles(brand);
        }
    }

    async function loadBrandVehicles(brand) {

        if (state.loadedFiles.has(brand.datei)) {
            return;
        }

        const vehicles = await fetchJson(
            DATA_PATH + brand.datei
        );

        if (Array.isArray(vehicles)) {

            vehicles.forEach(vehicle => {

                if (!vehicle.id) {
                    vehicle.id = crypto.randomUUID
                        ? crypto.randomUUID()
                        : Math.random().toString(36);
                }

                vehicle.marke =
                    vehicle.marke || brand.name;

                vehicle.preis =
                    vehicle.preis || 399;

                vehicle.bild =
                    vehicle.bild || FALLBACK_IMAGE;

            });

            state.vehicles.push(...vehicles);
        }

        state.loadedFiles.add(brand.datei);
    }

    async function fetchJson(url) {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Fehler beim Laden von ${url}`
            );
        }

        return await response.json();
    }

    function showVehicle(vehicle) {

        if (!elements.card) {
            return;
        }

        elements.card.style.display = "block";

        if (elements.image) {
            elements.image.src =
                vehicle.bild || FALLBACK_IMAGE;

            elements.image.onerror = () => {
                elements.image.src = FALLBACK_IMAGE;
            };
        }

        if (elements.title) {

            elements.title.textContent = [
                vehicle.marke,
                vehicle.modell
            ]
                .filter(Boolean)
                .join(" ");
        }

        if (elements.motorText) {

            elements.motorText.textContent = engineLabel(
                vehicle
            );
        }

        if (elements.stockPs) {
            elements.stockPs.textContent =
                value(vehicle.leistungSeriePS);
        }

        if (elements.stockNm) {
            elements.stockNm.textContent =
                value(vehicle.leistungSerieNM);
        }

        if (elements.stagePs) {
            elements.stagePs.textContent =
                value(vehicle.leistungStage1PS);
        }

        if (elements.stageNm) {
            elements.stageNm.textContent =
                value(vehicle.leistungStage1NM);
        }

        if (elements.price) {
            elements.price.textContent =
                formatPrice(vehicle.preis);
        }

        if (elements.note) {
            elements.note.textContent =
                vehicle.hinweis || "";
        }
    }

    function hideVehicleCard() {

        if (!elements.card) {
            return;
        }

        elements.card.style.display = "none";
    }

    function resetVehicleCard() {

        hideVehicleCard();

        if (elements.image) {
            elements.image.src = FALLBACK_IMAGE;
        }

        if (elements.title) {
            elements.title.textContent = "";
        }

        if (elements.motorText) {
            elements.motorText.textContent = "";
        }

        if (elements.stockPs) {
            elements.stockPs.textContent = "-";
        }

        if (elements.stockNm) {
            elements.stockNm.textContent = "-";
        }

        if (elements.stagePs) {
            elements.stagePs.textContent = "-";
        }

        if (elements.stageNm) {
            elements.stageNm.textContent = "-";
        }

        if (elements.price) {
            elements.price.textContent = "399 €";
        }

        if (elements.note) {
            elements.note.textContent = "";
        }
    }

    function formatPrice(price) {

        return Number(price).toLocaleString(
            "de-DE",
            {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 0
            }
        );
    }

    function value(number) {

        if (
            number === null ||
            number === undefined ||
            number === 0
        ) {
            return "Auf Anfrage";
        }

        return number;
    }
      function searchableText(vehicle) {
        return normalize(
            [
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
                vehicle.leistungSeriePS,
                vehicle.leistungSerieNM,
                vehicle.leistungStage1PS,
                vehicle.leistungStage1NM
            ]
                .filter(
                    value =>
                        value !== null &&
                        value !== undefined &&
                        value !== ""
                )
                .join(" ")
        );
    }

    function engineLabel(vehicle) {
        const engineParts = [
            vehicle.motorcode,
            vehicle.hubraum,
            vehicle.kraftstoff,
            vehicle.leistungSeriePS
                ? `${vehicle.leistungSeriePS} PS`
                : "",
            vehicle.getriebe
        ].filter(Boolean);

        if (engineParts.length > 0) {
            return engineParts.join(" · ");
        }

        return vehicle.modell || "Motor auswählen";
    }

    function getSeriesValue(vehicle) {
        const series = [
            vehicle.baureihe,
            vehicle.generation
        ]
            .filter(Boolean)
            .join(" ");

        return series || "Weitere Modelle";
    }

    function normalize(value) {
        return String(value || "")
            .toLocaleLowerCase("de-DE")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ß/g, "ss")
            .replace(/\s+/g, " ")
            .trim();
    }

    function debounce(callback, delay = 200) {
        let timeoutId;

        return (...args) => {
            clearTimeout(timeoutId);

            timeoutId = setTimeout(
                () => callback(...args),
                delay
            );
        };
    }

    function fillSelect(
        selectElement,
        placeholder,
        values
    ) {
        resetSelect(
            selectElement,
            placeholder
        );

        values.forEach(value => {
            const option =
                document.createElement("option");

            option.value = value;
            option.textContent = value;

            selectElement.appendChild(option);
        });

        selectElement.disabled =
            values.length === 0;
    }

    function uniqueSorted(values) {
        return [
            ...new Set(
                values.filter(
                    value =>
                        value !== null &&
                        value !== undefined &&
                        value !== ""
                )
            )
        ].sort((a, b) =>
            String(a).localeCompare(
                String(b),
                "de",
                {
                    numeric: true,
                    sensitivity: "base"
                }
            )
        );
    }

    function resetSelect(
        selectElement,
        placeholder
    ) {
        if (!selectElement) {
            return;
        }

        selectElement.innerHTML = "";

        const option =
            document.createElement("option");

        option.value = "";
        option.textContent = placeholder;
        option.selected = true;

        selectElement.appendChild(option);
        selectElement.disabled = false;
    }

    function setSelectMessage(
        selectElement,
        message
    ) {
        if (!selectElement) {
            return;
        }

        selectElement.innerHTML = "";

        const option =
            document.createElement("option");

        option.value = "";
        option.textContent = message;
        option.selected = true;

        selectElement.appendChild(option);
        selectElement.disabled = true;
    }

})();
