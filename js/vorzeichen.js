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
    let score = 0;
    let roundCount = 0;
    let currentLevel = 1;
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
                    feedback.innerText = "Zeit abgelaufen! ⏱️";
                    feedback.style.color = "#e74c3c";
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

    const notesToPractice = ["c/4", "c#/4", "db/4", "d/4", "d#/4", "eb/4", "e/4", "f/4", "f#/4", "gb/4", "g/4", "g#/4", "ab/4", "a/4", "bb/4", "b/4", "c/5", "c#/5", "db/5", "d/5", "d#/5", "eb/5", "e/5", "f/5", "f#/5", "gb/5", "g/5", "g#/5", "ab/5", "a/5", "bb/5", "b/5", "c/6"];
    const naturalNotes = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4", "c/5", "d/5", "e/5", "f/5", "g/5", "a/5", "b/5", "c/6"];
    const notesWithAccidentals = ["c#/4", "db/4", "d#/4", "eb/4", "f#/4", "gb/4", "g#/4", "ab/4", "bb/4", "c#/5", "db/5", "d#/5", "eb/5", "f#/5", "gb/5", "g#/5", "ab/5", "bb/5"];

    const noteDisplayNames = {
        'c': 'C', 'c#': 'Cis', 'db': 'Des', 'd': 'D', 'd#': 'Dis', 'eb': 'Es', 'e': 'E',
        'f': 'F', 'f#': 'Fis', 'gb': 'Ges', 'g': 'G', 'g#': 'Gis', 'ab': 'As', 'a': 'A',
        'bb': 'B', 'b': 'H'
    };

    const noteLogicNames = {
        'c': 'C', 'c#': 'C#', 'db': 'Db', 'd': 'D', 'd#': 'D#', 'eb': 'Eb', 'e': 'E',
        'f': 'F', 'f#': 'F#', 'gb': 'Gb', 'g': 'G', 'g#': 'G#', 'ab': 'Ab', 'a': 'A',
        'bb': 'B', 'b': 'H'
    };

    function setAccidental(acc) {
        if ((currentLevel === 3 || (currentLevel === 8 || currentLevel === 9) && currentTaskLevel === 3) && !isNoteLocked) {
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
        if (btnSharp) btnSharp.style.background = (currentAccidental === "#") ? "#f39c12" : "#7f8c8d";
        if (btnFlat) btnFlat.style.background = (currentAccidental === "b") ? "#f39c12" : "#7f8c8d";
    }

    function updatePlacedNote() {
        let baseNote = naturalNotes[currentNoteIndex]; // e.g. "c/4"
        let parts = baseNote.split("/");
        placedNoteKey = parts[0] + currentAccidental + "/" + parts[1];
        drawNote(placedNoteKey, "q");
    }

    function moveNote(dir) {
        let activeLv = currentLevel;
        if (currentLevel === 8 || currentLevel === 9) {
            const levels = [4, 1, 2, 3, 5, 6, 7];
            activeLv = levels[subLevelIndex];
        }
        if (activeLv !== 3 || isNoteLocked) return;
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

                // Aktives Level für Zeichnungslogik bestimmen
                let activeLv = currentLevel;
                if (currentLevel === 8 || currentLevel === 9) {
                    const levelSequence = [4, 1, 2, 3, 5, 6, 7];
                    activeLv = levelSequence[subLevelIndex];
                }

                // Accidentals
                const notePart = noteKey.split('/')[0];
                // Vorzeichen zeichnen
                if (notePart.length > 1) {
                    note.addAccidental(0, new VF.Accidental(notePart.substring(1)));
                }

                // Halsrichtung anpassen: Ab h/4 (Mittellinie) nach unten
                const octave = parseInt(noteKey.split('/')[1]);
                const noteName = noteKey.split('/')[0];
                if (octave > 4 || (octave === 4 && noteName.startsWith('b'))) {
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
        if (roundCount >= totalRoundsForCurrentLevel) {
            stopTimer();
            showFinalResult();
            return;
        }

        isNoteLocked = false;
        isCurrentRoundFailed = false;

        let activeLevel = currentLevel;
        if (currentLevel === 8 || currentLevel === 9) {
            const levelSequence = [1, 2, 3, 5, 6, 7];
            activeLevel = levelSequence[subLevelIndex % levelSequence.length];
            currentTaskLevel = activeLevel;
            if (currentLevel === 8) startTimer(20);
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

            let pool = [];
            // Sicherstellen, dass > 50% Noten mit Vorzeichen sind
            if (Math.random() < 0.6) {
                pool = notesWithAccidentals.filter(n => !recentNotes.includes(n));
            } else {
                pool = naturalNotes.filter(n => !recentNotes.includes(n));
            }
            if (pool.length === 0) pool = notesToPractice;

            targetNoteLetter = pool[Math.floor(Math.random() * pool.length)];
            recentNotes.push(targetNoteLetter);
            if (recentNotes.length > 3) recentNotes.shift();
            lastNoteOctave = targetNoteLetter.split('/')[1];

            let noteLabel = targetNoteLetter.split('/')[0];
            let octave = targetNoteLetter.split('/')[1];

            const fullDisplayName = noteDisplayNames[noteLabel] || noteLabel.toUpperCase();
            const singleName = fullDisplayName.includes('/') ? fullDisplayName.split('/')[Math.floor(Math.random() * 2)] : fullDisplayName;

            let displayTarget = "";
            const isCVariant = (noteLabel === 'c' || noteLabel === 'c#');

            if (isCVariant) {
                if (octave === "4") displayTarget = `"Tiefes" ${singleName}`;
                else if (octave === "5") displayTarget = `"Mittleres" ${singleName}`;
                else displayTarget = `"Hohes" ${singleName}`;
            } else {
                let rangePrefix = (parseInt(octave) <= 4) ? "Tiefes" : "Hohes";
                displayTarget = `"${rangePrefix}" ${singleName}`;
            }

            const feedback = $id("feedback");
            feedback.innerText = `Platziere: ${displayTarget}`;
            feedback.style.color = "#4a90e2";

            currentNoteIndex = 7;
            currentAccidental = "";
            updateAccidentalButtons();
            updatePlacedNote();
        } else if (activeLevel === 5) {
            // Level 5: Notenname -> Klaviertaste
            confirmBtn.style.display = "none";
            placementBtns.style.display = "none";
            inputBtns.style.display = "none";
            durationBtns.style.display = "none";
            const pianoLarge = $id("piano-keyboard-large");
            if (pianoLarge) pianoLarge.style.display = "none";
            pianoKeyboard.style.display = "flex";

            let pool = [];
            if (Math.random() < 0.6) {
                pool = notesWithAccidentals.filter(n => !recentNotes.includes(n));
            } else {
                pool = naturalNotes.filter(n => !recentNotes.includes(n));
            }
            if (pool.length === 0) pool = notesToPractice;

            const rawNote = pool[Math.floor(Math.random() * pool.length)];
            recentNotes.push(rawNote);
            if (recentNotes.length > 3) recentNotes.shift();
            const noteChar = rawNote.split('/')[0];
            targetNoteLetter = noteLogicNames[noteChar] || noteChar.toUpperCase();

            const fullDisplayName = noteDisplayNames[noteChar] || targetNoteLetter;
            const singleName = fullDisplayName.includes('/') ? fullDisplayName.split('/')[Math.floor(Math.random() * 2)] : fullDisplayName;

            $id("feedback").innerText = `Suche die Taste für: ${singleName}`;
            $id("feedback").style.color = "#4a90e2";

            // Tastenfarbe zurücksetzen
            const keys = root.querySelectorAll('.piano-key');
            keys.forEach(k => { k.style.background = k.classList.contains('black') ? '#333' : 'white'; });

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

            let pool = [];
            if (Math.random() < 0.6) {
                pool = notesWithAccidentals.filter(n => !recentNotes.includes(n));
            } else {
                pool = naturalNotes.filter(n => !recentNotes.includes(n));
            }
            if (pool.length === 0) pool = notesToPractice;

            currentNoteKey = pool[Math.floor(Math.random() * pool.length)];
            recentNotes.push(currentNoteKey);
            if (recentNotes.length > 3) recentNotes.shift();
            const noteChar = currentNoteKey.split('/')[0];
            targetNoteLetter = noteLogicNames[noteChar] || noteChar.toUpperCase();

            $id("feedback").innerText = "Drücke die entsprechende Taste";
            $id("feedback").style.color = "#4a90e2";

            // Tastenfarbe zurücksetzen
            const keys = root.querySelectorAll('.piano-key');
            keys.forEach(k => { k.style.background = k.classList.contains('black') ? '#333' : 'white'; });

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

            let pool = [];
            if (Math.random() < 0.6) {
                pool = notesWithAccidentals.filter(n => !recentNotes.includes(n));
            } else {
                pool = naturalNotes.filter(n => !recentNotes.includes(n));
            }
            if (pool.length === 0) pool = notesToPractice;

            currentNoteKey = pool[Math.floor(Math.random() * pool.length)];
            recentNotes.push(currentNoteKey);
            if (recentNotes.length > 3) recentNotes.shift();

            $id("feedback").innerText = "Drücke die exakte Taste (auf die Oktave achten!)";
            $id("feedback").style.color = "#4a90e2";

            // Tastenfarbe zurücksetzen (alle Klaviaturen)
            const keys = root.querySelectorAll('.piano-key');
            keys.forEach(k => { k.style.background = k.classList.contains('black') ? '#333' : 'white'; });

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

            $id("feedback").innerText = "Welcher Notenwert ist das?";
            $id("feedback").style.color = "#000";
            drawNote(currentNoteKey, currentNoteDuration);
        } else if (activeLevel === 10) {
            confirmBtn.style.display = "none";
            placementBtns.style.display = "none";
            inputBtns.style.display = "flex";
            durationBtns.style.display = "none";
            const pianoLarge = $id("piano-keyboard-large");
            if (pianoLarge) pianoLarge.style.display = "none";
            pianoKeyboard.style.display = "none";

            const pool = [...notesWithAccidentals];
            const filteredNotes = pool.filter(n => !recentNotes.includes(n));
            currentNoteKey = filteredNotes[Math.floor(Math.random() * filteredNotes.length)];
            recentNotes.push(currentNoteKey);
            if (recentNotes.length > 3) recentNotes.shift();

            $id("feedback").innerText = "Bestimme die Note (inkl. Vorzeichen)";
            $id("feedback").style.color = "#000";
            drawNote(currentNoteKey, "q");
        } else {
            confirmBtn.style.display = "none";
            placementBtns.style.display = "none";
            inputBtns.style.display = "flex";
            durationBtns.style.display = "none";
            const pianoLarge = $id("piano-keyboard-large");
            if (pianoLarge) pianoLarge.style.display = "none";
            pianoKeyboard.style.display = "none";

            let pool = [];
            if (Math.random() < 0.6) {
                pool = notesWithAccidentals.filter(n => !recentNotes.includes(n));
            } else {
                pool = naturalNotes.filter(n => !recentNotes.includes(n));
            }
            if (pool.length === 0) pool = notesToPractice;

            currentNoteKey = pool[Math.floor(Math.random() * pool.length)];
            recentNotes.push(currentNoteKey);
            if (recentNotes.length > 3) recentNotes.shift();
            $id("feedback").innerText = "Welche Note ist das?";
            $id("feedback").style.color = "#000";

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
        let activeLv = currentLevel;
        if (currentLevel === 8 || currentLevel === 9) {
            activeLv = currentTaskLevel;
            if (activeLv !== 3) return;
            stopTimer();
        } else {
            if (activeLv !== 3) return;
        }
        if (!placedNoteKey) return;

        isNoteLocked = true;

        // Normalisierung des Vergleichs
        // targetNoteLetter ist z.B. "c#/4"
        // placedNoteKey ist z.B. "c#/4" oder "db/4"

        // Wir vergleichen die absolute Tonhöhe (Enharmonik)
        const noteToMidi = (key) => {
            const names = {"c":0,"c#":1,"db":1,"d":2,"d#":3,"eb":3,"e":4,"f":5,"f#":6,"gb":6,"g":7,"g#":8,"ab":8,"a":9,"a#":10,"bb":10,"b":11};
            let parts = key.split("/");
            let name = parts[0].toLowerCase();
            let oct = parseInt(parts[1]);
            return (oct + 1) * 12 + names[name];
        };

        if (noteToMidi(placedNoteKey) === noteToMidi(targetNoteLetter)) {
            drawNote(placedNoteKey, "q", 150, "#2ecc71");
            handleCorrect();
        } else {
            drawNote(placedNoteKey, "q", 150, "#e74c3c");
            handleWrong();
        }
    }

    function handleCorrect() {
        const feedback = $id("feedback");
        feedback.innerText = "Korrekt! 🌟";
        feedback.style.color = "#2ecc71";

        if (!isCurrentRoundFailed) {
            score++;
            $id("score").innerText = score;
        }

        roundCount++;
        setTimeout(nextRound, 800);
    }

    function handleWrong() {
        isCurrentRoundFailed = true;
        const feedback = $id("feedback");
        const originalText = feedback.innerText;
        feedback.innerText = "Falsch! Versuche es nochmal ❌";
        feedback.style.color = "#e74c3c";

        isNoteLocked = false; // Wieder freischalten für Level 4

        // Tastenfarbe bei Fehler nach kurzer Zeit zurücksetzen
        setTimeout(() => {
            const keys = root.querySelectorAll('.piano-key');
            keys.forEach(k => { k.style.background = k.classList.contains('black') ? '#333' : 'white'; });

            // Text nach einer Weile zurücksetzen, falls noch nicht gelöst
            if (isCurrentRoundFailed && feedback.innerText.startsWith("Falsch")) {
                feedback.innerText = originalText;
                feedback.style.color = (currentLevel === 3 || (currentLevel >= 5 && currentLevel <= 7)) ? "#4a90e2" : "#000";
            }
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
            $id("modalTitle").innerText = "Level Geschafft! 🎉";
            $id("modalGrade").style.color = "#2ecc71";

            if (isSpecLevel) {
                if (subLevelIndex < 5) {
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
                if (currentLevel === 1) {
                    if (maxUnlockedLevel < 2) maxUnlockedLevel = 2;
                    $id("modalText").innerText = "Hervorragend! Level 2 ist nun freigeschaltet.";
                    modal.dataset.nextAction = "next";
                } else if (currentLevel === 2) {
                    if (maxUnlockedLevel < 3) maxUnlockedLevel = 3;
                    $id("modalText").innerText = "Hervorragend! Level 3 ist nun freigeschaltet.";
                    modal.dataset.nextAction = "next";
                } else if (currentLevel === 3) {
                    if (maxUnlockedLevel < 5) maxUnlockedLevel = 5;
                    $id("modalText").innerText = "Hervorragend! Level 4 ist nun freigeschaltet.";
                    modal.dataset.nextAction = "next";
                } else if (currentLevel === 7) {
                    if (maxUnlockedLevel < 8) maxUnlockedLevel = 8;
                    $id("modalText").innerText = "Hervorragend! Level 7 ist nun freigeschaltet.";
                    modal.dataset.nextAction = "next";
                } else if (currentLevel === 8) {
                    if (maxUnlockedLevel < 9) maxUnlockedLevel = 9;
                    $id("modalText").innerText = "Hervorragend! Level 8 ist nun freigeschaltet.";
                    modal.dataset.nextAction = "next";
                } else if (currentLevel === 9) {
                    $id("modalText").innerText = "Hervorragend! Du hast alle Level abgeschlossen.";
                    modal.dataset.nextAction = "complete_all";
                } else if (currentLevel < 7) {
                    if (maxUnlockedLevel <= currentLevel) {
                        maxUnlockedLevel = currentLevel + 1;
                    }
                    $id("modalText").innerText = "Hervorragend! Das nächste Level ist freigeschaltet.";
                    modal.dataset.nextAction = "next";
                }
            }
        } else {
            $id("modalTitle").innerText = "Nicht bestanden 😕";
            $id("modalGrade").style.color = "#e74c3c";

            let req = isSpecLevel ? "Note 2" : "Note 3";
            $id("modalText").innerText = `Wiederhole das Level für eine bessere Note (mind. ${req}).`;
            modal.dataset.nextAction = "repeat";
        }
    }

    function closeModal() {
        $id("resultModal").style.display = "none";
        const action = $id("resultModal").dataset.nextAction;
        if (action === "next") {
            if (currentLevel === 3) setLevel(5);
            else if (currentLevel === 5) setLevel(6);
            else if (currentLevel === 6) setLevel(7);
            else if (currentLevel === 7) setLevel(8);
            else if (currentLevel === 8) setLevel(9);
            else setLevel(currentLevel + 1);
        }
        else if (action === "next_stage") setLevel(currentLevel);
        else if (action === "repeat") setLevel(currentLevel);
        else if (action === "complete_all") setLevel(1);
        else setLevel(1);
    }

    function checkAnswer(guess) {
        if (currentLevel === 3 || currentLevel === 4) return;
        if (currentLevel === 8 || currentLevel === 9) {
            if (currentTaskLevel === 3 || currentTaskLevel === 4) return;
            stopTimer();
        }
        let notePart = currentNoteKey.split('/')[0];
        let expected = noteLogicNames[notePart] || notePart.toUpperCase();

        if (guess === expected) {
            drawNote(currentNoteKey, currentNoteDuration, 150, "#2ecc71");
            handleCorrect();
        } else {
            drawNote(currentNoteKey, currentNoteDuration, 150, "#e74c3c");
            handleWrong();
        }
    }

    function checkDuration(guess) {
        if (currentLevel === 8 || currentLevel === 9) {
            if (currentTaskLevel !== 4) return;
            stopTimer();
        } else {
            if (currentLevel !== 4) return;
        }
        if (guess === currentNoteDuration) {
            drawNote(currentNoteKey, currentNoteDuration, 150, "#2ecc71");
            handleCorrect();
        } else {
            drawNote(currentNoteKey, currentNoteDuration, 150, "#e74c3c");
            handleWrong();
        }
    }

    function checkPianoKey(guess, element) {
        let activeLv = currentLevel;
        if (currentLevel === 8 || currentLevel === 9) {
            activeLv = currentTaskLevel;
            if (activeLv !== 5 && activeLv !== 6 && activeLv !== 7) return;
            stopTimer();
        } else {
            if (activeLv !== 5 && activeLv !== 6 && activeLv !== 7) return;
        }

        // Enharmonische Prüfung für Klavier (Cis = Des etc.)
        const enharmonics = {
            'C#': 'Db', 'Db': 'C#',
            'D#': 'Eb', 'Eb': 'D#',
            'F#': 'Gb', 'Gb': 'F#',
            'G#': 'Ab', 'Ab': 'G#',
            'A#': 'Bb', 'Bb': 'A#', 'B': 'Bb'
        };

        let isCorrect = false;
        if (activeLv === 7) {
            isCorrect = (guess === currentNoteKey);
        } else {
            isCorrect = (guess === targetNoteLetter || enharmonics[guess] === targetNoteLetter);
        }

        if (isCorrect) {
            element.style.background = "#2ecc71"; // Grün bei Erfolg
            if (activeLv === 6 || activeLv === 7) {
                drawNote(currentNoteKey, "q", 150, "#2ecc71");
            }
            handleCorrect();
        } else {
            element.style.background = "#e74c3c"; // Rot bei Fehler
            if (activeLv === 6 || activeLv === 7) {
                drawNote(currentNoteKey, "q", 150, "#e74c3c");
            }
            handleWrong();
        }
    }

    function cancelLevel() {
        subLevelIndex = 0;
        setLevel(1);
    }

    function setLevel(lvl) {
        // Sicherstellen, dass das Level existiert und valide ist
        if (lvl === undefined || lvl === null) lvl = 1;

        // Spezialfall: Level 1 ist immer frei
        const isInitialLevel = (lvl === 1);

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
        const levels = [1, 2, 3, 4, 5, 6, 7];
        let activeLv = lvl;
        if (lvl === 8 || lvl === 9) {
            activeLv = levels[subLevelIndex % levels.length];
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

        for (let i of [1, 2, 3, 5, 6, 7, 8, 9]) {
            const btn = $id(`btn-lvl${i}`);
            if (btn) {
                const isLocked = (i !== 1 && i > maxUnlockedLevel);
                btn.className = isLocked ? "lvl-locked" : "";
                btn.style.background = (i === currentLevel) ? "#2ecc71" : (isLocked ? "#95a5a6" : "#4a90e2");

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
        $id("unlockTitle").innerText = "Freischaltung 🔑";
        $id("unlockTitle").style.color = "#f1c40f";
        $id("unlockIcon").innerText = "👨‍🏫";
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
        } else {
            $id("unlockTitle").innerText = "Falsches Passwort! ❌";
            $id("unlockTitle").style.color = "#e74c3c";
            $id("unlockIcon").innerText = "🚫";
            $id("unlockText").innerText = "Bitte versuche es erneut.";
            $id("unlockPassword").value = "";
            $id("unlockPassword").focus();
        }
    }

    function showUnlockSuccess(message) {
        $id("unlockTitle").innerText = "Erfolg! 🎉";
        $id("unlockTitle").style.color = "#2ecc71";
        $id("unlockIcon").innerText = "🔓";
        $id("unlockText").innerText = message;
        $id("passwordContainer").style.display = "none";
        $id("unlockActionBtns").style.display = "none";
        $id("unlockCloseBtn").style.display = "block";
    }

    // Modul öffnen: beim ersten Mal auf VexFlow warten, danach aktuelles Level neu starten
    function open() {
        if (!started) {
            started = true;
            whenVexReady($id("error-display"), () => setLevel(1));
        } else {
            setLevel(currentLevel);
        }
    }

    // Beim Verlassen des Moduls Timer anhalten
    function suspend() {
        stopTimer();
    }

    return { open, suspend, setLevel, cancelLevel, unlockAllLevels, checkUnlockPassword,
             checkAnswer, checkDuration, checkPianoKey, moveNote, confirmPlacement, closeModal,
             setAccidental };
    })();
