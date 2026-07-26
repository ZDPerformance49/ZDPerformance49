/* ==================================================
   ZD PERFORMANCE49 – Fahrzeugkonfigurator
   GitHub-Pages-kompatibel, ohne Serververzeichnis-Scan
   ================================================== */

(() => {
    "use strict";

    const DATA_ROOT = "data/";
    const DEFAULT_IMAGE = "images/hero.png";

    const state = {
        brands: [],
        vehicles: [],
        selectedVehicle: null
    };

    const elements = {};

    document.addEventListener("DOMContentLoaded", init);

    async function init() {
        cacheElements();

        if (!requiredElementsExist()) {
            console.error("ZD PERFORMANCE49: Benötigte HTML-Elemente fehlen.");
            return;
        }

        bindEvents();
        resetAllSelects();
        hideVehicleCard();
        await loadBrands();
    }

    function cacheElements() {
        elements.search = document.getElementById("searchInput");
        elements.brand = document.getElementById("marke");
        elements.series = document.getElementById("baureihe");
        elements.model = document.getElementById("modell");
        elements.engine = document.getElementById("motor");
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
            elements.brand &&
            elements.series &&
            elements.model &&
            elements.engine &&
            elements.card
        );
    }

    function bindEvents() {
        elements.brand.addEventListener("change", handleBrandChange);
        elements.series.addEventListener("change", handleSeriesChange);
        elements.model.addEventListener("change", handleModelChange);
        elements.engine.addEventListener("change", handleEngineChange);
        elements.search.addEventListener("input", debounce(handleSearch, 180));
    }

    async function loadBrands() {
        setSelectLoading(elements.brand, "Marken werden geladen …");

        try {
            const brands = await fetchJson(`${DATA_ROOT}brands.json`);

            if (!Array.isArray(brands)) {
                throw new Error("brands.json muss ein Array enthalten.");
            }

            state.brands = brands.filter(brand => brand && brand.aktiv !== false);

            fillSelect(
                elements.brand,
                state.brands.map(brand => ({
                    value: brand.name,
                    label: brand.name
                })),
                "Marke wählen"
            );

            if (state.brands.length === 0) {
                setSelectError(elements.brand, "Keine Marken verfügbar");
            }
        } catch (error) {
            console.error("ZD PERFORMANCE49: Marken konnten nicht geladen werden.", error);
            setSelectError(elements.brand, "Marken konnten nicht geladen werden");
            showError("Datenbank konnte nicht geladen werden. Bitte Seite neu laden.");
        }
    }

    async function handleBrandChange() {
        const brandName = elements.brand.value;

        resetSelect(elements.series, "Baureihe wählen");
        resetSelect(elements.model, "Modell wählen");
        resetSelect(elements.engine, "Motor wählen");
        hideVehicleCard();
        state.vehicles = [];
        state.selectedVehicle = null;

        if (!brandName) {
            return;
        }

        const brand = state.brands.find(item => item.name === brandName);
        if (!brand) {
            showError("Die gewählte Marke wurde nicht gefunden.");
            return;
        }

        const files = normalizeBrandFiles(brand);
        if (files.length === 0) {
            showError(`Für ${brandName} sind noch keine Fahrzeugdateien eingetragen.`);
            return;
        }

        setSelectLoading(elements.series, "Fahrzeuge werden geladen …");

        try {
            const results = await Promise.allSettled(
                files.map(file => fetchJson(`${DATA_ROOT}${file}`))
            );

            const vehicles = [];
            const failedFiles = [];

            results.forEach((result, index) => {
                if (result.status === "fulfilled" && Array.isArray(result.value)) {
                    vehicles.push(...result.value);
                } else {
                    failedFiles.push(files[index]);
                }
            });

            state.vehicles = vehicles
                .filter(isValidVehicle)
                .map(normalizeVehicle);

            if (state.vehicles.length === 0) {
                throw new Error("Keine gültigen Fahrzeugdatensätze gefunden.");
            }

            const series = uniqueSorted(state.vehicles.map(vehicle => vehicle.baureihe));
            fillSelect(elements.series, series, "Baureihe wählen");

            if (failedFiles.length > 0) {
                console.warn("Nicht geladene Dateien:", failedFiles);
            }
        } catch (error) {
            console.error(`ZD PERFORMANCE49: Daten für ${brandName} konnten nicht geladen werden.`, error);
            setSelectError(elements.series, "Fahrzeuge konnten nicht geladen werden");
            showError("Fahrzeugdaten konnten nicht geladen werden.");
        }
    }

    function handleSeriesChange() {
        resetSelect(elements.model, "Modell wählen");
        resetSelect(elements.engine, "Motor wählen");
        hideVehicleCard();

        const series = elements.series.value;
        if (!series) return;

        const items = state.vehicles.filter(vehicle => vehicle.baureihe === series);
        const models = uniqueSorted(
            items.map(vehicle => buildModelKey(vehicle))
        ).map(key => ({
            value: key,
            label: buildModelLabelFromKey(key)
        }));

        fillSelect(elements.model, models, "Generation / Modell wählen");
    }

    function handleModelChange() {
        resetSelect(elements.engine, "Motor wählen");
        hideVehicleCard();

        const key = elements.model.value;
        if (!key) return;

        const candidates = state.vehicles.filter(vehicle =>
            vehicle.baureihe === elements.series.value &&
            buildModelKey(vehicle) === key
        );

        const engines = candidates
            .slice()
            .sort(sortVehicles)
            .map(vehicle => ({
                value: vehicle.id,
                label: buildEngineLabel(vehicle)
            }));

        fillSelect(elements.engine, engines, "Motorvariante wählen");
    }

    function handleEngineChange() {
        const id = elements.engine.value;
        if (!id) {
            hideVehicleCard();
            return;
        }

        const vehicle = state.vehicles.find(item => item.id === id);
        if (!vehicle) {
            showError("Die gewählte Motorvariante wurde nicht gefunden.");
            return;
        }

        showVehicle(vehicle);
    }

    function handleSearch() {
        const query = normalizeText(elements.search.value);

        if (query.length < 2) {
            return;
        }

        const vehicle = state.vehicles.find(item => searchableText(item).includes(query));

        if (!vehicle) {
            return;
        }

        selectVehicleInFilters(vehicle);
        showVehicle(vehicle);
    }

    function selectVehicleInFilters(vehicle) {
        elements.series.value = vehicle.baureihe;
        handleSeriesChange();

        const modelKey = buildModelKey(vehicle);
        elements.model.value = modelKey;
        handleModelChange();

        elements.engine.value = vehicle.id;
    }

    function showVehicle(vehicle) {
        state.selectedVehicle = vehicle;

        if (elements.image) {
            elements.image.src = vehicle.bild || DEFAULT_IMAGE;
            elements.image.alt = `${vehicle.marke} ${vehicle.modell}`;
            elements.image.onerror = () => {
                elements.image.onerror = null;
                elements.image.src = DEFAULT_IMAGE;
            };
        }

        if (elements.title) {
            elements.title.textContent = `${vehicle.marke} ${vehicle.modell}`.trim();
        }

        if (elements.motorText) {
            elements.motorText.textContent = buildVehicleDescription(vehicle);
        }

        if (elements.stockPs) elements.stockPs.textContent = formatPower(vehicle.leistungSeriePS, "PS");
        if (elements.stockNm) elements.stockNm.textContent = formatPower(vehicle.leistungSerieNM, "Nm");
        if (elements.stagePs) elements.stagePs.textContent = formatPower(vehicle.leistungStage1PS, "PS");
        if (elements.stageNm) elements.stageNm.textContent = formatPower(vehicle.leistungStage1NM, "Nm");
        if (elements.price) elements.price.textContent = formatPrice(vehicle.preis);
        if (elements.note) elements.note.textContent = buildNote(vehicle);

        elements.card.classList.add("active");
        elements.card.removeAttribute("hidden");

        saveSelection(vehicle);
    }

    function hideVehicleCard() {
        elements.card.classList.remove("active");
    }

    function showError(message) {
        if (elements.note) {
            elements.note.textContent = message;
        }
    }

    function buildVehicleDescription(vehicle) {
        return [
            vehicle.generation,
            vehicle.baujahr,
            vehicle.kraftstoff,
            vehicle.hubraum ? `${vehicle.hubraum} cm³` : ""
        ].filter(Boolean).join(" · ");
    }

    function buildNote(vehicle) {
        const parts = [];

        if (vehicle.motorcode) parts.push(`Motorcode: ${vehicle.motorcode}`);
        if (vehicle.ecu) parts.push(`ECU: ${vehicle.ecu}`);
        if (vehicle.getriebe) parts.push(`Getriebe: ${vehicle.getriebe}`);
        if (Array.isArray(vehicle.optionen) && vehicle.optionen.length) {
            parts.push(`Optionen: ${vehicle.optionen.join(", ")}`);
        }
        if (vehicle.hinweis) parts.push(vehicle.hinweis);

        return parts.join(" | ") || "Weitere Details auf Anfrage";
    }

    function normalizeBrandFiles(brand) {
        if (Array.isArray(brand.dateien)) {
            return brand.dateien.filter(Boolean);
        }
        if (typeof brand.datei === "string" && brand.datei.trim()) {
            return [brand.datei.trim()];
        }
        return [];
    }

    function normalizeVehicle(vehicle, index) {
        const fallbackId = [
            vehicle.marke,
            vehicle.baureihe,
            vehicle.generation,
            vehicle.modell,
            vehicle.motorcode,
            vehicle.leistungSeriePS,
            index
        ].map(normalizeText).filter(Boolean).join("-");

        return {
            ...vehicle,
            id: String(vehicle.id || fallbackId),
            marke: String(vehicle.marke || ""),
            baureihe: String(vehicle.baureihe || ""),
            generation: String(vehicle.generation || ""),
            modell: String(vehicle.modell || ""),
            motorcode: String(vehicle.motorcode || ""),
            baujahr: String(vehicle.baujahr || ""),
            hubraum: String(vehicle.hubraum || ""),
            kraftstoff: String(vehicle.kraftstoff || ""),
            ecu: String(vehicle.ecu || ""),
            getriebe: String(vehicle.getriebe || ""),
            leistungSeriePS: numberOrZero(vehicle.leistungSeriePS),
            leistungSerieNM: numberOrZero(vehicle.leistungSerieNM),
            leistungStage1PS: numberOrZero(vehicle.leistungStage1PS),
            leistungStage1NM: numberOrZero(vehicle.leistungStage1NM),
            preis: numberOrZero(vehicle.preis) || 399,
            hinweis: String(vehicle.hinweis || ""),
            bild: String(vehicle.bild || ""),
            optionen: Array.isArray(vehicle.optionen) ? vehicle.optionen : []
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

    function buildModelKey(vehicle) {
        return `${vehicle.generation}|||${vehicle.modell}`;
    }

    function buildModelLabelFromKey(key) {
        const [generation, model] = key.split("|||");
        return [generation, model].filter(Boolean).join(" – ");
    }

    function buildEngineLabel(vehicle) {
        const details = [
            vehicle.leistungSeriePS ? `${vehicle.leistungSeriePS} PS` : "",
            vehicle.motorcode,
            vehicle.baujahr,
            vehicle.ecu
        ].filter(Boolean);

        return details.join(" · ") || vehicle.modell;
    }

    function searchableText(vehicle) {
        return normalizeText([
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
        ].join(" "));
    }

    function fillSelect(select, items, placeholder) {
        resetSelect(select, placeholder);

        items.forEach(item => {
            const option = document.createElement("option");

            if (typeof item === "string") {
                option.value = item;
                option.textContent = item;
            } else {
                option.value = item.value;
                option.textContent = item.label;
            }

            select.appendChild(option);
        });

        select.disabled = items.length === 0;
    }

    function resetAllSelects() {
        resetSelect(elements.brand, "Marke wählen");
        resetSelect(elements.series, "Baureihe wählen");
        resetSelect(elements.model, "Generation / Modell wählen");
        resetSelect(elements.engine, "Motor wählen");
    }

    function resetSelect(select, placeholder) {
        select.innerHTML = "";
        const option = document.createElement("option");
        option.value = "";
        option.textContent = placeholder;
        select.appendChild(option);
        select.disabled = true;
    }

    function setSelectLoading(select, message) {
        resetSelect(select, message);
    }

    function setSelectError(select, message) {
        resetSelect(select, message);
    }

    async function fetchJson(url) {
        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}: ${url}`);
        }

        return response.json();
    }

    function uniqueSorted(values) {
        return [...new Set(values.filter(Boolean))].sort((a, b) =>
            String(a).localeCompare(String(b), "de", {
                numeric: true,
                sensitivity: "base"
            })
        );
    }

    function sortVehicles(a, b) {
        return (
            numberOrZero(a.leistungSeriePS) - numberOrZero(b.leistungSeriePS) ||
            a.motorcode.localeCompare(b.motorcode, "de", { sensitivity: "base" }) ||
            a.baujahr.localeCompare(b.baujahr, "de", { numeric: true })
        );
    }

    function formatPower(value, unit) {
        return value ? `${value} ${unit}` : "–";
    }

    function formatPrice(value) {
        const amount = numberOrZero(value) || 399;
        return new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0
        }).format(amount);
    }

    function numberOrZero(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    function normalizeText(value) {
        return String(value || "")
            .toLocaleLowerCase("de-DE")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    function saveSelection(vehicle) {
        try {
            sessionStorage.setItem("zdSelectedVehicle", JSON.stringify(vehicle));
        } catch (error) {
            console.warn("Fahrzeugauswahl konnte nicht gespeichert werden.", error);
        }
    }

    function debounce(callback, delay) {
        let timer;
        return (...args) => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => callback(...args), delay);
        };
    }
})();
