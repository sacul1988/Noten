/* ============================================================================
   Modul Dreiklänge — 10 Level analog zum Tonleitern-Modul
   ========================================================================== */
const DreiklangApp = (function () {

    /* Grundtöne auf allen Stammtönen, über anderthalb Oktaven verteilt */
    const STAMMTOENE = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4",
                        "c/5", "d/5", "e/5", "f/5"];

    /* Grundtöne auf schwarzen Tasten (mit Vorzeichen) */
    const ACCIDENTAL_DUR = ["c#/4", "eb/4", "f#/4", "ab/4", "bb/4", "c#/5", "eb/5"];
    const ACCIDENTAL_MOLL = ["c#/4", "eb/4", "f#/4", "ab/4", "bb/4", "c#/5", "eb/5"];

    const PITCH_STEPS = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4",
                         "c/5", "d/5", "e/5", "f/5", "g/5", "a/5", "b/5", "c/6"];

    function chordName(root, type) {
        return Core.german(root) + "-" + (type === "dur" ? "Dur" : "Moll");
    }

    function drawChord(ctx, notes, colors) {
        if (!notes || !notes.length) {
            ctx.staff([]);
            return;
        }
        ctx.staff(notes, { chord: true, colors: colors || notes.map(function () { return "black"; }) });
    }

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
        return a;
    }

    function makeLevel(opts) {
        const aufgaben = [];
        opts.types.forEach(function (t) {
            (opts.roots[t] || []).forEach(function (r) {
                aufgaben.push({ root: r, type: t });
            });
        });
        const beutel = Core.createBag(aufgaben, function (a) {
            return Core.german(a.root) + "-" + a.type;
        });

        return {
            label: opts.label,
            reset: function () { beutel.neu(); },
            start: function (ctx) {
                const aufgabe = beutel.next();
                const type = aufgabe.type;
                const root = aufgabe.root;
                const triad = Core.buildTriad(root, type);
                const name = chordName(root, type);
                let evaluated = false;

                // =========================================================================
                // MODUS 1: KLAVIATUR (Level 1–6)
                // =========================================================================
                if (opts.mode === "keyboard") {
                    let userNotes = [];
                    ctx.hint("");
                    ctx.task("Baue den <b>" + name + "</b>-Dreiklang (3 Töne).");
                    ctx.staff([]);
                    ctx.clearAnswers();
                    ctx.disableContinue("Weiter →");
                    ctx.showConfirm(evalKeyboardAttempt, "Bestätigen");

                    function removeNote(m) {
                        if (evaluated) return;
                        const existingIdx = userNotes.findIndex(function (n) { return n.midi === m; });
                        if (existingIdx !== -1) {
                            userNotes.splice(existingIdx, 1);
                            ctx.resetKeys();
                            userNotes.forEach(function (n) {
                                if (n.keyEl) {
                                    ctx.paintKey(n.keyEl, "#3b82f6", function () {
                                        removeNote(n.midi);
                                    });
                                }
                            });
                            updateKeyboardUi();
                        }
                    }

                    function updateKeyboardUi() {
                        const keys = userNotes.map(function (n) { return n.key; });
                        drawChord(ctx, keys);
                        if (userNotes.length === 3) {
                            ctx.enableConfirm(true);
                            ctx.feedback("3 Töne gewählt. Klicke auf 'Bestätigen' zum Prüfen!", "#3b82f6");
                        } else {
                            ctx.enableConfirm(false);
                            ctx.feedback(userNotes.length > 0
                                ? "Gewählt: " + userNotes.length + " / 3 Töne (Klick auf ✕ hebt Auswahl auf)."
                                : "Wähle die 3 Töne des Dreiklangs (Grundton, Terz, Quinte).");
                        }
                    }

                    function evalKeyboardAttempt() {
                        if (evaluated || userNotes.length < 3) return;
                        evaluated = true;
                        ctx.enableConfirm(false);

                        const expectedMidis = triad.map(Core.midi);
                        const userMidis = userNotes.map(function (n) { return n.midi; });

                        const sortedExpected = expectedMidis.slice().sort(function (a, b) { return a - b; });
                        const sortedUser = userMidis.slice().sort(function (a, b) { return a - b; });

                        const allCorrect = (sortedUser.length === 3 && sortedUser.every(function (m, i) {
                            return m === sortedExpected[i];
                        }));

                        const colors = [];
                        for (let i = 0; i < userNotes.length; i++) {
                            const isToneInChord = (expectedMidis.indexOf(userNotes[i].midi) !== -1);
                            if (isToneInChord) {
                                colors.push("#12b76a");
                                if (userNotes[i].keyEl) ctx.paintKey(userNotes[i].keyEl, "#12b76a");
                            } else {
                                colors.push("#e5484d");
                                if (userNotes[i].keyEl) ctx.paintKey(userNotes[i].keyEl, "#e5484d");
                            }
                        }

                        drawChord(ctx, userNotes.map(function (n) { return n.key; }), colors);

                        if (allCorrect) {
                            ctx.hideConfirm();
                            ctx.playChord(triad, 1.4);
                            ctx.solved("Richtig! " + name + " = " + triad.map(Core.german).join(" – "));
                            ctx.onContinue(null);
                        } else {
                            ctx.failed("Nicht ganz richtig. Schau dir die rot markierten Töne an.");
                            ctx.enableContinue("Erneut versuchen ↺");
                            ctx.onContinue(function () {
                                userNotes = [];
                                evaluated = false;
                                ctx.resetKeys();
                                ctx.staff([]);
                                ctx.feedback("Wähle die 3 Töne des Dreiklangs (Grundton, Terz, Quinte).");
                                ctx.disableContinue("Weiter →");
                                ctx.showConfirm(evalKeyboardAttempt, "Bestätigen");
                                ctx.enableConfirm(false);
                            });
                        }
                    }

                    ctx.keyboard("c/4", "c/6", function (m, keyEl) {
                        if (evaluated) return;
                        const existingIdx = userNotes.findIndex(function (n) { return n.midi === m; });
                        if (existingIdx !== -1) return;
                        if (userNotes.length >= 3) return;

                        let noteKey = Core.midiToKey(m);
                        for (let i = 0; i < triad.length; i++) {
                            if (Core.midi(triad[i]) === m) {
                                noteKey = triad[i];
                                break;
                            }
                        }

                        userNotes.push({ midi: m, key: noteKey, keyEl: keyEl });
                        ctx.paintKey(keyEl, "#3b82f6", function () {
                            removeNote(m);
                        });
                        updateKeyboardUi();
                    }, { labels: false });
                }

                // =========================================================================
                // MODUS 2: MULTIPLE CHOICE ERKENNEN (Level 7 & 8)
                // =========================================================================
                else if (opts.mode === "recognize") {
                    ctx.keyboard(false);
                    ctx.hint("");
                    ctx.task("Welcher Dreiklang ist im Notensystem abgebildet?");
                    drawChord(ctx, triad);
                    ctx.disableContinue("Weiter →");
                    ctx.hideConfirm();

                    const correctLabel = name;
                    const pool = [];
                    opts.types.forEach(function (t) {
                        (opts.roots[t] || []).forEach(function (r) {
                            const lbl = chordName(r, t);
                            if (lbl !== correctLabel && pool.indexOf(lbl) === -1) {
                                pool.push(lbl);
                            }
                        });
                    });

                    const choices = shuffle(pool).slice(0, 5);
                    choices.push(correctLabel);
                    shuffle(choices);

                    ctx.answers(choices, function (choice, btn) {
                        if (evaluated) return;
                        evaluated = true;

                        if (choice === correctLabel) {
                            if (btn) btn.classList.add("correct");
                            drawChord(ctx, triad, ["#12b76a", "#12b76a", "#12b76a"]);
                            ctx.playChord(triad, 1.4);
                            ctx.solved("Richtig! Das ist der <b>" + correctLabel + "</b>-Dreiklang (" + triad.map(Core.german).join(" – ") + ").");
                            ctx.onContinue(null);
                        } else {
                            if (btn) btn.classList.add("wrong");
                            drawChord(ctx, triad, ["#e5484d", "#e5484d", "#e5484d"]);
                            ctx.failed("Leider falsch! Schau dir den Grundton und die Terzen noch einmal genau an.");
                            ctx.enableContinue("Erneut versuchen ↺");
                            ctx.onContinue(function () {
                                evaluated = false;
                                const ansDiv = document.querySelector("#module-dreiklaenge .js-answers");
                                if (ansDiv) {
                                    ansDiv.querySelectorAll(".answer-btn").forEach(function (b) {
                                        b.classList.remove("correct", "wrong");
                                    });
                                }
                                drawChord(ctx, triad);
                                ctx.disableContinue("Weiter →");
                            });
                        }
                    });
                }

                // =========================================================================
                // MODUS 3: NOTE FÜR NOTE SELBST SETZEN (Level 9 & 10)
                // =========================================================================
                else if (opts.mode === "place") {
                    ctx.keyboard(false);
                    ctx.showConfirm(evalPlacementAttempt, "Bestätigen");
                    ctx.enableConfirm(true);
                    ctx.hint("");
                    ctx.disableContinue("Weiter →");

                    let activeNoteIdx = 0;
                    let maxReachedIdx = 0;

                    // Alle 3 Noten starten beim mittleren C (c/4)
                    const placedNotes = [
                        { base: "c/4", acc: "" },
                        { base: "c/4", acc: "" },
                        { base: "c/4", acc: "" }
                    ];

                    function getFullNoteKey(n) {
                        const parts = n.base.split('/');
                        return (parts[0] + n.acc) + "/" + parts[1];
                    }

                    function updatePlacementStaff(colors) {
                        const staffKeys = placedNotes.slice(0, maxReachedIdx + 1).map(function (n) {
                            return getFullNoteKey(n);
                        });

                        const staffColors = colors || staffKeys.map(function (_, idx) {
                            return idx === activeNoteIdx ? "#3b82f6" : "#334155";
                        });

                        ctx.staff(staffKeys, { chord: true, colors: staffColors });
                        ctx.hint("");
                    }

                    function renderPlacementEditor() {
                        const ansDiv = document.querySelector("#module-dreiklaenge .js-answers");
                        if (!ansDiv) return;
                        ansDiv.innerHTML = "";

                        const wrap = document.createElement("div");
                        wrap.className = "triad-placement-controls";
                        wrap.style.display = "flex";
                        wrap.style.flexDirection = "column";
                        wrap.style.alignItems = "center";
                        wrap.style.gap = "10px";
                        wrap.style.marginTop = "8px";

                        // Vorzeichen-Reihe
                        const accRow = document.createElement("div");
                        accRow.style.display = "flex";
                        accRow.style.gap = "10px";
                        accRow.style.justifyContent = "center";

                        const sharpBtn = document.createElement("button");
                        sharpBtn.className = "answer-btn";
                        sharpBtn.textContent = "#";
                        sharpBtn.style.minWidth = "55px";
                        sharpBtn.style.fontSize = "1.2rem";
                        sharpBtn.style.fontWeight = "bold";
                        if (placedNotes[activeNoteIdx].acc === "#") sharpBtn.style.background = "#3b82f6";
                        sharpBtn.onclick = function () {
                            if (evaluated) return;
                            placedNotes[activeNoteIdx].acc = (placedNotes[activeNoteIdx].acc === "#" ? "" : "#");
                            updatePlacementStaff();
                            renderPlacementEditor();
                        };

                        const flatBtn = document.createElement("button");
                        flatBtn.className = "answer-btn";
                        flatBtn.textContent = "♭";
                        flatBtn.style.minWidth = "55px";
                        flatBtn.style.fontSize = "1.2rem";
                        flatBtn.style.fontWeight = "bold";
                        if (placedNotes[activeNoteIdx].acc === "b") flatBtn.style.background = "#3b82f6";
                        flatBtn.onclick = function () {
                            if (evaluated) return;
                            placedNotes[activeNoteIdx].acc = (placedNotes[activeNoteIdx].acc === "b" ? "" : "b");
                            updatePlacementStaff();
                            renderPlacementEditor();
                        };

                        const natBtn = document.createElement("button");
                        natBtn.className = "answer-btn";
                        natBtn.textContent = "♮";
                        natBtn.style.minWidth = "55px";
                        natBtn.style.fontSize = "1.2rem";
                        natBtn.style.fontWeight = "bold";
                        natBtn.onclick = function () {
                            if (evaluated) return;
                            placedNotes[activeNoteIdx].acc = "";
                            updatePlacementStaff();
                            renderPlacementEditor();
                        };

                        accRow.appendChild(sharpBtn);
                        accRow.appendChild(flatBtn);
                        accRow.appendChild(natBtn);

                        // Pfeiltasten-Reihe
                        const moveRow = document.createElement("div");
                        moveRow.style.display = "flex";
                        moveRow.style.gap = "14px";
                        moveRow.style.justifyContent = "center";

                        const downBtn = document.createElement("button");
                        downBtn.className = "answer-btn";
                        downBtn.textContent = "↓ Tiefer";
                        downBtn.style.background = "#f97316";
                        downBtn.style.color = "white";
                        downBtn.style.fontWeight = "bold";
                        downBtn.style.padding = "9px 22px";
                        downBtn.onclick = function () {
                            if (evaluated) return;
                            const currentPIdx = PITCH_STEPS.indexOf(placedNotes[activeNoteIdx].base);
                            if (currentPIdx > 0) {
                                placedNotes[activeNoteIdx].base = PITCH_STEPS[currentPIdx - 1];
                                updatePlacementStaff();
                            }
                        };

                        const upBtn = document.createElement("button");
                        upBtn.className = "answer-btn";
                        upBtn.textContent = "↑ Höher";
                        upBtn.style.background = "#16a34a";
                        upBtn.style.color = "white";
                        upBtn.style.fontWeight = "bold";
                        upBtn.style.padding = "9px 22px";
                        upBtn.onclick = function () {
                            if (evaluated) return;
                            const currentPIdx = PITCH_STEPS.indexOf(placedNotes[activeNoteIdx].base);
                            if (currentPIdx !== -1 && currentPIdx + 1 < PITCH_STEPS.length) {
                                placedNotes[activeNoteIdx].base = PITCH_STEPS[currentPIdx + 1];
                                updatePlacementStaff();
                            }
                        };

                        moveRow.appendChild(downBtn);
                        moveRow.appendChild(upBtn);

                        // Navigation zwischen den 3 Noten (Vorherige / Nächste)
                        const navRow = document.createElement("div");
                        navRow.style.display = "flex";
                        navRow.style.gap = "14px";
                        navRow.style.alignItems = "center";
                        navRow.style.justifyContent = "center";
                        navRow.style.marginTop = "2px";

                        const prevBtn = document.createElement("button");
                        prevBtn.className = "answer-btn";
                        prevBtn.textContent = "← Vorherige Note";
                        prevBtn.style.background = "#64748b";
                        prevBtn.style.color = "white";
                        prevBtn.style.padding = "8px 18px";
                        prevBtn.disabled = (activeNoteIdx === 0);
                        prevBtn.style.opacity = (activeNoteIdx === 0 ? "0.4" : "1");
                        prevBtn.onclick = function () {
                            if (activeNoteIdx > 0) {
                                activeNoteIdx--;
                                updatePlacementStaff();
                                renderPlacementEditor();
                            }
                        };

                        const nextBtn = document.createElement("button");
                        nextBtn.className = "answer-btn";
                        nextBtn.textContent = "Nächste Note →";
                        nextBtn.style.background = "#64748b";
                        nextBtn.style.color = "white";
                        nextBtn.style.padding = "8px 18px";
                        nextBtn.disabled = (activeNoteIdx >= 2);
                        nextBtn.style.opacity = (activeNoteIdx >= 2 ? "0.4" : "1");
                        nextBtn.onclick = function () {
                            if (activeNoteIdx < 2) {
                                activeNoteIdx++;
                                if (activeNoteIdx > maxReachedIdx) {
                                    maxReachedIdx = activeNoteIdx;
                                }
                                updatePlacementStaff();
                                renderPlacementEditor();
                            }
                        };

                        navRow.appendChild(prevBtn);
                        navRow.appendChild(nextBtn);

                        wrap.appendChild(accRow);
                        wrap.appendChild(moveRow);
                        wrap.appendChild(navRow);
                        ansDiv.appendChild(wrap);
                    }

                    function updateTaskText() {
                        ctx.task("Setze den <b>" + name + "</b>-Dreiklang Note für Note (3 Töne).");
                    }

                    function evalPlacementAttempt() {
                        if (evaluated) return;
                        evaluated = true;

                        const colors = [];
                        let allCorrect = true;

                        for (let i = 0; i < 3; i++) {
                            const userKey = getFullNoteKey(placedNotes[i]);
                            const isCorrect = (userKey === triad[i] || Core.midi(userKey) === Core.midi(triad[i]));
                            if (isCorrect) {
                                colors.push("#12b76a");
                            } else {
                                colors.push("#e5484d");
                                allCorrect = false;
                            }
                        }

                        updatePlacementStaff(colors);

                        if (allCorrect) {
                            ctx.hideConfirm();
                            ctx.playChord(triad, 1.4);
                            ctx.solved("Großartig! Du hast den <b>" + name + "</b>-Dreiklang komplett richtig gesetzt.");
                            ctx.onContinue(null);
                        } else {
                            ctx.failed("Nicht ganz richtig. Schau dir die rot markierten Noten an.");
                            ctx.enableContinue("Erneut versuchen ↺");
                            ctx.onContinue(function () {
                                evaluated = false;
                                ctx.showConfirm(evalPlacementAttempt, "Bestätigen");
                                ctx.enableConfirm(true);
                                updatePlacementStaff();
                                renderPlacementEditor();
                                ctx.disableContinue("Weiter →");
                            });
                        }
                    }

                    updateTaskText();
                    updatePlacementStaff();
                    renderPlacementEditor();
                }
            }
        };
    }

    const levels = [
        makeLevel({ label: "Dur (Stammtöne)", mode: "keyboard", types: ["dur"],
                    roots: { dur: STAMMTOENE } }),
        makeLevel({ label: "Moll (Stammtöne)", mode: "keyboard", types: ["moll"],
                    roots: { moll: STAMMTOENE } }),
        makeLevel({ label: "Dur und Moll gemischt (Stammtöne)", mode: "keyboard", types: ["dur", "moll"],
                    roots: { dur: STAMMTOENE, moll: STAMMTOENE } }),
        makeLevel({ label: "Dur (Schwarze Tasten)", mode: "keyboard", types: ["dur"],
                    roots: { dur: ACCIDENTAL_DUR } }),
        makeLevel({ label: "Moll (Schwarze Tasten)", mode: "keyboard", types: ["moll"],
                    roots: { moll: ACCIDENTAL_MOLL } }),
        makeLevel({ label: "Dur und Moll (Schwarze Tasten)", mode: "keyboard", types: ["dur", "moll"],
                    roots: { dur: ACCIDENTAL_DUR, moll: ACCIDENTAL_MOLL } }),
        makeLevel({ label: "Dreiklang erkennen (Stammtöne)", mode: "recognize", types: ["dur", "moll"],
                    roots: { dur: STAMMTOENE, moll: STAMMTOENE } }),
        makeLevel({ label: "Dreiklang erkennen (Schwarze Tasten)", mode: "recognize", types: ["dur", "moll"],
                    roots: { dur: ACCIDENTAL_DUR, moll: ACCIDENTAL_MOLL } }),
        makeLevel({ label: "Dur selbst setzen (Stammtöne)", mode: "place", types: ["dur"],
                    roots: { dur: STAMMTOENE } }),
        makeLevel({ label: "Moll selbst setzen (Stammtöne)", mode: "place", types: ["moll"],
                    roots: { moll: STAMMTOENE } })
    ];

    return Core.createModule({
        id: "dreiklaenge",
        title: "Dreiklänge",
        rounds: 8,
        levels: levels
    });
})();
