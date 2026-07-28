/* ============================================================================
   Startmenü und Modulwechsel.
   ========================================================================== */

const Modules = {
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
        if (el) el.style.display = (key === name) ? "block" : "none";
    });
    Modules[name].open();
}

function backToMenu() {
    Object.keys(Modules).forEach(function (key) {
        Modules[key].suspend();
        const el = document.getElementById("module-" + key);
        if (el) el.style.display = "none";
    });
    document.getElementById("main-menu").style.display = "block";
}

/* Die Module Noten und Vorzeichen erwarten diese Signatur. */
function whenVexReady(errorDisplay, callback) {
    Core.whenVexReady(callback, errorDisplay);
}
