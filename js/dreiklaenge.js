/* ============================================================================
   Modul Dreiklänge — Dur- und Moll-Dreiklänge in Grundstellung selbst bauen,
   in den oberen Leveln auch benennen.
   ========================================================================== */
const DreiklangApp = (function () {

    const DUR_LEICHT = ["c/4", "f/4", "g/4", "d/4"];
    const MOLL_LEICHT = ["a/4", "d/4", "e/4", "g/4"];
    const DUR_ALLE   = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "bb/4", "eb/4"];
    const MOLL_ALLE  = ["a/4", "d/4", "e/4", "g/4", "b/4", "c/4", "f#/4"];

    const NOTE_BUTTONS = Core.NOTE_BUTTONS;

    const recent = [];
    const STAFF_OPTS = { width: 400, scale: 1.7, staveWidth: 175, height: 180, chord: true };

    const HINTS = {
        dur:  "<b>Dur</b> = große Terz (4 Halbtöne) über dem Grundton, darüber eine kleine Terz (3 Halbtöne).",
        moll: "<b>Moll</b> = kleine Terz (3 Halbtöne) über dem Grundton, darüber eine große Terz (4 Halbtöne)."
    };

    function chordName(root, type) {
        return Core.german(root) + "-" + (type === "dur" ? "Dur" : "Moll");
    }

    function drawChord(ctx, notes, colors) {
        ctx.staff(notes, Object.assign({ colors: colors || [] }, STAFF_OPTS));
    }

    /* ------------------------------------------------------------ Bauen */

    function bauen(ctx, opts) {
        const type = opts.types.length > 1 ? Core.pick(opts.types) : opts.types[0];
        const root = Core.pickFresh(opts.roots[type], recent, 2);
        const triad = Core.buildTriad(root, type);
        let placed = 1;

        ctx.task("Baue den " + chordName(root, type) + "-Dreiklang.");
        ctx.hint(opts.hint ? HINTS[type] : "");
        drawChord(ctx, triad.slice(0, 1));

        function accept() {
            placed++;
            drawChord(ctx, triad.slice(0, placed));
            if (placed >= triad.length) {
                drawChord(ctx, triad, ["#12b76a", "#12b76a", "#12b76a"]);
                ctx.solved(chordName(root, type) + " = " +
                           triad.map(Core.german).join(" – "));
            } else {
                ctx.feedback("Richtig — jetzt noch die Quinte.", "#12b76a");
            }
        }

        function markPlacedKeys() {
            ctx.resetKeys();
            for (let i = 0; i < placed; i++) {
                const k = ctx.keyEl(Core.midi(triad[i]));
                if (k) ctx.paintKey(k, "#12b76a");
            }
        }

        if (opts.keyboard) {
            ctx.clearAnswers();
            ctx.keyboard("c/4", "c/6", function (m, keyEl) {
                if (placed >= triad.length) return;
                if (m === Core.midi(triad[placed])) {
                    ctx.paintKey(keyEl, "#12b76a");
                    accept();
                } else {
                    ctx.paintKey(keyEl, "#e5484d");
                    ctx.failed(placed === 1
                        ? "Das ist nicht die richtige Terz."
                        : "Das ist nicht die richtige Quinte.");
                    setTimeout(markPlacedKeys, 900);
                }
            });
            markPlacedKeys();
        } else {
            ctx.keyboard(false);
            ctx.answers(NOTE_BUTTONS, function (name) {
                if (placed >= triad.length) return;
                if (name === Core.german(triad[placed])) {
                    accept();
                } else {
                    ctx.failed("Nicht " + name + " — rechne die Terz vom letzten Ton aus.");
                }
            });
        }
    }

    /* ---------------------------------------------------------- Benennen */

    function benennen(ctx) {
        const type = Core.pick(["dur", "moll"]);
        const root = Core.pickFresh(type === "dur" ? DUR_ALLE : MOLL_ALLE, recent, 2);
        const triad = Core.buildTriad(root, type);

        drawChord(ctx, triad);
        ctx.hint("");

        askRoot();

        function askRoot() {
            ctx.task("Welcher Ton ist der Grundton dieses Dreiklangs?");
            ctx.answers(NOTE_BUTTONS, function (name) {
                if (name === Core.german(root)) {
                    ctx.feedback("Grundton stimmt!", "#12b76a");
                    askType();
                } else {
                    ctx.failed("Der Grundton ist die unterste Note — schau noch einmal hin.");
                }
            });
        }

        function askType() {
            ctx.task("Ist das ein Dur- oder ein Moll-Dreiklang?");
            ctx.answers([
                { label: "Dur",  value: "dur",  color: "#f97316" },
                { label: "Moll", value: "moll", color: "#7c3aed" }
            ], function (choice) {
                if (choice === type) {
                    drawChord(ctx, triad, ["#12b76a", "#12b76a", "#12b76a"]);
                    ctx.solved("Richtig: " + chordName(root, type) + "-Dreiklang aus " +
                               triad.map(Core.german).join(" – "));
                } else {
                    ctx.failed("Nicht ganz — entscheidend ist die untere Terz: 4 Halbtöne bedeuten Dur, 3 bedeuten Moll.");
                }
            });
        }
    }

    /* -------------------------------------------------------------- Level */

    function bauLevel(label, opts) {
        return { label: label, start: function (ctx) { bauen(ctx, opts); } };
    }

    const levels = [
        bauLevel("Dur mit Klaviatur und Hilfe", {
            types: ["dur"], roots: { dur: DUR_LEICHT }, keyboard: true, hint: true }),
        bauLevel("Dur und Moll mit Klaviatur und Hilfe", {
            types: ["dur", "moll"], roots: { dur: DUR_LEICHT, moll: MOLL_LEICHT },
            keyboard: true, hint: true }),
        bauLevel("Dur und Moll mit Klaviatur", {
            types: ["dur", "moll"], roots: { dur: DUR_ALLE, moll: MOLL_ALLE },
            keyboard: true, hint: false }),
        bauLevel("In Noten schreiben, mit Hilfe", {
            types: ["dur", "moll"], roots: { dur: DUR_LEICHT, moll: MOLL_LEICHT },
            keyboard: false, hint: true }),
        bauLevel("In Noten schreiben", {
            types: ["dur", "moll"], roots: { dur: DUR_ALLE, moll: MOLL_ALLE },
            keyboard: false, hint: false }),
        { label: "Dreiklänge benennen", start: benennen }
    ];

    return Core.createModule({
        id: "dreiklaenge",
        title: "Dreiklänge",
        rounds: 12,
        levels: levels
    });
})();
