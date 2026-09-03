/* ============================================================================
   Modul: Pausenwerte & Rhythmus (Ohne punktierte Pausen)
   Didaktisch gegliederte Level für Schüler auf dem iPad:
   - Level 1: Grundpausen (Ganze, Halbe, Viertel) mit visuellen Merkhilfen
   - Level 2: Schnelle Pausen (Achtel & 16tel)
   - Level 3: Alle Pausenwerte gemischt
   - Level 4: Zählzeiten & Dauer im 4/4-Takt
   - Level 5: Note <-> Pause Zuordnung (Gleiche Dauer)
   - Level 6: Pausen-Pyramide (Verhältnisse)
   - Level 7: Pausen-Rechenrätsel (Summen)
   - Level 8: Takt mit passender Pause vervollständigen
   ========================================================================== */

const PausenApp = (function () {

    const REST_NAMES = {
        "wr": "Ganze Pause",
        "hr": "Halbe Pause",
        "qr": "Viertelpause",
        "8r": "Achtelpause",
        "16r": "Sechzehntelpause"
    };

    // ------------------------------------------------ Level 1: Grundpausen
    const bagL1 = Core.createBag([
        { dur: "wr", name: "Ganze Pause", hint: "Hängt an der 4. Linie (wie eine schwere Last)." },
        { dur: "hr", name: "Halbe Pause", hint: "Liegt auf der 3. Linie (wie ein Hut)." },
        { dur: "qr", name: "Viertelpause", hint: "Sieht aus wie ein gezackter Blitz." }
    ], x => x.dur);

    const level1 = {
        label: "Grundpausen (Ganze, Halbe, Viertel)",
        reset: () => bagL1.neu(),
        start: function (ctx) {
            const task = bagL1.next();
            ctx.task("Welcher Pausenwert ist das?");
            ctx.hint("");
            ctx.staff([{ key: "b/4", duration: task.dur, rest: true }]);

            const options = ["Ganze Pause", "Halbe Pause", "Viertelpause"];
            ctx.answers(options, function (choice) {
                if (choice === task.name) {
                    ctx.solved(`Richtig! Das ist eine ${task.name}. (${task.hint})`);
                } else {
                    ctx.failed(`Nicht ganz. ${task.hint}`);
                }
            });
        }
    };

    // ------------------------------------------------ Level 2: Schnelle Pausen
    const bagL2 = Core.createBag([
        { dur: "8r", name: "Achtelpause", hint: "Hat 1 Häkchen nach links oben." },
        { dur: "16r", name: "Sechzehntelpause", hint: "Hat 2 Häkchen nach links oben." }
    ], x => x.dur);

    const level2 = {
        label: "Schnelle Pausen (Achtel & 16tel)",
        reset: () => bagL2.neu(),
        start: function (ctx) {
            const task = bagL2.next();
            ctx.task("Welcher Pausenwert ist das?");
            ctx.hint("");
            ctx.staff([{ key: "b/4", duration: task.dur, rest: true }]);

            const options = ["Viertelpause", "Achtelpause", "Sechzehntelpause", "Halbe Pause"];
            ctx.answers(options, function (choice) {
                if (choice === task.name) {
                    ctx.solved(`Genau! Das ist eine ${task.name}.`);
                } else {
                    ctx.failed(`Falsch. Zähle die Häkchen am oberen Ende der Pause!`);
                }
            });
        }
    };

    // ------------------------------------------------ Level 3: Alle Pausenwerte gemischt
    const bagL3 = Core.createBag([
        { dur: "wr", name: "Ganze Pause", hint: "Hängt an der 4. Linie" },
        { dur: "hr", name: "Halbe Pause", hint: "Liegt auf der 3. Linie" },
        { dur: "qr", name: "Viertelpause", hint: "Blitz-Form" },
        { dur: "8r", name: "Achtelpause", hint: "1 Häkchen" },
        { dur: "16r", name: "Sechzehntelpause", hint: "2 Häkchen" }
    ], x => x.dur);

    const level3 = {
        label: "Alle Pausenwerte (Ganze bis 16tel)",
        reset: () => bagL3.neu(),
        start: function (ctx) {
            const task = bagL3.next();
            ctx.task("Welcher Pausenwert ist das?");
            ctx.hint("");
            ctx.staff([{ key: "b/4", duration: task.dur, rest: true }]);

            const options = ["Ganze Pause", "Halbe Pause", "Viertelpause", "Achtelpause", "Sechzehntelpause"];
            ctx.answers(options, function (choice) {
                if (choice === task.name) {
                    ctx.solved(`Korrekt! Das ist eine ${task.name}.`);
                } else {
                    ctx.failed(`Leider falsch! Schau genau auf Position und Form der Pause.`);
                }
            });
        }
    };

    // ------------------------------------------------ Level 4: Zählzeiten der Pausen im 4/4-Takt
    const bagL4 = Core.createBag([
        { dur: "wr", beats: "4 Schläge Stille", text: "Ganze Pause = 4 Schläge Stille" },
        { dur: "hr", beats: "2 Schläge Stille", text: "Halbe Pause = 2 Schläge Stille" },
        { dur: "qr", beats: "1 Schlag Stille", text: "Viertelpause = 1 Schlag Stille" },
        { dur: "8r", beats: "½ Schlag Stille", text: "Achtelpause = ½ Schlag Stille" },
        { dur: "16r", beats: "¼ Schlag Stille", text: "Sechzehntelpause = ¼ Schlag Stille" }
    ], x => x.dur);

    const level4 = {
        label: "Zählzeiten & Dauer im 4/4-Takt",
        reset: () => bagL4.neu(),
        start: function (ctx) {
            const task = bagL4.next();
            ctx.task("Wie viele Schläge Stille bedeutet diese Pause im 4/4-Takt?");
            ctx.hint("");
            ctx.staff([{ key: "b/4", duration: task.dur, rest: true }]);

            const options = ["4 Schläge Stille", "2 Schläge Stille", "1 Schlag Stille", "½ Schlag Stille", "¼ Schlag Stille"];
            ctx.answers(options, function (choice) {
                if (choice === task.beats) {
                    ctx.solved(`Ausgezeichnet! ${task.text}.`);
                } else {
                    ctx.failed(`Das stimmt nicht. Eine Pause dauert exakt so viele Schläge wie die gleichnamige Note.`);
                }
            });
        }
    };

    // ------------------------------------------------ Level 5: Note <-> Pause Zuordnung
    const noteRestPairs = [
        { noteDur: "w", noteName: "Ganze Note", restDur: "wr", restName: "Ganze Pause", beats: "4 Schläge" },
        { noteDur: "h", noteName: "Halbe Note", restDur: "hr", restName: "Halbe Pause", beats: "2 Schläge" },
        { noteDur: "q", noteName: "Viertelnote", restDur: "qr", restName: "Viertelpause", beats: "1 Schlag" },
        { noteDur: "8", noteName: "Achtelnote", restDur: "8r", restName: "Achtelpause", beats: "½ Schlag" },
        { noteDur: "16", noteName: "Sechzehntelnote", restDur: "16r", restName: "Sechzehntelpause", beats: "¼ Schlag" }
    ];

    const bagL5 = Core.createBag(noteRestPairs, x => x.noteDur);

    const level5 = {
        label: "Note & Pause zuordnen (Gleiche Dauer)",
        reset: () => bagL5.neu(),
        start: function (ctx) {
            const task = bagL5.next();
            ctx.task(`Welche Pause dauert genauso lang wie diese <b>${task.noteName}</b>?`);
            ctx.hint("");
            ctx.staff([{ key: "b/4", duration: task.noteDur }]);

            const options = ["Ganze Pause", "Halbe Pause", "Viertelpause", "Achtelpause", "Sechzehntelpause"];
            ctx.answers(options, function (choice) {
                if (choice === task.restName) {
                    ctx.solved(`Perfekt! ${task.noteName} und ${task.restName} dauern beide ${task.beats}.`);
                } else {
                    ctx.failed(`Nicht ganz. Die gesuchte Pause muss genauso lang dauern wie die ${task.noteName}.`);
                }
            });
        }
    };

    // ------------------------------------------------ Level 6: Pausen-Pyramide (Verhältnisse)
    const restProportions = [
        {
            rest: [{ key: "b/4", duration: "hr", rest: true }],
            target: "Viertelpausen",
            answer: "2 Viertelpausen",
            explanation: "1 Halbe Pause (2 Schläge) = 2 Viertelpausen (1 + 1 Schlag)",
            options: ["2 Viertelpausen", "4 Viertelpausen", "1 Viertelpause", "8 Viertelpausen"]
        },
        {
            rest: [{ key: "b/4", duration: "wr", rest: true }],
            target: "Halbe Pausen",
            answer: "2 Halbe Pausen",
            explanation: "1 Ganze Pause (4 Schläge) = 2 Halbe Pausen (2 + 2 Schläge)",
            options: ["2 Halbe Pausen", "4 Halbe Pausen", "3 Halbe Pausen", "1 Halbe Pause"]
        },
        {
            rest: [{ key: "b/4", duration: "wr", rest: true }],
            target: "Viertelpausen",
            answer: "4 Viertelpausen",
            explanation: "1 Ganze Pause (4 Schläge) = 4 Viertelpausen (4 × 1 Schlag)",
            options: ["4 Viertelpausen", "2 Viertelpausen", "8 Viertelpausen", "6 Viertelpausen"]
        },
        {
            rest: [{ key: "b/4", duration: "qr", rest: true }],
            target: "Achtelpausen",
            answer: "2 Achtelpausen",
            explanation: "1 Viertelpause (1 Schlag) = 2 Achtelpausen (½ + ½ Schlag)",
            options: ["2 Achtelpausen", "4 Achtelpausen", "1 Achtelpause", "3 Achtelpausen"]
        },
        {
            rest: [{ key: "b/4", duration: "hr", rest: true }],
            target: "Achtelpausen",
            answer: "4 Achtelpausen",
            explanation: "1 Halbe Pause (2 Schläge) = 4 Achtelpausen (4 × ½ Schlag)",
            options: ["4 Achtelpausen", "2 Achtelpausen", "8 Achtelpausen", "6 Achtelpausen"]
        },
        {
            rest: [{ key: "b/4", duration: "8r", rest: true }],
            target: "Sechzehntelpausen",
            answer: "2 Sechzehntelpausen",
            explanation: "1 Achtelpause (½ Schlag) = 2 Sechzehntelpausen (¼ + ¼ Schlag)",
            options: ["2 Sechzehntelpausen", "4 Sechzehntelpausen", "1 Sechzehntelpause", "3 Sechzehntelpausen"]
        }
    ];

    const bagL6 = Core.createBag(restProportions, p => p.explanation);

    const level6 = {
        label: "Pausen-Pyramide (Verhältnisse)",
        reset: () => bagL6.neu(),
        start: function (ctx) {
            const task = bagL6.next();
            ctx.task(`Wie viele <b>${task.target}</b> haben denselben Wert wie diese Pause?`);
            ctx.hint("");
            ctx.staff(task.rest);

            ctx.answers(task.options, function (choice) {
                if (choice === task.answer) {
                    ctx.solved(`Hervorragend! ${task.explanation}.`);
                } else {
                    ctx.failed(`Das stimmt nicht ganz. Überlege: Wie viele Schläge hat die Pause und wie viele Schläge hat die gesuchte Einheit?`);
                }
            });
        }
    };

    // ------------------------------------------------ Level 7: Pausen-Rechenrätsel (Summen ohne Punkte)
    const restPuzzles = [
        {
            rests: [{ key: "b/4", duration: "qr", rest: true }, { key: "b/4", duration: "qr", rest: true }],
            answer: "Halbe Pause",
            explanation: "1 Schlag + 1 Schlag = 2 Schläge (Halbe Pause)",
            options: ["Ganze Pause", "Halbe Pause", "Viertelpause", "Achtelpause"]
        },
        {
            rests: [{ key: "b/4", duration: "hr", rest: true }, { key: "b/4", duration: "hr", rest: true }],
            answer: "Ganze Pause",
            explanation: "2 Schläge + 2 Schläge = 4 Schläge (Ganze Pause)",
            options: ["Ganze Pause", "Halbe Pause", "Viertelpause", "Achtelpause"]
        },
        {
            rests: [{ key: "b/4", duration: "8r", rest: true }, { key: "b/4", duration: "8r", rest: true }],
            answer: "Viertelpause",
            explanation: "½ Schlag + ½ Schlag = 1 Schlag (Viertelpause)",
            options: ["Halbe Pause", "Viertelpause", "Achtelpause", "Sechzehntelpause"]
        },
        {
            rests: [{ key: "b/4", duration: "qr", rest: true }, { key: "b/4", duration: "qr", rest: true }, { key: "b/4", duration: "hr", rest: true }],
            answer: "Ganze Pause",
            explanation: "1 + 1 + 2 = 4 Schläge (Ganze Pause)",
            options: ["Ganze Pause", "Halbe Pause", "Viertelpause", "Achtelpause"]
        },
        {
            rests: [{ key: "b/4", duration: "16r", rest: true }, { key: "b/4", duration: "16r", rest: true }],
            answer: "Achtelpause",
            explanation: "¼ + ¼ = ½ Schlag (Achtelpause)",
            options: ["Achtelpause", "Viertelpause", "Halbe Pause", "Sechzehntelpause"]
        }
    ];

    const bagL7 = Core.createBag(restPuzzles, p => p.answer + p.explanation);

    const level7 = {
        label: "Pausenwerte addieren (Pausen-Mathe)",
        reset: () => bagL7.neu(),
        start: function (ctx) {
            const task = bagL7.next();
            ctx.task("Welcher einzelne Pausenwert entspricht dieser Summe?");
            ctx.hint("");
            ctx.staff(task.rests);

            ctx.answers(task.options, function (choice) {
                if (choice === task.answer) {
                    ctx.solved(`Richtig gerechnet! ${task.explanation}.`);
                } else {
                    ctx.failed(`Nicht ganz. Zähle die Zählzeiten jeder Pause einzeln zusammen!`);
                }
            });
        }
    };

    // ------------------------------------------------ Level 8: Takt mit Pausen vervollständigen (4/4-Takt ohne Punkte)
    const barCompletions = [
        {
            existing: [{ key: "b/4", duration: "h" }, { key: "b/4", duration: "q" }],
            missing: "Viertelpause",
            currentSum: "3 Schläge",
            explanation: "Vorhanden: 2 + 1 = 3 Schläge Note. Um den 4/4-Takt zu füllen, fehlt 1 Schlag Pause (Viertelpause).",
            options: ["Viertelpause", "Halbe Pause", "Achtelpause", "Ganze Pause"]
        },
        {
            existing: [{ key: "b/4", duration: "h" }],
            missing: "Halbe Pause",
            currentSum: "2 Schläge",
            explanation: "Vorhanden: 2 Schläge Note. Es fehlen 2 Schläge Pause (Halbe Pause).",
            options: ["Halbe Pause", "Viertelpause", "Ganze Pause", "Achtelpause"]
        },
        {
            existing: [{ key: "b/4", duration: "q" }, { key: "b/4", duration: "q" }, { key: "b/4", duration: "q" }],
            missing: "Viertelpause",
            currentSum: "3 Schläge",
            explanation: "Vorhanden: 3 Viertelnoten = 3 Schläge. Es fehlt 1 Viertelpause.",
            options: ["Viertelpause", "Halbe Pause", "Achtelpause", "Ganze Pause"]
        },
        {
            existing: [{ key: "b/4", duration: "q" }, { key: "b/4", duration: "q" }],
            missing: "Halbe Pause",
            currentSum: "2 Schläge",
            explanation: "Vorhanden: 1 + 1 = 2 Schläge Note. Es fehlen 2 Schläge Pause (Halbe Pause).",
            options: ["Halbe Pause", "Viertelpause", "Ganze Pause", "Achtelpause"]
        },
        {
            existing: [{ key: "b/4", duration: "h" }, { key: "b/4", duration: "8" }, { key: "b/4", duration: "8" }],
            missing: "Viertelpause",
            currentSum: "3 Schläge",
            explanation: "Vorhanden: 2 + ½ + ½ = 3 Schläge Note. Es fehlt 1 Schlag Pause (Viertelpause).",
            options: ["Viertelpause", "Achtelpause", "Halbe Pause", "Ganze Pause"]
        }
    ];

    const bagL8 = Core.createBag(barCompletions, b => b.missing + b.currentSum);

    const level8 = {
        label: "Takt mit Pausen vervollständigen (4/4-Takt)",
        reset: () => bagL8.neu(),
        start: function (ctx) {
            const task = bagL8.next();
            ctx.task("Welcher <b>Pausenwert</b> fehlt, um den 4/4-Takt vollständig zu füllen?");
            ctx.hint("");
            ctx.staff(task.existing, { timeSignature: "4/4" });

            ctx.answers(task.options, function (choice) {
                if (choice === task.missing) {
                    ctx.solved(`Hervorragend! ${task.explanation}`);
                } else {
                    ctx.failed(`Das passt nicht. Rechne: 4 Schläge minus vorhandene Noten = benötigte Pause.`);
                }
            });
        }
    };

    // Modul über gemeinsamen Kern erzeugen
    return Core.createModule({
        id: "pausen",
        title: "Pausenwerte & Rhythmus",
        rounds: 20,
        levels: [level1, level2, level3, level4, level5, level6, level7, level8]
    });

})();
