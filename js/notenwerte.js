/* ============================================================================
   Modul: Notenwerte & Rhythmus (Ohne punktierte Noten)
   Didaktisch gegliederte Level für Schüler auf dem iPad:
   - Level 1: Alle Notenwerte auf c¹ (Ganze bis 16tel auf fester Höhe c1)
   - Level 2: Alle Notenwerte auf wechselnden Tonhöhen bis c² (Ganze bis 16tel)
   - Level 3: Notenwerte vergleichen (Welche Note dauert länger?)
   - Level 4: Zählzeiten & Dauer im 4/4-Takt (4, 2, 1, ½, ¼ Schläge)
   - Level 5: Noten-Pyramide (Wie viele Noten passen hinein?)
   - Level 6: Notenwerte addieren (Einfache Summen aus 2 Noten)
   - Level 7: Kombinierte Noten-Rechnungen (3 Noten / gemischte Werte)
   - Level 8: Takt vervollständigen (4/4-Takt)
   ========================================================================== */

const NotenwertApp = (function () {

    const NOTE_PITCHES = ["c/5", "b/4", "a/4", "g/4", "f/4", "e/4", "d/4", "c/4"];

    const ALL_NOTE_VALUES = [
        { dur: "w", name: "Ganze Note" },
        { dur: "h", name: "Halbe Note" },
        { dur: "q", name: "Viertelnote" },
        { dur: "8", name: "Achtelnote" },
        { dur: "16", name: "Sechzehntelnote" }
    ];

    const ALL_OPTIONS = ["Ganze Note", "Halbe Note", "Viertelnote", "Achtelnote", "Sechzehntelnote"];

    // ------------------------------------------------ Level 1: Alle Notenwerte auf c1
    const bagL1 = Core.createBag(ALL_NOTE_VALUES, x => x.dur);

    const level1 = {
        label: "Alle Notenwerte auf c¹",
        reset: () => bagL1.neu(),
        start: function (ctx) {
            const task = bagL1.next();
            ctx.task("Welcher Notenwert ist das?");
            ctx.hint("");
            ctx.staff([{ key: "c/4", duration: task.dur }]);

            ctx.answers(ALL_OPTIONS, function (choice) {
                if (choice === task.name) {
                    ctx.solved(`Richtig! Das ist eine ${task.name}.`);
                } else {
                    ctx.failed(`Nicht ganz. Das ist keine ${choice}.`);
                }
            });
        }
    };

    // ------------------------------------------------ Level 2: Alle Notenwerte auf wechselnden Tonhöhen bis c2
    const bagL2 = Core.createBag(ALL_NOTE_VALUES, x => x.dur);
    const pitchesL2 = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4", "c/5"];
    const pitchBagL2 = Core.createBag(pitchesL2);

    const level2 = {
        label: "Alle Notenwerte (unterschiedliche Höhen bis c²)",
        reset: () => { bagL2.neu(); pitchBagL2.neu(); },
        start: function (ctx) {
            const task = bagL2.next();
            const pitch = pitchBagL2.next();
            ctx.task("Welcher Notenwert ist das?");
            ctx.hint("");
            ctx.staff([{ key: pitch, duration: task.dur }]);

            ctx.answers(ALL_OPTIONS, function (choice) {
                if (choice === task.name) {
                    ctx.solved(`Genau! Das ist eine ${task.name}.`);
                } else {
                    ctx.failed(`Leider falsch! Schau genau auf Notenkopf, Hals und Fähnchen.`);
                }
            });
        }
    };

    // ------------------------------------------------ Level 3: Notenwerte vergleichen (Dauer)
    const comparisons = [
        {
            notes: [{ key: "c/5", duration: "w" }, { key: "e/4", duration: "h" }],
            answer: "Die linke Note (1)",
            explanation: "Ganze Note (4 Schläge) ist länger als Halbe Note (2 Schläge).",
            options: ["Die linke Note (1)", "Die rechte Note (2)", "Beide gleich lang"]
        },
        {
            notes: [{ key: "d/4", duration: "q" }, { key: "g/4", duration: "h" }],
            answer: "Die rechte Note (2)",
            explanation: "Halbe Note (2 Schläge) ist länger als Viertelnote (1 Schlag).",
            options: ["Die linke Note (1)", "Die rechte Note (2)", "Beide gleich lang"]
        },
        {
            notes: [{ key: "e/4", duration: "8" }, { key: "c/5", duration: "q" }],
            answer: "Die rechte Note (2)",
            explanation: "Viertelnote (1 Schlag) ist länger als Achtelnote (½ Schlag).",
            options: ["Die linke Note (1)", "Die rechte Note (2)", "Beide gleich lang"]
        },
        {
            notes: [{ key: "g/4", duration: "16" }, { key: "f/4", duration: "8" }],
            answer: "Die rechte Note (2)",
            explanation: "Achtelnote (½ Schlag) ist länger als Sechzehntelnote (¼ Schlag).",
            options: ["Die linke Note (1)", "Die rechte Note (2)", "Beide gleich lang"]
        },
        {
            notes: [{ key: "c/5", duration: "h" }, { key: "c/4", duration: "h" }],
            answer: "Beide gleich lang",
            explanation: "Beides sind Halbe Noten (jeweils 2 Schläge).",
            options: ["Die linke Note (1)", "Die rechte Note (2)", "Beide gleich lang"]
        },
        {
            notes: [{ key: "a/4", duration: "q" }, { key: "b/4", duration: "q" }],
            answer: "Beide gleich lang",
            explanation: "Beides sind Viertelnoten (jeweils 1 Schlag).",
            options: ["Die linke Note (1)", "Die rechte Note (2)", "Beide gleich lang"]
        }
    ];

    const bagL3 = Core.createBag(comparisons, c => c.explanation);

    const level3 = {
        label: "Notenwerte vergleichen (Dauer)",
        reset: () => bagL3.neu(),
        start: function (ctx) {
            const task = bagL3.next();
            ctx.task("Welche der beiden Noten dauert <b>länger</b>?");
            ctx.hint("");
            ctx.staff(task.notes);

            ctx.answers(task.options, function (choice) {
                if (choice === task.answer) {
                    ctx.solved(`Richtig erkannt! ${task.explanation}`);
                } else {
                    ctx.failed(`Nicht ganz. Achte auf die Notenform und deren Schläge!`);
                }
            });
        }
    };

    // ------------------------------------------------ Level 4: Zählzeiten im 4/4-Takt
    const bagL4 = Core.createBag([
        { dur: "w", beats: "4 Schläge", text: "Ganze Note = 4 Schläge" },
        { dur: "h", beats: "2 Schläge", text: "Halbe Note = 2 Schläge" },
        { dur: "q", beats: "1 Schlag", text: "Viertelnote = 1 Schlag" },
        { dur: "8", beats: "½ Schlag", text: "Achtelnote = ½ Schlag" },
        { dur: "16", beats: "¼ Schlag", text: "Sechzehntelnote = ¼ Schlag" }
    ], x => x.dur);

    const level4 = {
        label: "Zählzeiten & Dauer im 4/4-Takt",
        reset: () => bagL4.neu(),
        start: function (ctx) {
            const task = bagL4.next();
            const pitch = Core.pick(NOTE_PITCHES);
            ctx.task("Wie viele Schläge dauert diese Note im 4/4-Takt?");
            ctx.hint("");
            ctx.staff([{ key: pitch, duration: task.dur }]);

            const options = ["4 Schläge", "2 Schläge", "1 Schlag", "½ Schlag", "¼ Schlag"];
            ctx.answers(options, function (choice) {
                if (choice === task.beats) {
                    ctx.solved(`Ausgezeichnet! ${task.text}.`);
                } else {
                    ctx.failed(`Das stimmt nicht. Überlege, wie oft diese Note in einen 4/4-Takt passt.`);
                }
            });
        }
    };

    // ------------------------------------------------ Level 5: Noten-Pyramide (Verhältnisse)
    const proportions = [
        {
            note: [{ key: "b/4", duration: "h" }],
            target: "Viertelnoten",
            answer: "2 Viertelnoten",
            explanation: "1 Halbe Note (2 Schläge) = 2 Viertelnoten (1 + 1 Schlag)",
            options: ["2 Viertelnoten", "4 Viertelnoten", "1 Viertelnote", "8 Viertelnoten"]
        },
        {
            note: [{ key: "b/4", duration: "w" }],
            target: "Halbe Noten",
            answer: "2 Halbe Noten",
            explanation: "1 Ganze Note (4 Schläge) = 2 Halbe Noten (2 + 2 Schläge)",
            options: ["2 Halbe Noten", "4 Halbe Noten", "3 Halbe Noten", "1 Halbe Note"]
        },
        {
            note: [{ key: "b/4", duration: "w" }],
            target: "Viertelnoten",
            answer: "4 Viertelnoten",
            explanation: "1 Ganze Note (4 Schläge) = 4 Viertelnoten (1 + 1 + 1 + 1 Schlag)",
            options: ["4 Viertelnoten", "2 Viertelnoten", "8 Viertelnoten", "6 Viertelnoten"]
        },
        {
            note: [{ key: "b/4", duration: "q" }],
            target: "Achtelnoten",
            answer: "2 Achtelnoten",
            explanation: "1 Viertelnote (1 Schlag) = 2 Achtelnoten (½ + ½ Schlag)",
            options: ["2 Achtelnoten", "4 Achtelnoten", "1 Achtelnote", "3 Achtelnoten"]
        },
        {
            note: [{ key: "b/4", duration: "h" }],
            target: "Achtelnoten",
            answer: "4 Achtelnoten",
            explanation: "1 Halbe Note (2 Schläge) = 4 Achtelnoten (4 × ½ Schlag)",
            options: ["4 Achtelnoten", "2 Achtelnoten", "8 Achtelnoten", "6 Achtelnoten"]
        },
        {
            note: [{ key: "b/4", duration: "8" }],
            target: "Sechzehntelnoten",
            answer: "2 Sechzehntelnoten",
            explanation: "1 Achtelnote (½ Schlag) = 2 Sechzehntelnoten (¼ + ¼ Schlag)",
            options: ["2 Sechzehntelnoten", "4 Sechzehntelnoten", "1 Sechzehntelnote", "3 Sechzehntelnoten"]
        }
    ];

    const bagL5 = Core.createBag(proportions, p => p.explanation);

    const level5 = {
        label: "Noten-Pyramide (Verhältnisse)",
        reset: () => bagL5.neu(),
        start: function (ctx) {
            const task = bagL5.next();
            ctx.task(`Wie viele <b>${task.target}</b> haben denselben Wert wie diese Note?`);
            ctx.hint("");
            ctx.staff(task.note);

            ctx.answers(task.options, function (choice) {
                if (choice === task.answer) {
                    ctx.solved(`Hervorragend! ${task.explanation}.`);
                } else {
                    ctx.failed(`Das stimmt nicht ganz. Überlege: Wie viele Schläge hat die Note und wie viele Schläge hat die gesuchte Einheit?`);
                }
            });
        }
    };

    // ------------------------------------------------ Level 6: Notenwerte addieren (2 Noten)
    const puzzlesBasic = [
        {
            notes: [{ key: "c/4", duration: "q" }, { key: "c/4", duration: "q" }],
            answer: "Halbe Note",
            explanation: "1 Schlag + 1 Schlag = 2 Schläge (Halbe Note)",
            options: ["Ganze Note", "Halbe Note", "Viertelnote", "Achtelnote"]
        },
        {
            notes: [{ key: "c/4", duration: "h" }, { key: "c/4", duration: "h" }],
            answer: "Ganze Note",
            explanation: "2 Schläge + 2 Schläge = 4 Schläge (Ganze Note)",
            options: ["Ganze Note", "Halbe Note", "Viertelnote", "Achtelnote"]
        },
        {
            notes: [{ key: "c/4", duration: "8" }, { key: "c/4", duration: "8" }],
            answer: "Viertelnote",
            explanation: "½ Schlag + ½ Schlag = 1 Schlag (Viertelnote)",
            options: ["Halbe Note", "Viertelnote", "Achtelnote", "Sechzehntelnote"]
        },
        {
            notes: [{ key: "c/4", duration: "16" }, { key: "c/4", duration: "16" }],
            answer: "Achtelnote",
            explanation: "¼ + ¼ = ½ Schlag (Achtelnote)",
            options: ["Achtelnote", "Viertelnote", "Halbe Note", "Sechzehntelnote"]
        }
    ];

    const bagL6 = Core.createBag(puzzlesBasic, p => p.answer + p.explanation);

    const level6 = {
        label: "Notenwerte addieren (2 Noten)",
        reset: () => bagL6.neu(),
        start: function (ctx) {
            const task = bagL6.next();
            ctx.task("Welcher einzelne Notenwert entspricht dieser Summe?");
            ctx.hint("");
            ctx.staff(task.notes);

            ctx.answers(task.options, function (choice) {
                if (choice === task.answer) {
                    ctx.solved(`Richtig gerechnet! ${task.explanation}.`);
                } else {
                    ctx.failed(`Nicht ganz. Zähle die Schläge jeder Note einzeln zusammen!`);
                }
            });
        }
    };

    // ------------------------------------------------ Level 7: Kombinierte Noten-Rechnungen (3 Noten / gemischt)
    const puzzlesAdvanced = [
        {
            notes: [{ key: "c/4", duration: "q" }, { key: "c/4", duration: "q" }, { key: "c/4", duration: "h" }],
            answer: "Ganze Note",
            explanation: "1 + 1 + 2 = 4 Schläge (Ganze Note)",
            options: ["Ganze Note", "Halbe Note", "Viertelnote", "Achtelnote"]
        },
        {
            notes: [{ key: "c/4", duration: "8" }, { key: "c/4", duration: "8" }, { key: "c/4", duration: "q" }],
            answer: "Halbe Note",
            explanation: "½ + ½ + 1 = 2 Schläge (Halbe Note)",
            options: ["Halbe Note", "Viertelnote", "Ganze Note", "Achtelnote"]
        },
        {
            notes: [{ key: "c/4", duration: "q" }, { key: "c/4", duration: "8" }, { key: "c/4", duration: "8" }],
            answer: "Halbe Note",
            explanation: "1 + ½ + ½ = 2 Schläge (Halbe Note)",
            options: ["Halbe Note", "Viertelnote", "Ganze Note", "Achtelnote"]
        },
        {
            notes: [{ key: "c/4", duration: "8" }, { key: "c/4", duration: "8" }, { key: "c/4", duration: "8" }, { key: "c/4", duration: "8" }],
            answer: "Halbe Note",
            explanation: "4 × ½ = 2 Schläge (Halbe Note)",
            options: ["Halbe Note", "Ganze Note", "Viertelnote", "Achtelnote"]
        },
        {
            notes: [{ key: "c/4", duration: "16" }, { key: "c/4", duration: "16" }, { key: "c/4", duration: "8" }],
            answer: "Viertelnote",
            explanation: "¼ + ¼ + ½ = 1 Schlag (Viertelnote)",
            options: ["Viertelnote", "Halbe Note", "Achtelnote", "Sechzehntelnote"]
        }
    ];

    const bagL7 = Core.createBag(puzzlesAdvanced, p => p.answer + p.explanation);

    const level7 = {
        label: "Kombinierte Noten-Rechnungen",
        reset: () => bagL7.neu(),
        start: function (ctx) {
            const task = bagL7.next();
            ctx.task("Welcher einzelne Notenwert entspricht dieser Summe?");
            ctx.hint("");
            ctx.staff(task.notes);

            ctx.answers(task.options, function (choice) {
                if (choice === task.answer) {
                    ctx.solved(`Richtig gerechnet! ${task.explanation}.`);
                } else {
                    ctx.failed(`Nicht ganz. Zähle die Schläge jeder Note einzeln zusammen!`);
                }
            });
        }
    };

    // ------------------------------------------------ Level 8: Takt vervollständigen (4/4-Takt ohne Punkte)
    const barCompletions = [
        {
            existing: [{ key: "c/4", duration: "h" }, { key: "c/4", duration: "q" }],
            missing: "Viertelnote",
            currentSum: "3 Schläge",
            explanation: "Vorhanden: 2 + 1 = 3 Schläge. Bis zu 4 Schlägen fehlt 1 Schlag (Viertelnote).",
            options: ["Viertelnote", "Halbe Note", "Achtelnote", "Ganze Note"]
        },
        {
            existing: [{ key: "c/4", duration: "h" }],
            missing: "Halbe Note",
            currentSum: "2 Schläge",
            explanation: "Vorhanden: 2 Schläge. Bis zu 4 Schlägen fehlen 2 Schläge (Halbe Note).",
            options: ["Halbe Note", "Viertelnote", "Ganze Note", "Achtelnote"]
        },
        {
            existing: [{ key: "c/4", duration: "q" }, { key: "c/4", duration: "q" }, { key: "c/4", duration: "q" }],
            missing: "Viertelnote",
            currentSum: "3 Schläge",
            explanation: "Vorhanden: 1 + 1 + 1 = 3 Schläge. Es fehlt 1 Schlag (Viertelnote).",
            options: ["Viertelnote", "Halbe Note", "Achtelnote", "Ganze Note"]
        },
        {
            existing: [{ key: "c/4", duration: "q" }, { key: "c/4", duration: "q" }],
            missing: "Halbe Note",
            currentSum: "2 Schläge",
            explanation: "Vorhanden: 1 + 1 = 2 Schläge. Es fehlen 2 Schläge (Halbe Note).",
            options: ["Halbe Note", "Viertelnote", "Ganze Note", "Achtelnote"]
        },
        {
            existing: [{ key: "c/4", duration: "h" }, { key: "c/4", duration: "8" }, { key: "c/4", duration: "8" }],
            missing: "Viertelnote",
            currentSum: "3 Schläge",
            explanation: "Vorhanden: 2 + ½ + ½ = 3 Schläge. Es fehlt 1 Schlag (Viertelnote).",
            options: ["Viertelnote", "Achtelnote", "Halbe Note", "Ganze Note"]
        },
        {
            existing: [{ key: "c/4", duration: "q" }, { key: "c/4", duration: "h" }],
            missing: "Viertelnote",
            currentSum: "3 Schläge",
            explanation: "Vorhanden: 1 + 2 = 3 Schläge. Bis zu 4 Schlägen fehlt 1 Schlag (Viertelnote).",
            options: ["Viertelnote", "Halbe Note", "Achtelnote", "Ganze Note"]
        }
    ];

    const bagL8 = Core.createBag(barCompletions, b => b.missing + b.currentSum);

    const level8 = {
        label: "Takt vervollständigen (4/4-Takt)",
        reset: () => bagL8.neu(),
        start: function (ctx) {
            const task = bagL8.next();
            ctx.task("Welcher Notenwert fehlt, um den 4/4-Takt zu füllen?");
            ctx.hint("");
            ctx.staff(task.existing, { timeSignature: "4/4" });

            ctx.answers(task.options, function (choice) {
                if (choice === task.missing) {
                    ctx.solved(`Super Taktgefühl! ${task.explanation}`);
                } else {
                    ctx.failed(`Das passt nicht ganz in den 4/4-Takt. Rechne: 4 minus vorhandene Schläge.`);
                }
            });
        }
    };

    // Modul über gemeinsamen Kern erzeugen
    return Core.createModule({
        id: "notenwerte",
        title: "Notenwerte & Rhythmus",
        rounds: 20,
        levels: [level1, level2, level3, level4, level5, level6, level7, level8]
    });

})();
