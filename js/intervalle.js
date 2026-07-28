/* ============================================================================
   Modul Intervalle — Intervalle zwischen zwei Noten bestimmen und aufbauen.
   ========================================================================== */
const IntervallApp = (function () {

    const NATURALS = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4",
                      "c/5", "d/5", "e/5", "f/5", "g/5", "a/5"];

    const ROOTS_MIT_VORZEICHEN = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4",
                                  "f#/4", "bb/4", "eb/4", "c#/4", "ab/4",
                                  "c/5", "d/5", "e/5", "f/5"];

    // Alle gebräuchlichen Intervalle als Stufenzahl + Halbtonabstand
    const STANDARD = [
        { n: 1, s: 0 },  { n: 2, s: 1 },  { n: 2, s: 2 },  { n: 3, s: 3 },
        { n: 3, s: 4 },  { n: 4, s: 5 },  { n: 5, s: 7 },  { n: 6, s: 8 },
        { n: 6, s: 9 },  { n: 7, s: 10 }, { n: 7, s: 11 }, { n: 8, s: 12 }
    ];

    const NUMBER_BUTTONS = Core.INTERVAL_NAMES.slice();
    const FULL_BUTTONS = STANDARD.map(function (iv) {
        return Core.intervalInfo("c/4", Core.noteAbove("c/4", iv.n, iv.s)).full;
    });

    const NOTE_BUTTONS = Core.NOTE_BUTTONS;

    const recent = [];
    const STAFF_OPTS = { width: 440, scale: 1.7, staveWidth: 215, height: 180 };

    /* --------------------------------------------------------- Aufgabenwahl */

    // Grundtöne fürs Bauen bleiben in der vierten Oktave, damit die Aufgabe
    // "Setze eine Quinte über D" eindeutig ist.
    const BAU_ROOTS = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4"];
    const BAU_ROOTS_VZ = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4",
                          "f#/4", "bb/4", "eb/4", "ab/4"];

    /* Zwei Stammtöne, aufwärts, höchstens eine Oktave auseinander. */
    function naturalPair(needQuality) {
        for (let tries = 0; tries < 60; tries++) {
            const i = Math.floor(Math.random() * (NATURALS.length - 1));
            const offset = Core.pick([0, 1, 2, 3, 4, 5, 6, 7, 1, 2, 3, 4, 5, 6, 7]);
            const j = i + offset;
            if (j >= NATURALS.length) continue;
            const info = Core.intervalInfo(NATURALS[i], NATURALS[j]);
            if (needQuality && !info.quality) continue;   // Tritonus überspringen
            return { low: NATURALS[i], high: NATURALS[j], info: info };
        }
        return { low: "c/4", high: "e/4", info: Core.intervalInfo("c/4", "e/4") };
    }

    /* Grundton mit Vorzeichen plus ein Standardintervall darüber. */
    function accidentalPair() {
        for (let tries = 0; tries < 60; tries++) {
            const low = Core.pick(ROOTS_MIT_VORZEICHEN);
            const iv = Core.pick(STANDARD);
            const high = Core.noteAbove(low, iv.n, iv.s);
            if (!Core.isUsable(high)) continue;                    // z.B. Ces oder Heses
            if (Core.midi(high) > Core.midi("c/6")) continue;      // außerhalb der Klaviatur
            return { low: low, high: high, info: Core.intervalInfo(low, high) };
        }
        return { low: "c/4", high: "g/4", info: Core.intervalInfo("c/4", "g/4") };
    }

    function drawPair(ctx, low, high, colors) {
        ctx.staff([low, high], Object.assign({ colors: colors || [] }, STAFF_OPTS));
    }

    /* -------------------------------------------------------- Aufgabentypen */

    /* Zwei Noten stehen da, das Intervall soll benannt werden. */
    function bestimmen(ctx, opts) {
        const pair = opts.withAccidentals ? accidentalPair() : naturalPair(opts.quality);
        const answer = opts.quality ? pair.info.full : pair.info.name;

        ctx.task("Welches Intervall ist das?");
        drawPair(ctx, pair.low, pair.high);

        if (opts.keyboard) {
            ctx.keyboard("c/4", "c/6", null);
            [pair.low, pair.high].forEach(function (k) {
                const e = ctx.keyEl(Core.midi(k));
                if (e) ctx.paintKey(e, "#3b5bdb");
            });
            ctx.hint("Zähle auf der Klaviatur die Halbtonschritte zwischen den beiden Tönen.");
        } else {
            ctx.keyboard(false);
        }

        ctx.answers(opts.quality ? FULL_BUTTONS : NUMBER_BUTTONS, function (choice) {
            if (choice === answer) {
                drawPair(ctx, pair.low, pair.high, ["#12b76a", "#12b76a"]);
                ctx.solved(Core.german(pair.low) + " – " + Core.german(pair.high) +
                           " = " + pair.info.full);
            } else {
                ctx.failed("Das stimmt noch nicht. " + Core.german(pair.low) +
                           " und " + Core.german(pair.high) + " genau anschauen!");
            }
        });
    }

    /* Ein Intervall ist genannt, der zweite Ton soll gesetzt werden. */
    function bauen(ctx, opts) {
        let low, iv, target;
        for (let tries = 0; tries < 60; tries++) {
            low = Core.pickFresh(opts.withAccidentals ? BAU_ROOTS_VZ : BAU_ROOTS, recent, 2);
            iv = Core.pick(STANDARD);
            target = Core.noteAbove(low, iv.n, iv.s);
            if (Core.isUsable(target) && Core.midi(target) <= Core.midi("c/6")) break;
        }
        const info = Core.intervalInfo(low, target);

        ctx.task("Setze eine " + info.full + " über " + Core.german(low) + ".");
        ctx.staff([low], STAFF_OPTS);

        function success() {
            ctx.staff([low, target], Object.assign({ colors: ["black", "#12b76a"] }, STAFF_OPTS));
            ctx.solved("Richtig: " + Core.german(low) + " – " + Core.german(target) +
                       " ist eine " + info.full + ".");
        }

        if (opts.keyboard) {
            ctx.clearAnswers();
            ctx.keyboard("c/4", "c/6", function (m, keyEl) {
                if (m === Core.midi(target)) {
                    ctx.paintKey(keyEl, "#12b76a");
                    success();
                } else {
                    ctx.paintKey(keyEl, "#e5484d");
                    ctx.failed("Noch nicht richtig — zähle die Halbtonschritte ab " + Core.german(low) + ".");
                    setTimeout(function () { ctx.resetKeys(); }, 900);
                }
            });
        } else {
            ctx.keyboard(false);
            ctx.answers(NOTE_BUTTONS, function (name) {
                if (name === Core.german(target)) {
                    success();
                } else {
                    ctx.failed("Nicht " + name + " — achte auch auf die Schreibweise.");
                }
            });
        }
    }

    /* -------------------------------------------------------------- Level */

    function level(label, fn, opts) {
        return { label: label, start: function (ctx) { fn(ctx, opts); } };
    }

    const levels = [
        level("Intervall benennen, mit Klaviatur", bestimmen, { quality: false, keyboard: true }),
        level("Intervall benennen", bestimmen, { quality: false, keyboard: false }),
        level("Mit Qualität, mit Klaviatur", bestimmen, { quality: true, keyboard: true }),
        level("Mit Qualität", bestimmen, { quality: true, keyboard: false }),
        level("Mit Vorzeichen", bestimmen, { quality: true, keyboard: false, withAccidentals: true }),
        level("Intervall bauen, mit Klaviatur", bauen, { keyboard: true }),
        level("Intervall bauen in Noten", bauen, { keyboard: false }),
        {
            label: "Gemischt ohne Hilfen",
            start: function (ctx) {
                if (Math.random() < 0.5) bestimmen(ctx, { quality: true, keyboard: false, withAccidentals: true });
                else bauen(ctx, { keyboard: false, withAccidentals: true });
            }
        }
    ];

    return Core.createModule({
        id: "intervalle",
        title: "Intervalle",
        rounds: 15,
        levels: levels
    });
})();
