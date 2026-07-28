// ======================= MODUL: NOTEN =======================
    const NotenApp = (function() {
    const root = document.getElementById("module-noten");
    const $id = (id) => document.getElementById("n-" + id);
    const div = $id("output");
    let currentNoteKey = "";
    let currentNoteDuration = "q";
    let targetNoteLetter = "";
    let placedNoteKey = "c/5";
    let currentNoteIndex = 7;
    let isNoteLocked = false;
    let isCurrentRoundFailed = false;
    let roundDone = false;   // geloest, wartet auf "Weiter"
    let score = 0;
    let roundCount = 0;
    let currentLevel = 4;
    let maxUnlockedLevel = 0; // LocalStorage entfernt
    let lastNoteOctave = "";
    let recentNotes = [];
    let timerInterval = null;
    let timerValue = 0;
    let currentTaskLevel = 4;
    let subLevelIndex = 0;
    let totalRoundsForCurrentLevel = 20;
    let started = false;
    const durations = ["w", "h", "q", "8", "16"];

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

    const notesToPractice = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4", "c/5", "d/5", "e/5", "f/5", "g/5", "a/5", "b/5", "c/6"];

    function moveNote(dir) {
        if (roundDone) return;
        let activeLv = currentLevel;
        if (currentLevel === 8 || currentLevel === 9) {
            const levels = [4, 1, 2, 3, 5, 6, 7];
            activeLv = levels[subLevelIndex];
        }
        if (activeLv !== 3 || isNoteLocked) return;
        let newIndex = currentNoteIndex + dir;
        if (newIndex >= 0 && newIndex < notesToPractice.length) {
            currentNoteIndex = newIndex;
            placedNoteKey = notesToPractice[currentNoteIndex];
            drawNote(placedNoteKey, "q");
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
            // Renderer initialisieren
            let rendererType = VF.Renderer.Backends.SVG;
            if (typeof rendererType === "undefined") rendererType = 1;

            const renderer = new VF.Renderer(div, rendererType);
            renderer.resize(550, 250);
            const context = renderer.getContext();
            context.scale(1.7, 1.7);

            const stave = new VF.Stave(25, 10, 275); // Deutlich weniger Abstand nach oben (Y=10)
            stave.addClef("treble").setContext(context);
            stave.draw();

            if (noteKey) {
                const note = new VF.StaveNote({ keys: [noteKey], duration: duration });
                note.setStyle({ fillStyle: color, strokeStyle: color });

                // Halsrichtung anpassen: Ab h/4 (Mittellinie) nach unten
                const octave = parseInt(noteKey.split('/')[1]);
                const noteName = noteKey.split('/')[0];
                if (octave > 4 || (octave === 4 && (noteName === 'b' || noteName === 'h'))) {
                    note.setStemDirection(-1);
                } else {
                    note.setStemDirection(1);
                }

                const voice = new VF.Voice({num_beats: 4,  beat_value: 4});
                voice.setStrict(false);
                voice.addTickables([note]);

                new VF.Formatter().joinVoices([voice]).format([voice], 200);

                // Mitte des Systems
                let noteX = 135;
                let activeLv = currentLevel;
                if (currentLevel === 8 || currentLevel === 9) {
                    const levels = [4, 1, 2, 3, 5, 6, 7];
                    activeLv = levels[subLevelIndex];
                }
                if (activeLv === 3) {
                    noteX = Math.max(30, Math.min(xPos, 250));
                }
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
        const contBox = $id("continue");
        if (contBox) { contBox.style.display = "none"; contBox.innerHTML = ""; }
        if (roundCount >= totalRoundsForCurrentLevel) {
            stopTimer();
            showFinalResult();
            return;
        }

        isNoteLocked = false;
        isCurrentRoundFailed = false;

        // Feedback zurücksetzen
        const feedback = $id("feedback");
        feedback.innerText = "";
        feedback.style.color = "black";

        const taskInstr = $id("task-instruction");

        let activeLevel = currentLevel;
        if (currentLevel === 8 || currentLevel === 9) {
            const levelSequence = [4, 1, 2, 3, 5, 6, 7];
            activeLevel = levelSequence[subLevelIndex];
            currentTaskLevel = activeLevel;
            if (currentLevel === 8) startTimer(15);
            else startTimer(10);
        } else {
            stopTimer();
        }

        const confirmBtn = $id("btn-confirm");
        const inputBtns = $id("input-buttons");
        const durationBtns = $id("duration-buttons");
        const placementBtns = $id("placement-buttons");
        const pianoKeyboard = $id("piano-keyboard");

        $id("round-info").innerText = `Runde: ${roundCount + 1} / ${totalRoundsForCurrentLevel}`;

        if (activeLevel === 3) {
            confirmBtn.style.display = "none"; // In der Button-Reihe versteckt, aber hier ID-Steuerung
            inputBtns.style.display = "none";
            durationBtns.style.display = "none";
            placementBtns.style.display = "flex";
            const pianoLarge = $id("piano-keyboard-large");
            if (pianoLarge) pianoLarge.style.display = "none";
            pianoKeyboard.style.display = "none";

            // Den Bestätigen-Button innerhalb der Reihe einblenden
            const rowConfirmBtn = $id("btn-confirm");
            if (rowConfirmBtn) rowConfirmBtn.style.display = "block";

            let filteredNotes = notesToPractice.filter(n => !recentNotes.includes(n));
            if (lastNoteOctave !== "") {
                const alternateNotes = filteredNotes.filter(n => n.split('/')[1] !== lastNoteOctave);
                if (alternateNotes.length > 0) filteredNotes = alternateNotes;
            }
            targetNoteLetter = filteredNotes[Math.floor(Math.random() * filteredNotes.length)];
            recentNotes.push(targetNoteLetter);
            if (recentNotes.length > 3) recentNotes.shift();
            lastNoteOctave = targetNoteLetter.split('/')[1];

            let noteLabel = targetNoteLetter.split('/')[0];
            let octave = targetNoteLetter.split('/')[1];
            let name = noteLabel === 'b' ? 'H' : noteLabel.toUpperCase();
            let displayTarget = "";

            if (name === "C") {
                if (octave === "4") displayTarget = `"Tiefes" C`;
                else if (octave === "5") displayTarget = `"Mittleres" C`;
                else displayTarget = `"Hohes" C`;
            } else {
                if (octave === "4") displayTarget = `"Tiefes" ${name}`;
                else displayTarget = `"Hohes" ${name}`;
            }

            taskInstr.innerText = `Platziere: ${displayTarget}`;
            taskInstr.style.color = "#3b5bdb";

            currentNoteIndex = 7;
            placedNoteKey = notesToPractice[currentNoteIndex];
            drawNote(placedNoteKey, "q");
        } else if (activeLevel === 5) {
            // Level 5: Notenname -> Klaviertaste
            confirmBtn.style.display = "none";
            placementBtns.style.display = "none";
            inputBtns.style.display = "none";
            durationBtns.style.display = "none";
            const pianoLarge = $id("piano-keyboard-large");
            if (pianoLarge) pianoLarge.style.display = "none";
            pianoKeyboard.style.display = "flex";

            const filteredNotes = notesToPractice.filter(n => !recentNotes.includes(n));
            const rawNote = filteredNotes[Math.floor(Math.random() * filteredNotes.length)];
            recentNotes.push(rawNote);
            if (recentNotes.length > 3) recentNotes.shift();
            const noteChar = rawNote.split('/')[0];
            targetNoteLetter = noteChar === "b" ? "H" : noteChar.toUpperCase();

            taskInstr.innerText = `Suche die Taste für: ${targetNoteLetter}`;
            taskInstr.style.color = "#3b5bdb";

            // Tastenfarbe zurücksetzen
            const keys = root.querySelectorAll('.piano-key');
            keys.forEach(k => { k.style.background = ''; k.style.color = ''; });

            drawNote(null); // Kein Notensystem nötig oder leer? Lass es leer.
        } else if (activeLevel === 6) {
            // Level 6: Note im System -> Klaviertaste
            confirmBtn.style.display = "none";
            placementBtns.style.display = "none";
            inputBtns.style.display = "none";
            durationBtns.style.display = "none";
            const pianoLarge = $id("piano-keyboard-large");
            if (pianoLarge) pianoLarge.style.display = "none";
            pianoKeyboard.style.display = "flex";

            const filteredNotes = notesToPractice.filter(n => !recentNotes.includes(n));
            currentNoteKey = filteredNotes[Math.floor(Math.random() * filteredNotes.length)];
            recentNotes.push(currentNoteKey);
            if (recentNotes.length > 3) recentNotes.shift();
            const noteChar = currentNoteKey.split('/')[0];
            targetNoteLetter = noteChar === "b" ? "H" : noteChar.toUpperCase();

            taskInstr.innerText = "Drücke die entsprechende Taste";
            taskInstr.style.color = "#3b5bdb";

            // Tastenfarbe zurücksetzen
            const keys = root.querySelectorAll('.piano-key');
            keys.forEach(k => { k.style.background = ''; k.style.color = ''; });

            drawNote(currentNoteKey, "q");
        } else if (activeLevel === 7) {
            // Level 7: Note im System -> Spezifische Klaviertaste (Oktave zählt!)
            confirmBtn.style.display = "none";
            placementBtns.style.display = "none";
            inputBtns.style.display = "none";
            durationBtns.style.display = "none";

            const pianoNormal = $id("piano-keyboard");
            const pianoLarge = $id("piano-keyboard-large");
            pianoNormal.style.display = "none";
            pianoLarge.style.display = "flex";

            const filteredNotes = notesToPractice.filter(n => !recentNotes.includes(n));
            currentNoteKey = filteredNotes[Math.floor(Math.random() * filteredNotes.length)];
            recentNotes.push(currentNoteKey);
            if (recentNotes.length > 3) recentNotes.shift();

            taskInstr.innerText = "Drücke die exakte Taste (auf die Oktave achten!)";
            taskInstr.style.color = "#3b5bdb";

            // Tastenfarbe zurücksetzen (alle Klaviaturen)
            const keys = root.querySelectorAll('.piano-key');
            keys.forEach(k => { k.style.background = ''; k.style.color = ''; });

            drawNote(currentNoteKey, "q");
        } else if (activeLevel === 4) {
            confirmBtn.style.display = "none";
            placementBtns.style.display = "none";
            inputBtns.style.display = "none";
            durationBtns.style.display = "flex";
            const pianoLarge = $id("piano-keyboard-large");
            if (pianoLarge) pianoLarge.style.display = "none";
            pianoKeyboard.style.display = "none";

            const filteredNotes = notesToPractice.filter(n => !recentNotes.includes(n));
            currentNoteKey = filteredNotes[Math.floor(Math.random() * filteredNotes.length)];
            recentNotes.push(currentNoteKey);
            if (recentNotes.length > 3) recentNotes.shift();
            currentNoteDuration = durations[Math.floor(Math.random() * durations.length)];

            taskInstr.innerText = "Welcher Notenwert ist das?";
            taskInstr.style.color = "#333";
            drawNote(currentNoteKey, currentNoteDuration);
        } else {
            confirmBtn.style.display = "none";
            placementBtns.style.display = "none";
            inputBtns.style.display = "flex";
            durationBtns.style.display = "none";
            const pianoLarge = $id("piano-keyboard-large");
            if (pianoLarge) pianoLarge.style.display = "none";
            pianoKeyboard.style.display = "none";

            const filteredNotes = notesToPractice.filter(n => !recentNotes.includes(n));
            currentNoteKey = filteredNotes[Math.floor(Math.random() * filteredNotes.length)];
            recentNotes.push(currentNoteKey);
            if (recentNotes.length > 3) recentNotes.shift();
            taskInstr.innerText = "Welche Note ist das?";
            taskInstr.style.color = "#333";

            currentNoteDuration = "q";
            if (activeLevel === 2) {
                currentNoteDuration = durations[Math.floor(Math.random() * durations.length)];
            }
            drawNote(currentNoteKey, currentNoteDuration);
        }

        // Output display handling
        const output = $id("output");
        if (output) {
            output.style.display = (activeLevel === 5) ? "none" : "block";
        }
    }

    function handleInput(clientX, clientY, isFinal) {
        // Maus-Interaktion deaktiviert
        return;
    }

    div.addEventListener("mousemove", function(e) { handleInput(e.clientX, e.clientY, false); });
    div.addEventListener("click", function(e) { handleInput(e.clientX, e.clientY, true); });

    // Touch-Support für Tablets
    div.addEventListener("touchstart", function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        handleInput(touch.clientX, touch.clientY, false);
    }, {passive: false});

    div.addEventListener("touchmove", function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        handleInput(touch.clientX, touch.clientY, false);
    }, {passive: false});

    div.addEventListener("touchend", function(e) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        handleInput(touch.clientX, touch.clientY, true);
    }, {passive: false});

    function confirmPlacement() {
        if (roundDone) return;
        let activeLv = currentLevel;
        if (currentLevel === 8 || currentLevel === 9) {
            activeLv = currentTaskLevel;
            if (activeLv !== 3) return;
        } else {
            if (activeLv !== 3) return;
        }
        if (!placedNoteKey) return;

        isNoteLocked = true;

        // Prüfe ob der gesetzte Notenname dem gesuchten entspricht
        if (placedNoteKey === targetNoteLetter) {
            if (currentLevel === 8 || currentLevel === 9) stopTimer();
            drawNote(placedNoteKey, "q", 150, "#12b76a");
            handleCorrect();
        } else {
            drawNote(placedNoteKey, "q", 150, "#e5484d");
            handleWrong();
        }
    }

    function handleCorrect() {
        const feedback = $id("feedback");
        feedback.innerText = "Korrekt!";
        feedback.style.color = "#12b76a";

        if (!isCurrentRoundFailed) {
            score++;
            $id("score").innerText = score;
        }

        roundCount++;
        roundDone = true;
        showContinue();
    }

    /* Nach einer richtigen Loesung bleibt alles stehen, bis geklickt wird. */
    function showContinue() {
        ["input-buttons", "duration-buttons", "placement-buttons"].forEach(function (id) {
            const e = $id(id);
            if (e) e.style.display = "none";
        });
        const box = $id("continue");
        if (!box) return;
        box.innerHTML = "";
        const b = document.createElement("button");
        b.className = "continue-btn";
        b.textContent = (roundCount >= totalRoundsForCurrentLevel) ? "Ergebnis anzeigen" : "Weiter";
        b.addEventListener("click", nextRound);
        box.appendChild(b);
        box.style.display = "block";
    }

    function handleWrong() {
        const feedback = $id("feedback");
        feedback.innerText = "Falsch!";
        feedback.style.color = "#e5484d";
        isCurrentRoundFailed = true;

        // Tastenfarbe bei Fehler nach kurzer Zeit zurücksetzen
        setTimeout(() => {
            const keys = root.querySelectorAll('.piano-key');
            keys.forEach(k => { k.style.background = ''; k.style.color = ''; });

            // Note wieder schwarz zeichnen
            let activeLv = currentLevel;
            if (currentLevel === 8 || currentLevel === 9) activeLv = currentTaskLevel;

            if (activeLv === 3) {
                drawNote(placedNoteKey, "q", 150, "black");
                $id("btn-confirm").disabled = false;
                $id("btn-confirm").innerText = "Bestätigen";
            } else if (activeLv !== 5) {
                drawNote(currentNoteKey, currentNoteDuration, 150, "black");
            }

            isNoteLocked = false;
            feedback.innerText = "Versuche es erneut...";
            feedback.style.color = "#f59e0b"; // Orange für Wiederholung
        }, 1200);
    }

    function showFinalResult() {
        const percentage = (score / totalRoundsForCurrentLevel) * 100;
        let grade = 6;
        if (percentage >= 92) grade = 1;
        else if (percentage >= 80) grade = 2;
        else if (percentage >= 65) grade = 3;
        else if (percentage >= 50) grade = 4;
        else if (percentage >= 20) grade = 5;

        const isSpecLevel = (currentLevel === 8 || currentLevel === 9);
        const passed = isSpecLevel ? grade <= 2 : grade <= 3;
        const modal = $id("resultModal");
        modal.style.display = "flex";

        $id("modalGrade").innerText = grade;
        $id("modalStats").innerText = `${score} / ${totalRoundsForCurrentLevel} (${Math.round(percentage)}%)`;

        if (passed) {
            $id("modalTitle").innerText = "Level geschafft!";
            $id("modalGrade").style.color = "#12b76a";

            if (isSpecLevel) {
                if (subLevelIndex < 6) {
                    subLevelIndex++;
                    $id("modalText").innerText = `Hervorragend! Weiter zur nächsten Stufe von Level ${currentLevel}.`;
                    modal.dataset.nextAction = "next_stage";
                } else {
                    subLevelIndex = 0;
                    if (currentLevel === 8) {
                        if (maxUnlockedLevel < 9) maxUnlockedLevel = 9;
                        $id("modalText").innerText = "Grandios! Du hast den Level 8 Marathon abgeschlossen. Level 9 ist nun bereit.";
                        modal.dataset.nextAction = "next";
                    } else {
                        $id("modalText").innerText = "Ultimativ! Du hast den Level 9 Marathon gemeistert!";
                        modal.dataset.nextAction = "complete_all";
                    }
                }
            } else {
                // Logik für Freischaltung (Speicherung entfernt)
                if (currentLevel === 4) { // Level 1 -> schaltet Level 2 (ID 1) frei
                    if (maxUnlockedLevel < 1) maxUnlockedLevel = 1;
                    $id("modalText").innerText = "Hervorragend! Level 2 ist nun freigeschaltet.";
                    modal.dataset.nextAction = "next_special";
                } else if (currentLevel === 1) { // Level 2 -> schaltet Level 3 (ID 2) frei
                    if (maxUnlockedLevel < 2) maxUnlockedLevel = 2;
                    $id("modalText").innerText = "Hervorragend! Level 3 ist nun freigeschaltet.";
                    modal.dataset.nextAction = "next";
                } else if (currentLevel === 2) { // Level 3 -> schaltet Level 4 (ID 3) frei
                    if (maxUnlockedLevel < 3) maxUnlockedLevel = 3;
                    $id("modalText").innerText = "Hervorragend! Level 4 ist nun freigeschaltet.";
                    modal.dataset.nextAction = "next";
                } else if (currentLevel === 7) {
                    if (maxUnlockedLevel < 8) maxUnlockedLevel = 8;
                    $id("modalText").innerText = "Hervorragend! Level 8 ist nun freigeschaltet.";
                    modal.dataset.nextAction = "next";
                } else if (currentLevel < 7) {
                    if (maxUnlockedLevel <= currentLevel) {
                        if (currentLevel === 3) maxUnlockedLevel = 5; // Level 4 -> Level 5
                        else maxUnlockedLevel = currentLevel + 1;
                    }
                    $id("modalText").innerText = "Hervorragend! Das nächste Level ist freigeschaltet.";
                    modal.dataset.nextAction = "next";
                }
            }
        } else {
            $id("modalTitle").innerText = "Nicht bestanden";
            $id("modalGrade").style.color = "#e5484d";

            let req = isSpecLevel ? "Note 2" : "Note 3";
            $id("modalText").innerText = `Wiederhole das Level für eine bessere Note (mind. ${req}).`;
            modal.dataset.nextAction = "repeat";
        }
    }

    function closeModal() {
        $id("resultModal").style.display = "none";
        const action = $id("resultModal").dataset.nextAction;

        // Reihenfolge der Level-IDs für linearen Fortschritt:
        // Level 1(4), 2(1), 3(2), 4(3), 5(5), 6(6), 7(7), 8(8), 9(9)
        const levelSequence = [4, 1, 2, 3, 5, 6, 7, 8, 9];
        const currentIndex = levelSequence.indexOf(currentLevel);

        if (action === "next" || action === "next_special" || action === "next_to_5") {
            if (currentIndex !== -1 && currentIndex < levelSequence.length - 1) {
                setLevel(levelSequence[currentIndex + 1]);
            } else {
                setLevel(4);
            }
        }
        else if (action === "next_stage") setLevel(currentLevel);
        else if (action === "repeat") setLevel(currentLevel);
        else if (action === "complete_all") setLevel(4);
        else setLevel(4);
    }

    function checkAnswer(guess) {
        if (roundDone) return;
        if (currentLevel === 3 || currentLevel === 4) return;
        if (currentLevel === 8 || currentLevel === 9) {
            if (currentTaskLevel === 3 || currentTaskLevel === 4) return;
        }
        let noteLetter = currentNoteKey.split('/')[0];
        let expected = noteLetter === 'b' ? 'H' : noteLetter.toUpperCase();
        if (guess === expected) {
            if (currentLevel === 8 || currentLevel === 9) stopTimer();
            drawNote(currentNoteKey, currentNoteDuration, 150, "#12b76a");
            handleCorrect();
        } else {
            drawNote(currentNoteKey, currentNoteDuration, 150, "#e5484d");
            handleWrong();
        }
    }

    function checkDuration(guess) {
        if (roundDone) return;
        if (currentLevel === 8 || currentLevel === 9) {
            if (currentTaskLevel !== 4) return;
        } else {
            if (currentLevel !== 4) return;
        }
        if (guess === currentNoteDuration) {
            if (currentLevel === 8 || currentLevel === 9) stopTimer();
            drawNote(currentNoteKey, currentNoteDuration, 150, "#12b76a");
            handleCorrect();
        } else {
            drawNote(currentNoteKey, currentNoteDuration, 150, "#e5484d");
            handleWrong();
        }
    }

    function checkPianoKey(guess, element) {
        if (roundDone) return;
        let activeLv = currentLevel;
        if (currentLevel === 8 || currentLevel === 9) {
            activeLv = currentTaskLevel;
            if (activeLv !== 5 && activeLv !== 6 && activeLv !== 7) return;
        } else {
            if (activeLv !== 5 && activeLv !== 6 && activeLv !== 7) return;
        }

        let isCorrect = false;
        if (activeLv === 7) {
            isCorrect = (guess === currentNoteKey);
        } else {
            isCorrect = (guess === targetNoteLetter);
        }

        if (isCorrect) {
            if (currentLevel === 8 || currentLevel === 9) stopTimer();
            element.style.background = "#12b76a"; element.style.color = "#fff"; // Grün bei Erfolg
            if (activeLv === 6 || activeLv === 7) {
                drawNote(currentNoteKey, "q", 150, "#12b76a");
            }
            handleCorrect();
        } else {
            element.style.background = "#e5484d"; element.style.color = "#fff"; // Rot bei Fehler
            if (activeLv === 6 || activeLv === 7) {
                drawNote(currentNoteKey, "q", 150, "#e5484d");
            }
            handleWrong();
        }
    }

    function cancelLevel() {
        subLevelIndex = 0;
        setLevel(4);
    }

    function setLevel(lvl) {
        // Sicherstellen, dass das Level existiert und valide ist
        if (lvl === undefined || lvl === null) lvl = 4;

        // Spezialfall: Level 1 (ID 4) ist immer frei
        const isInitialLevel = (lvl === 4);

        if (!isInitialLevel && lvl > maxUnlockedLevel) {
            $id("lockModal").style.display = "flex";
            return;
        }

        currentLevel = lvl;
        stopTimer();

        // Buttons für Platzierung (Level 4, ID 3) nur dann anzeigen
        const placementBtns = $id("placement-buttons");
        if (placementBtns) {
            placementBtns.style.display = (lvl === 3) ? "flex" : "none";
        }

        totalRoundsForCurrentLevel = (lvl === 8 || lvl === 9) ? 10 : 20;

        // Klaviaturen
        const pianoNormal = $id("piano-keyboard");
        const pianoLarge = $id("piano-keyboard-large");

        // Aktives Level bestimmen (Marathon oder Normal)
        const levels = [4, 1, 2, 3, 5, 6, 7];
        let activeLv = lvl;
        if (lvl === 8 || lvl === 9) {
            activeLv = levels[subLevelIndex];
        }

        if (pianoNormal) pianoNormal.style.display = (activeLv === 5 || activeLv === 6) ? "flex" : "none";
        if (pianoLarge) pianoLarge.style.display = (activeLv === 7) ? "flex" : "none";

        // Notenausgabe ausblenden für Level 5
        const output = $id("output");
        if (output) {
            output.style.display = (activeLv === 5) ? "none" : "block";
        }

        // Buttons stylen (Highlighting)
        const isMarathon = (lvl === 8 || lvl === 9);
        const cancelBtn = $id("btn-cancel");
        if (cancelBtn) cancelBtn.style.display = isMarathon ? "inline-block" : "none";

        for (let i of [4, 1, 2, 3, 5, 6, 7, 8, 9]) {
            const btn = $id(`btn-lvl${i}`);
            if (btn) {
                const isLocked = (i !== 4 && i > maxUnlockedLevel);
                btn.className = isLocked ? "lvl-locked" : "";
                btn.style.background = (i === currentLevel) ? "#12b76a" : (isLocked ? "#98a2b3" : "#3b5bdb");

                // Während Marathon andere Buttons sperren
                if (isMarathon && i !== lvl) {
                    btn.disabled = true;
                    btn.style.opacity = "0.5";
                    btn.style.cursor = "not-allowed";
                } else {
                    btn.disabled = false;
                    btn.style.opacity = "1";
                    btn.style.cursor = "pointer";
                }
            }
        }

        score = 0;
        roundCount = 0;
        recentNotes = [];
        $id("score").innerText = "0";
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
            maxUnlockedLevel = 9;
            setLevel(currentLevel);
            showUnlockSuccess("Alle Level wurden freigeschaltet!");
        } else if (pw === "Klaviatur") {
            maxUnlockedLevel = 5;
            setLevel(currentLevel);
            showUnlockSuccess("Level 1 bis 5 wurden freigeschaltet!");
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

    // Modul öffnen: beim ersten Mal auf VexFlow warten, danach aktuelles Level neu starten
    function open() {
        if (!started) {
            started = true;
            whenVexReady($id("error-display"), () => setLevel(4)); // Startet mit Level 1 (ID 4)
        } else {
            setLevel(currentLevel);
        }
    }

    // Beim Verlassen des Moduls Timer anhalten
    function suspend() {
        stopTimer();
    }

    return { open, suspend, setLevel, cancelLevel, unlockAllLevels, checkUnlockPassword,
             checkAnswer, checkDuration, checkPianoKey, moveNote, confirmPlacement, closeModal };
    })();
