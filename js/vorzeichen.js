// ======================= MODUL: VORZEICHEN =======================
const VorzeichenApp = (function() {
    const root = document.getElementById("module-vorzeichen");
    const $id = (id) => document.getElementById("v-" + id);
    const div = $id("output");

    let currentNoteKey = "";
    let currentNoteDuration = "q";
    let targetNoteLetter = "";
    let placedNoteKey = "c/5";
    let currentNoteIndex = 7;
    let currentAccidental = "";
    let isNoteLocked = false;
    let isCurrentRoundFailed = false;
    let roundDone = false;
    let score = 0;
    let roundCount = 0;
    let currentLevel = 1;
    let maxUnlockedLevel = 1;
    let lastNoteOctave = "";
    let timerInterval = null;
    let timerValue = 0;
    let currentTaskLevel = 1;
    let subLevelIndex = 0;
    let totalRoundsForCurrentLevel = 20;
    let started = false;

    // Nur Kreuz-Töne für Level 1
    const sharpNotes = [
        "c#/4", "d#/4", "f#/4", "g#/4", "a#/4",
        "c#/5", "d#/5", "f#/5", "g#/5", "a#/5"
    ];
    const sharpBeutel = Core.createBag(sharpNotes);

    // Nur B-Töne für Level 2
    const flatNotes = [
        "db/4", "eb/4", "gb/4", "ab/4", "bb/4",
        "db/5", "eb/5", "gb/5", "ab/5", "bb/5"
    ];
    const flatBeutel = Core.createBag(flatNotes);

    // Alle Töne mit Vorzeichen für Level 3..8
    const notesWithAccidentals = [
        "c#/4", "db/4", "d#/4", "eb/4", "f#/4", "gb/4", "g#/4", "ab/4", "bb/4",
        "c#/5", "db/5", "d#/5", "eb/5", "f#/5", "gb/5", "g#/5", "ab/5", "bb/5"
    ];
    const notenBeutel = Core.createBag(notesWithAccidentals);

    const naturalNotes = [
        "c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4",
        "c/5", "d/5", "e/5", "f/5", "g/5", "a/5", "b/5", "c/6"
    ];

    const noteDisplayNames = {
        'c': 'C', 'c#': 'Cis', 'db': 'Des', 'd': 'D', 'd#': 'Dis', 'eb': 'Es', 'e': 'E',
        'f': 'F', 'f#': 'Fis', 'gb': 'Ges', 'g': 'G', 'g#': 'Gis', 'ab': 'As', 'a': 'A',
        'a#': 'Ais', 'bb': 'B', 'b': 'H'
    };

    const noteLogicNames = {
        'c': 'C', 'c#': 'C#', 'db': 'Db', 'd': 'D', 'd#': 'D#', 'eb': 'Eb', 'e': 'E',
        'f': 'F', 'f#': 'F#', 'gb': 'Gb', 'g': 'G', 'g#': 'G#', 'ab': 'Ab', 'a': 'A',
        'a#': 'A#', 'bb': 'B', 'b': 'H'
    };

    const enharmonics = {
        'C#': 'Db', 'Db': 'C#',
        'D#': 'Eb', 'Eb': 'D#',
        'F#': 'Gb', 'Gb': 'F#',
        'G#': 'Ab', 'Ab': 'G#',
        'A#': 'B',  'B': 'A#'
    };

    const SHARP_BUTTONS = [
        { val: "C#", label: "Cis" },
        { val: "D#", label: "Dis" },
        { val: "F#", label: "Fis" },
        { val: "G#", label: "Gis" },
        { val: "A#", label: "Ais" }
    ];

    const FLAT_BUTTONS = [
        { val: "Db", label: "Des" },
        { val: "Eb", label: "Es" },
        { val: "Gb", label: "Ges" },
        { val: "Ab", label: "As" },
        { val: "B", label: "B" }
    ];

    const ALL_ACC_BUTTONS = [
        { val: "C#", label: "Cis" },
        { val: "Db", label: "Des" },
        { val: "D#", label: "Dis" },
        { val: "Eb", label: "Es" },
        { val: "F#", label: "Fis" },
        { val: "Gb", label: "Ges" },
        { val: "G#", label: "Gis" },
        { val: "Ab", label: "As" },
        { val: "A#", label: "Ais" },
        { val: "B", label: "B" }
    ];

    // Alle Töne gemischt (Stammtöne + Kreuz + B) für Level 4
    const allNotesMixed = [
        "c/4", "c#/4", "db/4", "d/4", "d#/4", "eb/4", "e/4", "f/4", "f#/4", "gb/4", "g/4", "g#/4", "ab/4", "a/4", "a#/4", "bb/4", "b/4",
        "c/5", "c#/5", "db/5", "d/5", "d#/5", "eb/5", "e/5", "f/5", "f#/5", "gb/5", "g/5", "g#/5", "ab/5", "a/5", "a#/5", "bb/5", "b/5"
    ];
    const allNotesMixedBeutel = Core.createBag(allNotesMixed, function (n) { return n.split('/')[0]; });

    const ALL_NOTES_BUTTONS = [
        { val: "C", label: "C" },
        { val: "C#", label: "Cis" },
        { val: "Db", label: "Des" },
        { val: "D", label: "D" },
        { val: "D#", label: "Dis" },
        { val: "Eb", label: "Es" },
        { val: "E", label: "E" },
        { val: "F", label: "F" },
        { val: "F#", label: "Fis" },
        { val: "Gb", label: "Ges" },
        { val: "G", label: "G" },
        { val: "G#", label: "Gis" },
        { val: "Ab", label: "As" },
        { val: "A", label: "A" },
        { val: "A#", label: "Ais" },
        { val: "B", label: "B" },
        { val: "H", label: "H" }
    ];

    function renderInputButtons(buttonList) {
        const inputBtns = $id("input-buttons");
        if (!inputBtns) return;
        inputBtns.innerHTML = "";

        const isDense = (buttonList.length > 10);
        const grid = document.createElement("div");
        grid.style.width = "100%";
        grid.style.display = "flex";
        grid.style.flexWrap = "wrap";
        grid.style.gap = isDense ? "6px" : "8px";
        grid.style.justifyContent = "center";

        buttonList.forEach(item => {
            const btn = document.createElement("button");
            btn.className = "answer-btn dense-btn";
            btn.textContent = item.label;
            btn.style.minWidth = isDense ? "48px" : "60px";
            btn.style.padding = isDense ? "8px 12px" : "10px 16px";
            btn.style.fontSize = isDense ? "0.95rem" : "1.05rem";
            btn.addEventListener("click", function () {
                checkAnswer(item.val, btn);
            });
            grid.appendChild(btn);
        });

        inputBtns.appendChild(grid);
        inputBtns.style.display = "flex";
    }

    function updateProgressBar() {
        const bar = $id("progress-bar");
        if (bar) {
            bar.style.width = Math.min(100, Math.round((roundCount) / totalRoundsForCurrentLevel * 100)) + "%";
        }
    }

    function startTimer(seconds) {
        clearInterval(timerInterval);
        timerValue = seconds;
        const display = $id("timer-display");
        if (display) {
            display.style.display = "block";
            display.innerText = `Zeit: ${timerValue}s`;
        }

        timerInterval = setInterval(() => {
            timerValue--;
            if (display) display.innerText = `Zeit: ${timerValue}s`;
            if (timerValue <= 0) {
                clearInterval(timerInterval);
                if (display) display.style.display = "none";
                const feedback = $id("feedback");
                if (feedback) {
                    feedback.innerText = "Zeit abgelaufen! ⏱";
                    feedback.style.color = "#e5484d";
                }
                setTimeout(() => {
                    setLevel(currentLevel);
                }, 1000);
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        const display = $id("timer-display");
        if (display) display.style.display = "none";
    }

    function setAccidental(acc) {
        if (roundDone) return;
        let activeLv = (currentLevel === 9 ? currentTaskLevel : currentLevel);
        if (activeLv === 5 && !isNoteLocked) {
            if (currentAccidental === acc) {
                currentAccidental = "";
            } else {
                currentAccidental = acc;
            }
            updatePlacedNote();
            updateAccidentalButtons();
        }
    }

    function updateAccidentalButtons() {
        const btnSharp = $id("btn-acc-sharp");
        const btnFlat = $id("btn-acc-flat");
        if (btnSharp) btnSharp.style.background = (currentAccidental === "#") ? "#f59e0b" : "#667085";
        if (btnFlat) btnFlat.style.background = (currentAccidental === "b") ? "#f59e0b" : "#667085";
    }

    function updatePlacedNote() {
        let baseNote = naturalNotes[currentNoteIndex];
        let parts = baseNote.split("/");
        placedNoteKey = parts[0] + currentAccidental + "/" + parts[1];
        drawNote(placedNoteKey, "q");
    }

    function moveNote(dir) {
        if (roundDone) return;
        let activeLv = (currentLevel === 9 ? currentTaskLevel : currentLevel);
        if (activeLv !== 5 || isNoteLocked) return;
        let newIndex = currentNoteIndex + dir;
        if (newIndex >= 0 && newIndex < naturalNotes.length) {
            currentNoteIndex = newIndex;
            updatePlacedNote();
            $id("btn-confirm").disabled = false;
            $id("btn-confirm").innerText = "Bestätigen";
        }
    }

    function drawNote(noteKey, duration = "q", xPos = 150, color = "black") {
        let VF;
        if (typeof Vex !== "undefined" && Vex.Flow) {
            VF = Vex.Flow;
        } else if (typeof VexFlow !== "undefined") {
            VF = VexFlow;
        } else {
            return;
        }

        const errDisp = $id("error-display");
        if (errDisp) errDisp.style.display = "none";

        div.innerHTML = "";
        try {
            let rendererType = VF.Renderer.Backends.SVG;
            if (typeof rendererType === "undefined") rendererType = 1;

            const renderer = new VF.Renderer(div, rendererType);
            renderer.resize(700, 180);
            const context = renderer.getContext();
            context.scale(1.3, 1.3);

            const stave = new VF.Stave(16, 9, 500);
            stave.setBegBarType(VF.Barline.type.SINGLE);
            stave.setEndBarType(VF.Barline.type.DOUBLE);
            stave.addClef("treble").setContext(context);
            stave.draw();

            if (noteKey) {
                const note = new VF.StaveNote({ keys: [noteKey], duration: duration });
                note.setStyle({ fillStyle: color, strokeStyle: color });

                let activeLv = (currentLevel === 9 ? currentTaskLevel : currentLevel);

                const notePart = noteKey.split('/')[0];
                if (notePart.length > 1) {
                    note.addAccidental(0, new VF.Accidental(notePart.substring(1)));
                }

                const octave = parseInt(noteKey.split('/')[1]);
                const noteName = noteKey.split('/')[0];
                if (octave > 4 || (octave === 4 && noteName.startsWith('b'))) {
                    note.setStemDirection(-1);
                } else {
                    note.setStemDirection(1);
                }

                const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
                voice.setStrict(false);
                voice.addTickables([note]);

                new VF.Formatter().joinVoices([voice]).format([voice], 400);

                let noteX = Math.round(16 + 490 / 2 - 18);
                stave.setNoteStartX(noteX);

                voice.draw(context, stave);
            }
        } catch (err) {
            console.error("VexFlow Draw Error:", err);
            if (errDisp) {
                errDisp.innerText = "Zeichenfehler: " + err.message;
                errDisp.style.display = "block";
            }
        }
    }

    function nextRound() {
        roundDone = false;
        const btn = $id("continue-btn");
        if (btn) {
            btn.disabled = true;
            btn.textContent = (roundCount + 1 >= totalRoundsForCurrentLevel ? "Ergebnis →" : "Weiter →");
        }
        const allBtns = root.querySelectorAll("#v-input-buttons button");
        allBtns.forEach(b => b.classList.remove("wrong", "correct"));
        const keys = root.querySelectorAll('.piano-key');
        keys.forEach(k => { k.style.background = ''; k.style.color = ''; });

        if (roundCount >= totalRoundsForCurrentLevel) {
            stopTimer();
            showFinalResult();
            return;
        }

        isNoteLocked = false;
        isCurrentRoundFailed = false;

        let activeLevel = currentLevel;
        if (currentLevel === 9) {
            const levelSequence = [3, 4, 5, 6, 7, 8];
            activeLevel = levelSequence[subLevelIndex % levelSequence.length];
            currentTaskLevel = activeLevel;
            startTimer(15);
        } else if (currentLevel === 10) {
            activeLevel = 10;
            currentTaskLevel = 10;
            startTimer(10);
        } else {
            currentTaskLevel = currentLevel;
            stopTimer();
        }

        const confirmBtn = $id("btn-confirm");
        const inputBtns = $id("input-buttons");
        const placementBtns = $id("placement-buttons");
        const pianoKeyboard = $id("piano-keyboard");
        const pianoLarge = $id("piano-keyboard-large");

        $id("round-info").innerText = `Runde: ${roundCount + 1} / ${totalRoundsForCurrentLevel}`;
        updateProgressBar();

        function setTaskText(text, color = "#000") {
            const fb = $id("feedback");
            if (fb) {
                fb.innerText = text;
                fb.style.color = color;
            }
        }

        // ----------------- LEVEL 1: Nur Kreuz (#)
        if (activeLevel === 1) {
            if (confirmBtn) confirmBtn.style.display = "none";
            if (placementBtns) placementBtns.style.display = "none";
            if (pianoKeyboard) pianoKeyboard.style.display = "none";
            if (pianoLarge) pianoLarge.style.display = "none";

            renderInputButtons(SHARP_BUTTONS);
            currentNoteKey = sharpBeutel.next();
            setTaskText("Welche Note mit Kreuz (#) ist das? (+is)", "#000");
            drawNote(currentNoteKey, "q");
        }
        // ----------------- LEVEL 2: Nur B (b)
        else if (activeLevel === 2) {
            if (confirmBtn) confirmBtn.style.display = "none";
            if (placementBtns) placementBtns.style.display = "none";
            if (pianoKeyboard) pianoKeyboard.style.display = "none";
            if (pianoLarge) pianoLarge.style.display = "none";

            renderInputButtons(FLAT_BUTTONS);
            currentNoteKey = flatBeutel.next();
            setTaskText("Welche Note mit b ist das? (-es / -s / B)", "#000");
            drawNote(currentNoteKey, "q");
        }
        // ----------------- LEVEL 3: Beide Vorzeichen gemischt
        else if (activeLevel === 3) {
            if (confirmBtn) confirmBtn.style.display = "none";
            if (placementBtns) placementBtns.style.display = "none";
            if (pianoKeyboard) pianoKeyboard.style.display = "none";
            if (pianoLarge) pianoLarge.style.display = "none";

            renderInputButtons(ALL_ACC_BUTTONS);
            currentNoteKey = notenBeutel.next();
            setTaskText("Bestimme die Note (Kreuz oder B)", "#000");
            drawNote(currentNoteKey, "q");
        }
        // ----------------- LEVEL 4: Alle Noten bunt gemischt (Stammtöne, Kreuz, B)
        else if (activeLevel === 4) {
            if (confirmBtn) confirmBtn.style.display = "none";
            if (placementBtns) placementBtns.style.display = "none";
            if (pianoKeyboard) pianoKeyboard.style.display = "none";
            if (pianoLarge) pianoLarge.style.display = "none";

            renderInputButtons(ALL_NOTES_BUTTONS);
            currentNoteKey = allNotesMixedBeutel.next();
            setTaskText("Bestimme die Note (Stammton, Kreuz oder B)", "#000");
            drawNote(currentNoteKey, "q");
        }
        // ----------------- LEVEL 5: Note mit Vorzeichen setzen
        else if (activeLevel === 5) {
            if (confirmBtn) confirmBtn.style.display = "block";
            if (inputBtns) inputBtns.style.display = "none";
            if (pianoKeyboard) pianoKeyboard.style.display = "none";
            if (pianoLarge) pianoLarge.style.display = "none";
            if (placementBtns) placementBtns.style.display = "flex";

            targetNoteLetter = notenBeutel.next();
            lastNoteOctave = targetNoteLetter.split('/')[1];

            let noteLabel = targetNoteLetter.split('/')[0];
            let octave = targetNoteLetter.split('/')[1];
            const fullDisplayName = noteDisplayNames[noteLabel] || noteLabel.toUpperCase();
            let rangePrefix = (parseInt(octave) <= 4) ? "Tiefes" : "Hohes";

            setTaskText(`Platziere: "${rangePrefix}" ${fullDisplayName}`, "#3b5bdb");

            currentNoteIndex = 7;
            currentAccidental = "";
            updateAccidentalButtons();
            updatePlacedNote();
        }
        // ----------------- LEVEL 6: Notenname -> schwarze Klaviertaste
        else if (activeLevel === 6) {
            if (confirmBtn) confirmBtn.style.display = "none";
            if (placementBtns) placementBtns.style.display = "none";
            if (inputBtns) inputBtns.style.display = "none";
            if (pianoLarge) pianoLarge.style.display = "none";
            if (pianoKeyboard) pianoKeyboard.style.display = "flex";

            const rawNote = notenBeutel.next();
            const noteChar = rawNote.split('/')[0];
            targetNoteLetter = noteLogicNames[noteChar] || noteChar.toUpperCase();
            const fullDisplayName = noteDisplayNames[noteChar] || targetNoteLetter;

            setTaskText(`Suche die schwarze Taste für: ${fullDisplayName}`, "#3b5bdb");

            const keys = root.querySelectorAll('.piano-key');
            keys.forEach(k => { k.style.background = ''; k.style.color = ''; });

            drawNote(null);
        }
        // ----------------- LEVEL 7: Note im System -> Klaviatur (1 Oktave)
        else if (activeLevel === 7) {
            if (confirmBtn) confirmBtn.style.display = "none";
            if (placementBtns) placementBtns.style.display = "none";
            if (inputBtns) inputBtns.style.display = "none";
            if (pianoLarge) pianoLarge.style.display = "none";
            if (pianoKeyboard) pianoKeyboard.style.display = "flex";

            currentNoteKey = notenBeutel.next();
            const noteChar = currentNoteKey.split('/')[0];
            targetNoteLetter = noteLogicNames[noteChar] || noteChar.toUpperCase();

            setTaskText("Drücke die entsprechende Taste", "#3b5bdb");

            const keys = root.querySelectorAll('.piano-key');
            keys.forEach(k => { k.style.background = ''; k.style.color = ''; });

            drawNote(currentNoteKey, "q");
        }
        // ----------------- LEVEL 8 & 10: Note im System -> Große Klaviatur (2 Oktaven)
        else if (activeLevel === 8 || activeLevel === 10) {
            if (confirmBtn) confirmBtn.style.display = "none";
            if (placementBtns) placementBtns.style.display = "none";
            if (inputBtns) inputBtns.style.display = "none";
            if (pianoKeyboard) pianoKeyboard.style.display = "none";
            if (pianoLarge) pianoLarge.style.display = "flex";

            currentNoteKey = notenBeutel.next();

            setTaskText((activeLevel === 10) ? "Drücke die exakte Taste (10s Zeitlimit!)" : "Drücke die exakte Taste (auf die Oktave achten!)", "#3b5bdb");

            const keys = root.querySelectorAll('.piano-key');
            keys.forEach(k => { k.style.background = ''; k.style.color = ''; });

            drawNote(currentNoteKey, "q");
        }

        const output = $id("output");
        if (output) {
            output.style.display = (activeLevel === 6) ? "none" : "block";
        }
    }

    function confirmPlacement() {
        if (roundDone) return;
        let activeLv = currentLevel;
        if (currentLevel === 9) {
            activeLv = currentTaskLevel;
        }
        if (activeLv !== 5 || !placedNoteKey) return;

        isNoteLocked = true;

        if (placedNoteKey === targetNoteLetter) {
            if (currentLevel === 9 || currentLevel === 10) stopTimer();
            drawNote(placedNoteKey, "q", 150, "#12b76a");
            Core.sound.playNote(placedNoteKey, 0.8);
            handleCorrect();
        } else {
            drawNote(placedNoteKey, "q", 150, "#e5484d");
            handleWrong();
        }
    }

    function handleCorrect() {
        if (!isCurrentRoundFailed) {
            score++;
            $id("score").innerText = score;
        }

        roundCount++;
        roundDone = true;
        updateProgressBar();
        const btn = $id("continue-btn");
        if (btn) {
            btn.disabled = false;
            btn.textContent = (roundCount >= totalRoundsForCurrentLevel ? "Ergebnis →" : "Weiter →");
            btn.focus();
        }
    }

    function handleWrong() {
        isCurrentRoundFailed = true;
        roundDone = false;
        isNoteLocked = false;
        const btn = $id("continue-btn");
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Erneut versuchen ↺";
            btn.focus();
        }
    }

    function onContinue() {
        if (roundDone) {
            if (roundCount >= totalRoundsForCurrentLevel) {
                stopTimer();
                showFinalResult();
            } else {
                nextRound();
            }
        } else {
            retryCurrent();
            const btn = $id("continue-btn");
            if (btn) {
                btn.disabled = true;
                btn.textContent = "Weiter →";
            }
        }
    }

    const checkSvg = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    const crossSvg = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

    function showFeedbackPopup(isSolved, message) {
        const modal = $id("feedbackModal");
        if (!modal) return;
        const icon = $id("f-icon");
        const title = $id("f-title");
        const text = $id("f-text");
        const btn = $id("f-btn");

        if (isSolved) {
            if (icon) { icon.className = "feedback-modal-icon success"; icon.innerHTML = checkSvg; }
            if (title) { title.textContent = "Richtig!"; title.style.color = "#16a34a"; }
            if (text) { text.innerHTML = message || "Korrekt! Ausgezeichnet!"; }
            if (btn) {
                btn.textContent = (roundCount >= totalRoundsForCurrentLevel) ? "Ergebnis anzeigen →" : "Weiter →";
                btn.className = "modal-btn success-btn";
                btn.onclick = function () {
                    modal.style.display = "none";
                    nextRound();
                };
            }
        } else {
            if (icon) { icon.className = "feedback-modal-icon error"; icon.innerHTML = crossSvg; }
            if (title) { title.textContent = "Nicht ganz!"; title.style.color = "#ef4444"; }
            if (text) { text.innerHTML = message || "Leider falsch! Schau noch einmal genau hin."; }
            if (btn) {
                btn.textContent = "Erneut versuchen ↺";
                btn.className = "modal-btn retry-btn";
                btn.onclick = function () {
                    modal.style.display = "none";
                    retryCurrent();
                };
            }
        }
        modal.style.display = "flex";
        setTimeout(function () {
            if (btn) btn.focus();
        }, 50);
    }

    function retryCurrent() {
        const modal = $id("feedbackModal");
        if (modal) modal.style.display = "none";
        roundDone = false;
        isNoteLocked = false;

        const keys = root.querySelectorAll('.piano-key');
        keys.forEach(k => { k.style.background = ''; k.style.color = ''; });

        const allBtns = root.querySelectorAll("#v-input-buttons button, .answer-btn");
        allBtns.forEach(b => b.classList.remove("wrong", "correct"));

        let activeLv = currentLevel;
        if (currentLevel === 9) activeLv = currentTaskLevel;

        if (activeLv === 1) {
            renderInputButtons(SHARP_BUTTONS);
            drawNote(currentNoteKey, "q", 150, "black");
        } else if (activeLv === 2) {
            renderInputButtons(FLAT_BUTTONS);
            drawNote(currentNoteKey, "q", 150, "black");
        } else if (activeLv === 3) {
            renderInputButtons(ALL_ACC_BUTTONS);
            drawNote(currentNoteKey, "q", 150, "black");
        } else if (activeLv === 4) {
            renderInputButtons(ALL_NOTES_BUTTONS);
            drawNote(currentNoteKey, "q", 150, "black");
        } else if (activeLv === 5) {
            const placementBtns = $id("placement-buttons");
            if (placementBtns) placementBtns.style.display = "flex";
            const confirmBtn = $id("btn-confirm");
            if (confirmBtn) {
                confirmBtn.style.display = "block";
                confirmBtn.disabled = false;
                confirmBtn.innerText = "Bestätigen";
            }
            drawNote(placedNoteKey, "q", 150, "black");
        } else if (activeLv === 6) {
            const pianoKeyboard = $id("piano-keyboard");
            if (pianoKeyboard) pianoKeyboard.style.display = "flex";
        } else if (activeLv === 7) {
            const pianoKeyboard = $id("piano-keyboard");
            if (pianoKeyboard) pianoKeyboard.style.display = "flex";
            drawNote(currentNoteKey, "q", 150, "black");
        } else if (activeLv === 8 || activeLv === 10) {
            const pianoLarge = $id("piano-keyboard-large");
            if (pianoLarge) pianoLarge.style.display = "flex";
            drawNote(currentNoteKey, "q", 150, "black");
        }
    }

    function showFinalResult() {
        const percentage = (score / totalRoundsForCurrentLevel) * 100;
        let grade = 6;
        if (percentage >= 92) grade = 1;
        else if (percentage >= 80) grade = 2;
        else if (percentage >= 65) grade = 3;
        else if (percentage >= 50) grade = 4;
        else if (percentage >= 20) grade = 5;

        const isSpecLevel = (currentLevel === 9 || currentLevel === 10);
        const passed = isSpecLevel ? grade <= 2 : grade <= 3;
        const modal = $id("resultModal");
        modal.style.display = "flex";

        $id("modalGrade").innerText = grade;
        $id("modalStats").innerText = `${score} / ${totalRoundsForCurrentLevel} (${Math.round(percentage)}%)`;

        if (passed) {
            $id("modalTitle").innerText = "Level geschafft!";
            $id("modalGrade").style.color = "#12b76a";

            if (currentLevel === 9) {
                if (subLevelIndex < 5) {
                    subLevelIndex++;
                    $id("modalText").innerText = `Hervorragend! Weiter zur nächsten Stufe des Marathons (${subLevelIndex + 1} / 6).`;
                    modal.dataset.nextAction = "next_stage";
                } else {
                    subLevelIndex = 0;
                    if (maxUnlockedLevel < 10) maxUnlockedLevel = 10;
                    $id("modalText").innerText = "Grandios! Du hast den Vorzeichen-Marathon gemeistert. Level 10 ist nun bereit.";
                    modal.dataset.nextAction = "next";
                }
            } else if (currentLevel === 10) {
                $id("modalText").innerText = "Ultimativ! Du hast die Meister-Klaviatur mit Vorzeichen gemeistert!";
                modal.dataset.nextAction = "complete_all";
            } else {
                if (maxUnlockedLevel < currentLevel + 1) {
                    maxUnlockedLevel = currentLevel + 1;
                }
                $id("modalText").innerText = `Hervorragend! Level ${currentLevel + 1} ist nun freigeschaltet.`;
                modal.dataset.nextAction = "next";
            }
        } else {
            $id("modalTitle").innerText = "Nicht bestanden";
            $id("modalGrade").style.color = "#e5484d";
            let req = isSpecLevel ? "Note 2" : "Note 3";
            $id("modalText").innerText = `Wiederhole das Level für eine bessere Note (mindestens ${req}).`;
            modal.dataset.nextAction = "repeat";
        }
    }

    function closeModal() {
        $id("resultModal").style.display = "none";
        const action = $id("resultModal").dataset.nextAction;

        if (action === "next") {
            if (currentLevel < 10) {
                setLevel(currentLevel + 1);
            } else {
                setLevel(1);
            }
        } else if (action === "next_stage" || action === "repeat") {
            setLevel(currentLevel);
        } else {
            setLevel(1);
        }
    }

    function checkAnswer(guess, btn) {
        if (roundDone) return;
        let activeLv = currentLevel;
        if (currentLevel === 9) activeLv = currentTaskLevel;
        if (activeLv !== 1 && activeLv !== 2 && activeLv !== 3 && activeLv !== 4) return;

        if (!btn && typeof event !== 'undefined' && event && event.target) btn = event.target;

        let notePart = currentNoteKey.split('/')[0];
        let expectedLogic = noteLogicNames[notePart] || notePart.toUpperCase();
        let expectedDisplay = noteDisplayNames[notePart] || expectedLogic;

        const allBtns = root.querySelectorAll("#v-input-buttons button");

        let isCorrect = (guess === expectedLogic || guess === expectedDisplay ||
                         guess === notePart || enharmonics[guess] === expectedLogic);

        if (isCorrect) {
            if (currentLevel === 9 || currentLevel === 10) stopTimer();
            allBtns.forEach(b => b.classList.remove("wrong", "correct"));
            if (btn) btn.classList.add("correct");
            drawNote(currentNoteKey, "q", 150, "#12b76a");
            handleCorrect();
        } else {
            if (btn) btn.classList.add("wrong");
            drawNote(currentNoteKey, "q", 150, "#e5484d");
            handleWrong();
        }
    }

    function checkPianoKey(guess, element) {
        if (roundDone) return;
        let activeLv = currentLevel;
        if (currentLevel === 9) activeLv = currentTaskLevel;
        if (activeLv !== 6 && activeLv !== 7 && activeLv !== 8 && activeLv !== 10) return;

        // Klavierton beim Anschlagen der Taste abspielen
        if (activeLv === 8 || activeLv === 10) {
            Core.sound.playNote(guess, 0.7);
        } else {
            const m = guess.toLowerCase() + "/4";
            Core.sound.playNote(m, 0.7);
        }

        let isCorrect = false;
        if (activeLv === 8 || activeLv === 10) {
            isCorrect = (Core.midi(guess) === Core.midi(currentNoteKey));
        } else {
            isCorrect = (guess === targetNoteLetter || enharmonics[guess] === targetNoteLetter);
        }

        const keys = root.querySelectorAll('.piano-key');

        if (isCorrect) {
            if (currentLevel === 9 || currentLevel === 10) stopTimer();
            keys.forEach(k => { k.style.background = ''; k.style.color = ''; });
            element.style.background = "#12b76a";
            element.style.color = "#fff";
            if (activeLv === 7 || activeLv === 8 || activeLv === 10) {
                drawNote(currentNoteKey, "q", 150, "#12b76a");
            }
            handleCorrect();
        } else {
            element.style.background = "#e5484d";
            element.style.color = "#fff";
            if (activeLv === 7 || activeLv === 8 || activeLv === 10) {
                drawNote(currentNoteKey, "q", 150, "#e5484d");
            }
            handleWrong();
        }
    }

    function cancelLevel() {
        subLevelIndex = 0;
        setLevel(1);
    }

    function setLevel(lvl) {
        if (lvl === undefined || lvl === null) lvl = 1;

        if (lvl > 1 && lvl > maxUnlockedLevel) {
            $id("lockModal").style.display = "flex";
            return;
        }

        currentLevel = lvl;
        stopTimer();

        const placementBtns = $id("placement-buttons");
        const pianoNormal = $id("piano-keyboard");
        const pianoLarge = $id("piano-keyboard-large");

        totalRoundsForCurrentLevel = (lvl === 9) ? 10 : 20;

        const levels = [3, 4, 5, 6, 7, 8];
        let activeLv = lvl;
        if (lvl === 9) {
            activeLv = levels[subLevelIndex % levels.length];
        }

        if (placementBtns) {
            placementBtns.style.display = (activeLv === 5) ? "flex" : "none";
        }
        if (pianoNormal) pianoNormal.style.display = (activeLv === 6 || activeLv === 7) ? "flex" : "none";
        if (pianoLarge) pianoLarge.style.display = (activeLv === 8 || activeLv === 10) ? "flex" : "none";

        const output = $id("output");
        if (output) {
            output.style.display = (activeLv === 6) ? "none" : "block";
        }

        const isTimed = (lvl === 9 || lvl === 10);
        const cancelBtn = $id("btn-cancel");
        if (cancelBtn) cancelBtn.style.display = isTimed ? "inline-block" : "none";

        for (let i = 1; i <= 10; i++) {
            const btn = $id(`v-btn-lvl${i}`) || $id(`btn-lvl${i}`);
            if (btn) {
                const isLocked = (i > maxUnlockedLevel);
                btn.className = isLocked ? "lvl-locked" : (i === currentLevel ? "active" : "");
                btn.style.background = "";
                btn.style.color = "";
                btn.style.borderColor = "";

                if (isTimed && i !== lvl) {
                    btn.disabled = true;
                    btn.style.opacity = "0.5";
                    btn.style.cursor = "not-allowed";
                } else {
                    btn.disabled = false;
                    btn.style.opacity = "";
                    btn.style.cursor = "";
                }
            }
        }

        score = 0;
        roundCount = 0;
        sharpBeutel.neu();
        flatBeutel.neu();
        notenBeutel.neu();
        allNotesMixedBeutel.neu();
        $id("score").innerText = "0";
        updateProgressBar();
        nextRound();
    }

    function unlockAllLevels() {
        $id("unlockTitle").innerText = "Freischaltung";
        $id("unlockTitle").style.color = "#eab308";
        $id("unlockIcon").innerText = "";
        $id("unlockText").innerText = "Gib das Passwort ein:";
        $id("passwordContainer").style.display = "block";
        $id("unlockActionBtns").style.display = "flex";
        $id("unlockCloseBtn").style.display = "none";
        $id("unlockPassword").value = "";
        $id("unlockModal").style.display = "flex";
        setTimeout(() => $id("unlockPassword").focus(), 100);
    }

    function checkUnlockPassword() {
        const pw = $id("unlockPassword").value;
        if (pw === "Musikunterricht") {
            maxUnlockedLevel = 10;
            setLevel(currentLevel);
            $id("unlockModal").style.display = "none";
        } else if (pw === "Klaviatur") {
            maxUnlockedLevel = 6;
            setLevel(currentLevel);
            $id("unlockModal").style.display = "none";
        } else {
            $id("unlockTitle").innerText = "Falsches Passwort!";
            $id("unlockTitle").style.color = "#e5484d";
            $id("unlockIcon").innerText = "";
            $id("unlockText").innerText = "Bitte versuche es erneut.";
            $id("unlockPassword").value = "";
            $id("unlockPassword").focus();
        }
    }

    function showUnlockSuccess(message) {
        $id("unlockTitle").innerText = "Erfolg!";
        $id("unlockTitle").style.color = "#12b76a";
        $id("unlockIcon").innerText = "";
        $id("unlockText").innerText = message;
        $id("passwordContainer").style.display = "none";
        $id("unlockActionBtns").style.display = "none";
        $id("unlockCloseBtn").style.display = "block";
    }

    function open() {
        if (!started) {
            started = true;
            whenVexReady($id("error-display"), () => setLevel(1));
        } else {
            setLevel(currentLevel);
        }
    }

    function suspend() {
        stopTimer();
    }

    return {
        open, suspend, setLevel, cancelLevel, unlockAllLevels, checkUnlockPassword,
        checkAnswer, checkPianoKey, moveNote, confirmPlacement, setAccidental, closeModal, onContinue
    };
})();
