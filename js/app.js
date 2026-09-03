/* ============================================================================
   Startmenü und Modulwechsel.
   ========================================================================== */

const Modules = {
    notenwerte:  NotenwertApp,
    pausen:      PausenApp,
    noten:       NotenApp,
    vorzeichen:  VorzeichenApp,
    tonleitern:  TonleiterApp,
    intervalle:  IntervallApp,
    dreiklaenge: DreiklangApp
};

function openModule(name) {
    document.getElementById("main-menu").style.display = "none";
    Object.keys(Modules).forEach(function (key) {
        const el = document.getElementById("module-" + key);
        if (el) el.style.display = (key === name) ? "flex" : "none";
    });
    if (Modules[name]) {
        Modules[name].open();
    }
}

function backToMenu() {
    Object.keys(Modules).forEach(function (key) {
        if (Modules[key] && typeof Modules[key].suspend === "function") {
            Modules[key].suspend();
        }
        const el = document.getElementById("module-" + key);
        if (el) el.style.display = "none";
    });
    document.getElementById("main-menu").style.display = "flex";
}

/* Die Module Noten und Vorzeichen erwarten diese Signatur. */
function whenVexReady(errorDisplay, callback) {
    Core.whenVexReady(callback, errorDisplay);
}

// Initialisiere Sound-Buttons beim Laden
document.addEventListener("DOMContentLoaded", function () {
    if (window.Core && Core.sound) {
        Core.sound.updateButtons();
    }
});

