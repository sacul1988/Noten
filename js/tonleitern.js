/* ============================================================================
   Modul Tonleitern — 10 Level (Dur und harmonisches Moll, aufwärts)
   Level 1–6: Klaviatur-Bau (Stammtöne & Schwarze Tasten) mit Bestätigen & Deselect
   Level 7–8: Tonleiter erkennen (Multiple Choice Stammtöne & Schwarze Tasten)
   Level 9–10: Note für Note selbst im System setzen mit Vor-/Zurück-Navigation
   ========================================================================== */
const TonleiterApp = (function () {

    const STAMMTOENE = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4"];
    const ACCIDENTAL_DUR = ["db/4", "eb/4", "f#/4", "ab/4", "bb/4", "c#/4", "gb/4"];
    const ACCIDENTAL_MOLL = ["c#/4", "d#/4", "eb/4", "f#/4", "g#/4", "bb/4"];

    const PITCH_STEPS = [
        "b/3", "c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4",
        "c/5", "d/5", "e/5", "f/5", "g/5", "a/5", "b/5", "c/6", "d/6"
    ];

    function midiToKey(m) {
        const octave = Math.floor(m / 12) - 1;
        const semitone = m % 12;
        const pitchMap = {
            0: "c", 1: "c#", 2: "d", 3: "eb", 4: "e", 5: "f",
            6: "f#", 7: "g", 8: "ab", 9: "a", 10: "bb", 11: "b"
        };
        return (pitchMap[semitone] || "c") + "/" + octave;
    }

    function drawCurrentStaff(ctx, notes, colors) {
        const keys = notes.map(function (n) { return typeof n === "string" ? n : n.key; });
        if (colors) {
            ctx.staff(keys, { colors: colors });
        } else {
            ctx.staff(keys, { colors: keys.map(function () { return "black"; }) });
        }
    }

    function getScaleName(root, type) {
        return Core.german(root) + "-" + (type === "dur" ? "Dur" : "Moll");
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
                const scale = Core.buildScale(root, type);
                const scaleName = getScaleName(root, type);
                let evaluated = false;

                // =========================================================================
                // MODUS 1: KLAVIATUR (Level 1–6)
                // =========================================================================
                if (opts.mode === "keyboard") {
                    let userNotes = [];
                    ctx.hint("");
                    ctx.task("Baue die <b>" + scaleName + "</b>-Tonleiter aufwärts (" + scale.length + " Töne).");
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
                        drawCurrentStaff(ctx, userNotes);
                        if (userNotes.length === scale.length) {
                            ctx.enableConfirm(true);
                            ctx.feedback("Alle " + scale.length + " Töne gewählt. Klicke auf 'Bestätigen'!", "#3b82f6");
                        } else {
                            ctx.enableConfirm(false);
                            ctx.feedback(userNotes.length > 0
                                ? "Gewählt: " + userNotes.length + " / " + scale.length + " Töne (Klick auf ✕ hebt Auswahl auf)."
                                : "Wähle nacheinander die 8 Töne der Tonleiter aus.");
                        }
                    }

                    function evalKeyboardAttempt() {
                        if (evaluated || userNotes.length < scale.length) return;
                        evaluated = true;
                        ctx.enableConfirm(false);

                        let allCorrect = true;
                        const colors = [];

                        for (let i = 0; i < scale.length; i++) {
                            const isCorrect = (userNotes[i].midi === Core.midi(scale[i]));
                            if (isCorrect) {
                                colors.push("#12b76a");
                                if (userNotes[i].keyEl) ctx.paintKey(userNotes[i].keyEl, "#12b76a");
                            } else {
                                colors.push("#e5484d");
                                allCorrect = false;
                                if (userNotes[i].keyEl) ctx.paintKey(userNotes[i].keyEl, "#e5484d");
                            }
                        }

                        drawCurrentStaff(ctx, userNotes, colors);

                        if (allCorrect) {
                            ctx.playMelody(scale, 280, 0.45);
                            ctx.solved("Tonleiter komplett richtig: " + scale.map(Core.german).join(" – "));
                            ctx.onContinue(null);
                        } else {
                            ctx.failed("Nicht ganz richtig. Schau dir die rot markierten Töne an.");
                            ctx.enableContinue("Erneut versuchen ↺");
                            ctx.onContinue(function () {
                                resetKeyboardAttempt();
                            });
                        }
                    }

                    function resetKeyboardAttempt() {
                        userNotes = [];
                        evaluated = false;
                        ctx.resetKeys();
                        ctx.staff([]);
                        ctx.feedback("Wähle nacheinander die 8 Töne der Tonleiter aus.");
                        ctx.disableContinue("Weiter →");
                        ctx.enableConfirm(false);
                        ctx.onContinue(evalKeyboardAttempt);
                        ctx.hint("");
                    }

                    ctx.onContinue(evalKeyboardAttempt);

                    ctx.keyboard("c/4", "c/6", function (m, keyEl) {
                        if (evaluated) return;

                        // Wenn bereits gewählt: nur noch einmal anhören (Sound spielt bereits), keine Deaktivierung
                        const existingIdx = userNotes.findIndex(function (n) { return n.midi === m; });
                        if (existingIdx !== -1) {
                            return;
                        }

                        if (userNotes.length >= scale.length) return;

                        let noteKey;
                        if (m === Core.midi(scale[userNotes.length])) {
                            noteKey = scale[userNotes.length];
                        } else {
                            noteKey = midiToKey(m);
                        }

                        userNotes.push({ midi: m, key: noteKey, keyEl: keyEl });
                        ctx.paintKey(keyEl, "#3b82f6", function () {
                            removeNote(m);
                        });
                        updateKeyboardUi();
                    }, { labels: false });
                }

                // =========================================================================
                // MODUS 2: TONLEITER ERKENNEN (Level 7 & 8)
                // =========================================================================
                else if (opts.mode === "recognize") {
                    ctx.keyboard(false);
                    ctx.hideConfirm();
                    ctx.hint("");
                    ctx.task("Welche Tonleiter ist hier abgebildet?");
                    ctx.disableContinue("Weiter →");
                    ctx.staff(scale, { colors: scale.map(function () { return "black"; }) });

                    // Distraktoren generieren
                    const allPool = [];
                    opts.types.forEach(function (t) {
                        (opts.roots[t] || []).forEach(function (r) {
                            const name = getScaleName(r, t);
                            if (name !== scaleName && allPool.indexOf(name) === -1) {
                                allPool.push(name);
                            }
                        });
                    });

                    const distractors = shuffle(allPool).slice(0, 5);
                    const options = shuffle([scaleName].concat(distractors));

                    ctx.answers(options, function (selectedName, btn) {
                        if (evaluated) return;
                        evaluated = true;

                        if (selectedName === scaleName) {
                            btn.classList.add("correct");
                            ctx.staff(scale, { colors: scale.map(function () { return "#12b76a"; }) });
                            ctx.playMelody(scale, 280, 0.45);
                            ctx.solved("Richtig! Das ist die <b>" + scaleName + "</b>-Tonleiter.");
                            ctx.onContinue(null);
                        } else {
                            btn.classList.add("wrong");
                            ctx.staff(scale, { colors: scale.map(function () { return "#e5484d"; }) });
                            ctx.failed("Nicht ganz richtig! Schau dir den Grundton und die Vorzeichen noch einmal an.");
                            ctx.enableContinue("Erneut versuchen ↺");
                            ctx.onContinue(function () {
                                evaluated = false;
                                const ansDiv = document.querySelector("#module-tonleitern .js-answers");
                                if (ansDiv) {
                                    ansDiv.querySelectorAll(".answer-btn").forEach(function (b) {
                                        b.classList.remove("correct", "wrong");
                                    });
                                }
                                ctx.staff(scale, { colors: scale.map(function () { return "black"; }) });
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

                    // Alle Noten starten immer beim mittleren C (c/4)
                    const placedNotes = [
                        { base: "c/4", acc: "" }
                    ];

                    function noteAccidental(k) {
                        const m = k.match(/[#b]+/);
                        return m ? m[0] : "";
                    }

                    function getFullNoteKey(n) {
                        const parts = n.base.split('/');
                        return (parts[0] + n.acc) + "/" + parts[1];
                    }

                    function ensureNoteExists(idx) {
                        if (!placedNotes[idx]) {
                            placedNotes[idx] = { base: "c/4", acc: "" };
                        }
                    }

                    for (let i = 0; i < 8; i++) {
                        ensureNoteExists(i);
                    }

                    function updatePlacementStaff(colors) {
                        const staffKeys = placedNotes.slice(0, maxReachedIdx + 1).map(function (n) {
                            return getFullNoteKey(n);
                        });

                        const staffColors = colors || staffKeys.map(function (_, idx) {
                            return idx === activeNoteIdx ? "#3b82f6" : "#334155";
                        });

                        ctx.staff(staffKeys, { colors: staffColors });
                        ctx.hint("");
                    }

                    function renderPlacementEditor() {
                        const ansDiv = document.querySelector("#module-tonleitern .js-answers");
                        if (!ansDiv) return;
                        ansDiv.innerHTML = "";

                        const wrap = document.createElement("div");
                        wrap.className = "scale-placement-controls";
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

                        // Navigation zwischen den 8 Noten (Vorherige / Nächste)
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
                        nextBtn.disabled = (activeNoteIdx >= 7);
                        nextBtn.style.opacity = (activeNoteIdx >= 7 ? "0.4" : "1");
                        nextBtn.onclick = function () {
                            if (activeNoteIdx < 7) {
                                activeNoteIdx++;
                                if (activeNoteIdx > maxReachedIdx) {
                                    maxReachedIdx = activeNoteIdx;
                                }
                                ensureNoteExists(activeNoteIdx);
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
                        ctx.task("Setze die <b>" + scaleName + "</b>-Tonleiter aufwärts (8 Töne).");
                    }

                    function evalPlacementAttempt() {
                        if (evaluated) return;
                        evaluated = true;

                        let allCorrect = true;
                        const colors = [];
                        maxReachedIdx = 7;

                        for (let i = 0; i < 8; i++) {
                            const userKey = getFullNoteKey(placedNotes[i]);
                            const isCorrect = (userKey === scale[i] || Core.midi(userKey) === Core.midi(scale[i]));
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
                            ctx.playMelody(scale, 280, 0.45);
                            ctx.solved("Großartig! Du hast die <b>" + scaleName + "</b>-Tonleiter komplett richtig gesetzt.");
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
        makeLevel({ label: "Tonleiter erkennen (Stammtöne)", mode: "recognize", types: ["dur", "moll"],
                    roots: { dur: STAMMTOENE, moll: STAMMTOENE } }),
        makeLevel({ label: "Tonleiter erkennen (Schwarze Tasten)", mode: "recognize", types: ["dur", "moll"],
                    roots: { dur: ACCIDENTAL_DUR, moll: ACCIDENTAL_MOLL } }),
        makeLevel({ label: "Dur selbst setzen (Stammtöne)", mode: "place", types: ["dur"],
                    roots: { dur: STAMMTOENE } }),
        makeLevel({ label: "Moll selbst setzen (Stammtöne)", mode: "place", types: ["moll"],
                    roots: { moll: STAMMTOENE } })
    ];

    return Core.createModule({
        id: "tonleitern",
        title: "Tonleitern",
        rounds: 8,
        levels: levels
    });
})();
