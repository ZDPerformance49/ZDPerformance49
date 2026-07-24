/*==================================================
 ZD PERFORMANCE49
 Allgemeine Website-Funktionen
==================================================*/

(() => {
    "use strict";

    document.addEventListener(
        "DOMContentLoaded",
        initWebsite
    );

    function initWebsite() {
        initSmoothScrolling();
        initHeaderScroll();
        initContactButtons();
    }

    function initSmoothScrolling() {
        const links = document.querySelectorAll(
            'a[href^="#"]'
        );

        links.forEach(link => {
            link.addEventListener(
                "click",
                event => {
                    const targetId =
                        link.getAttribute("href");

                    if (
                        !targetId ||
                        targetId === "#"
                    ) {
                        return;
                    }

                    const target =
                        document.querySelector(
                            targetId
                        );

                    if (!target) {
                        return;
                    }

                    event.preventDefault();

                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            );
        });
    }

    function initHeaderScroll() {
        const header =
            document.querySelector("header");

        if (!header) {
            return;
        }

        updateHeader();

        window.addEventListener(
            "scroll",
            updateHeader,
            {
                passive: true
            }
        );

        function updateHeader() {
            header.classList.toggle(
                "scrolled",
                window.scrollY > 20
            );
        }
    }

    function initContactButtons() {
        const buttons =
            document.querySelectorAll(
                [
                    "#appointmentButton",
                    "#contactButton",
                    "[data-contact-button]",
                    'a[href="#kontakt"]'
                ].join(",")
            );

        buttons.forEach(button => {
            button.addEventListener(
                "click",
                saveSelectedVehicle
            );
        });
    }

    function saveSelectedVehicle() {
        const brandSelect =
            document.getElementById("marke");

        const seriesSelect =
            document.getElementById("baureihe");

        const modelSelect =
            document.getElementById("modell");

        const engineSelect =
            document.getElementById("motor");

        if (
            !brandSelect ||
            !engineSelect ||
            !engineSelect.value
        ) {
            return;
        }

        const selectedVehicle = {
            marke:
                brandSelect.value || "",
            baureihe:
                seriesSelect
                    ? seriesSelect.value
                    : "",
            modell:
                modelSelect
                    ? modelSelect.value
                    : "",
            motor:
                engineSelect.options[
                    engineSelect.selectedIndex
                ]?.textContent || "",
            id:
                engineSelect.value || ""
        };

        try {
            sessionStorage.setItem(
                "zdSelectedVehicle",
                JSON.stringify(
                    selectedVehicle
                )
            );
        } catch (error) {
            console.warn(
                "ZD PERFORMANCE49: Fahrzeugauswahl konnte nicht gespeichert werden.",
                error
            );
        }
    }
})();
