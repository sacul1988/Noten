/* ============================================================================
   Modul Tonleitern — Dur und harmonisches Moll, aufwärts.
   Unten mit Klaviatur und eingeblendetem Schrittschema, oben ohne jede Hilfe.
   ========================================================================== */
const TonleiterApp = (function () {

    const DUR_LEICHT   = ["c/4", "g/4", "f/4"];
    const DUR_MITTEL   = ["c/4", "g/4", "d/4", "f/4", "bb/4"];
    const DUR_ALLE     = ["c/4", "g/4", "d/4", "a/4", "f/4", "bb/4", "eb/4"];
    const MOLL_LEICHT  = ["a/4", "e/4", "d/4"];
    const MOLL_ALLE    = ["a/4", "e/4", "b/4", "d/4", "g/4"];

    const NOTE_BUTTONS = Core.NOTE_BUTTONS;

    const recent = [];

    // Laufender Zustand der aktuellen Aufgabe
    let scale = [];        // Soll-Tonleiter
    let placed = 0;        // wie viele Töne bereits richtig gesetzt sind
    let type = "dur";

    /* Schrittschema als Kette, der nächste fällige Schritt ist hervorgehoben. */
    function schemaHtml(showSchema) {
        if (!showSchema) return "";
        const steps = Core.scaleSteps(type);
        const parts = steps.map(function (s, i) {
            const active = (i === placed - 1);
            return '<span class="step' + (active ? " step-active" : "") + '">' +
                   Core.STEP_LABELS[s] + "</span>";
        });
        return '<div class="step-chain"><b>' + (type === "dur" ? "Dur" : "Moll (harmonisch)") +
               ":</b> " + parts.join('<span class="step-arrow">→</span>') + "</div>";
    }

    function drawProgress(ctx, wrongKey) {
        const shown = scale.slice(0, placed);
        const colors = shown.map(function () { return "black"; });
        if (wrongKey) {
            shown.push(wrongKey);
            colors.push("#e5484d");
        }
        ctx.staff(shown, { width: 880, scale: 1.3, staveWidth: 640, height: 140 });
    }

    /* Ein Level-Durchgang. */
    function makeLevel(opts) {
        return {
            label: opts.label,
            start: function (ctx) {
                type = opts.types.length > 1 ? Core.pick(opts.types) : opts.types[0];
                const root = Core.pickFresh(opts.roots[type], recent, 2);
                scale = Core.buildScale(root, type);
                placed = 1;

                ctx.task("Baue die " + Core.german(root) + "-" +
                         (type === "dur" ? "Dur" : "Moll") + "-Tonleiter aufwärts.");
                ctx.hint(schemaHtml(opts.schema));
                drawProgress(ctx);

                function accept(ctx) {
                    placed++;
                    ctx.hint(schemaHtml(opts.schema));
                    drawProgress(ctx);
                    if (placed >= scale.length) {
                        ctx.solved("Tonleiter komplett: " + scale.map(Core.german).join(" – "));
                    } else {
                        ctx.feedback("Weiter so — noch " + (scale.length - placed) + " Töne.", "#12b76a");
                    }
                }

                if (opts.keyboard) {
                    ctx.clearAnswers();
                    ctx.keyboard("c/4", "c/6", function (m, keyEl) {
                        if (placed >= scale.length) return;
                        if (m === Core.midi(scale[placed])) {
                            ctx.paintKey(keyEl, "#12b76a");
                            accept(ctx);
                        } else {
                            ctx.paintKey(keyEl, "#e5484d");
                            ctx.failed("Das ist nicht der nächste Ton. Zähle die Halbtonschritte!");
                            setTimeout(function () { ctx.resetKeysExceptPlaced(); }, 900);
                        }
                    }, { labels: opts.labels });

                    // Bereits gesetzte Töne bleiben grün markiert
                    ctx.resetKeysExceptPlaced = function () {
                        ctx.resetKeys();
                        for (let i = 0; i < placed; i++) {
                            const k = ctx.keyEl(Core.midi(scale[i]));
                            if (k) ctx.paintKey(k, "#12b76a");
                        }
                    };
                    ctx.resetKeysExceptPlaced();
                } else {
                    ctx.keyboard(false);
                    ctx.answers(NOTE_BUTTONS, function (name) {
                        if (placed >= scale.length) return;
                        if (name === Core.german(scale[placed])) {
                            accept(ctx);
                        } else {
                            const wrong = guessKeyForName(name, scale[placed]);
                            ctx.failed("Nicht " + name + " — achte auf die Schrittfolge.");
                            drawProgress(ctx, wrong);
                            setTimeout(function () { drawProgress(ctx); }, 1200);
                        }
                    });
                }
            }
        };
    }

    /* Wandelt einen angeklickten Notennamen in eine darstellbare Tonhöhe um,
       damit der Fehlversuch im System sichtbar wird. */
    function guessKeyForName(name, referenceKey) {
        const octave = Core.parseKey(referenceKey).octave;
        for (const raw in Core.GERMAN_NAMES) {
            if (Core.GERMAN_NAMES[raw] === name) return raw + "/" + octave;
        }
        return null;
    }

    const levels = [
        makeLevel({ label: "Dur mit Klaviatur und Schema", types: ["dur"],
                    roots: { dur: DUR_LEICHT }, keyboard: true, labels: true, schema: true }),
        makeLevel({ label: "Mehr Dur-Tonarten mit Schema", types: ["dur"],
                    roots: { dur: DUR_MITTEL }, keyboard: true, labels: true, schema: true }),
        makeLevel({ label: "Dur mit Klaviatur", types: ["dur"],
                    roots: { dur: DUR_ALLE }, keyboard: true, labels: false, schema: false }),
        makeLevel({ label: "Moll mit Klaviatur und Schema", types: ["moll"],
                    roots: { moll: MOLL_LEICHT }, keyboard: true, labels: true, schema: true }),
        makeLevel({ label: "Moll mit Klaviatur", types: ["moll"],
                    roots: { moll: MOLL_ALLE }, keyboard: true, labels: false, schema: false }),
        makeLevel({ label: "Dur und Moll mit Klaviatur", types: ["dur", "moll"],
                    roots: { dur: DUR_ALLE, moll: MOLL_ALLE }, keyboard: true, labels: false, schema: false }),
        makeLevel({ label: "Dur ohne Klaviatur", types: ["dur"],
                    roots: { dur: DUR_MITTEL }, keyboard: false, schema: true }),
        makeLevel({ label: "Dur und Moll ohne Hilfen", types: ["dur", "moll"],
                    roots: { dur: DUR_ALLE, moll: MOLL_ALLE }, keyboard: false, schema: false })
    ];

    return Core.createModule({
        id: "tonleitern",
        title: "Tonleitern",
        rounds: 8,
        levels: levels
    });
})();
