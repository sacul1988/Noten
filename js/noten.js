// ======================= MODUL: NOTEN (NOTEN LESEN) =======================
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

    // Basisnoten (C4 bis C5) für Level 1
    const basicNotes = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4", "c/5"];
    const basicBeutel = Core.createBag(basicNotes);

    // Alle Noten mit Hilfslinien (C4 bis C6) für Level 2..8
    const notesToPractice = [
        "c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4",
        "c/5", "d/5", "e/5", "f/5", "g/5", "a/5", "b/5", "c/6"
    ];
    const notenBeutel = Core.createBag(notesToPractice);

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

    function moveNote(dir) {
        if (roundDone) return;
        let activeLv = currentLevel;
        if (currentLevel === 7 || currentLevel === 8) {
            const levels = [1, 2, 3, 4, 5, 6];
            activeLv = levels[subLevelIndex % levels.length];
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

                // Halsrichtung anpassen: Ab h/4 nach unten
                const octave = parseInt(noteKey.split('/')[1]);
                const noteName = noteKey.split('/')[0];
                if (octave > 4 || (octave === 4 && (noteName === 'b' || noteName === 'h'))) {
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
        const allBtns = root.querySelectorAll("#n-input-buttons button");
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

        const feedback = $id("feedback");
        if (feedback) {
            feedback.innerText = "";
            feedback.style.color = "black";
        }

        const taskInstr = $id("task-instruction");

        let activeLevel = currentLevel;
        if (currentLevel === 7) {
            const levelSequence = [1, 2, 3, 4, 5, 6];
            activeLevel = levelSequence[subLevelIndex % levelSequence.length];
            currentTaskLevel = activeLevel;
            startTimer(15);
        } else if (currentLevel === 8) {
            activeLevel = 8;
            currentTaskLevel = 8;
            startTimer(10);
        } else {
            stopTimer();
        }

        const confirmBtn = $id("btn-confirm");
        const inputBtns = $id("input-buttons");
        const placementBtns = $id("placement-buttons");
        const pianoKeyboard = $id("piano-keyboard");
        const pianoLarge = $id("piano-keyboard-large");

        $id("round-info").innerText = `Runde: ${roundCount + 1} / ${totalRoundsForCurrentLevel}`;
        updateProgressBar();

        // ----------------- LEVEL 1: Stammtöne C4 bis C5
        if (activeLevel === 1) {
            if (confirmBtn) confirmBtn.style.display = "none";
            if (placementBtns) placementBtns.style.display = "none";
            if (pianoKeyboard) pianoKeyboard.style.display = "none";
            if (pianoLarge) pianoLarge.style.display = "none";
            if (inputBtns) inputBtns.style.display = "flex";

            currentNoteKey = basicBeutel.next();
            currentNoteDuration = "q";
            if (taskInstr) {
                taskInstr.innerText = "Welche Note ist das? (C bis C')";
                taskInstr.style.color = "#333";
            }
            drawNote(currentNoteKey, currentNoteDuration);
        }
        // ----------------- LEVEL 2: Erweitert mit Hilfslinien (C4 bis C6)
        else if (activeLevel === 2) {
            if (confirmBtn) confirmBtn.style.display = "none";
            if (placementBtns) placementBtns.style.display = "none";
            if (pianoKeyboard) pianoKeyboard.style.display = "none";
            if (pianoLarge) pianoLarge.style.display = "none";
            if (inputBtns) inputBtns.style.display = "flex";

            currentNoteKey = notenBeutel.next();
            currentNoteDuration = "q";
            if (taskInstr) {
                taskInstr.innerText = "Welche Note ist das? (inkl. Hilfslinien)";
                taskInstr.style.color = "#333";
            }
            drawNote(currentNoteKey, currentNoteDuration);
        }
        // ----------------- LEVEL 3: Note selbst platzieren
        else if (activeLevel === 3) {
            if (inputBtns) inputBtns.style.display = "none";
            if (pianoKeyboard) pianoKeyboard.style.display = "none";
            if (pianoLarge) pianoLarge.style.display = "none";
            if (placementBtns) placementBtns.style.display = "flex";
            if (confirmBtn) confirmBtn.style.display = "block";

            targetNoteLetter = notenBeutel.next();
            lastNoteOctave = targetNoteLetter.split('/')[1];

            let noteLabel = targetNoteLetter.split('/')[0];
            let octave = targetNoteLetter.split('/')[1];
            let name = noteLabel === 'b' ? 'H' : noteLabel.toUpperCase();
            let displayTarget = "";

            if (name === "C") {
                if (octave === "4") displayTarget = `Tiefes C (unter dem System)`;
                else if (octave === "5") displayTarget = `Mittleres C (im System)`;
                else displayTarget = `Hohes C (über dem System)`;
            } else {
                if (octave === "4") displayTarget = `Tiefes ${name}`;
                else displayTarget = `Hohes ${name}`;
            }

            if (taskInstr) {
                taskInstr.innerText = `Platziere die Note: ${displayTarget}`;
                taskInstr.style.color = "#3b5bdb";
            }

            currentNoteIndex = 7;
            placedNoteKey = notesToPractice[currentNoteIndex];
            drawNote(placedNoteKey, "q");
        }
        // ----------------- LEVEL 4: Notenname -> Klaviertaste
        else if (activeLevel === 4) {
            if (confirmBtn) confirmBtn.style.display = "none";
            if (placementBtns) placementBtns.style.display = "none";
            if (inputBtns) inputBtns.style.display = "none";
            if (pianoLarge) pianoLarge.style.display = "none";
            if (pianoKeyboard) pianoKeyboard.style.display = "flex";

            const rawNote = notenBeutel.next();
            const noteChar = rawNote.split('/')[0];
            targetNoteLetter = noteChar === "b" ? "H" : noteChar.toUpperCase();

            if (taskInstr) {
                taskInstr.innerText = `Finde die Taste für: ${targetNoteLetter}`;
                taskInstr.style.color = "#3b5bdb";
            }

            const keys = root.querySelectorAll('.piano-key');
            keys.forEach(k => { k.style.background = ''; k.style.color = ''; });

            drawNote(null);
        }
        // ----------------- LEVEL 5: Note im System -> Klaviertaste (1 Oktave)
        else if (activeLevel === 5) {
            if (confirmBtn) confirmBtn.style.display = "none";
            if (placementBtns) placementBtns.style.display = "none";
            if (inputBtns) inputBtns.style.display = "none";
            if (pianoLarge) pianoLarge.style.display = "none";
            if (pianoKeyboard) pianoKeyboard.style.display = "flex";

            currentNoteKey = notenBeutel.next();
            const noteChar = currentNoteKey.split('/')[0];
            targetNoteLetter = noteChar === "b" ? "H" : noteChar.toUpperCase();

            if (taskInstr) {
                taskInstr.innerText = "Drücke die passende Klaviertaste für diese Note";
                taskInstr.style.color = "#3b5bdb";
            }

            const keys = root.querySelectorAll('.piano-key');
            keys.forEach(k => { k.style.background = ''; k.style.color = ''; });

            drawNote(currentNoteKey, "q");
        }
        // ----------------- LEVEL 6 & LEVEL 8: Note im System -> Große Klaviatur (2 Oktaven)
        else if (activeLevel === 6 || activeLevel === 8) {
            if (confirmBtn) confirmBtn.style.display = "none";
            if (placementBtns) placementBtns.style.display = "none";
            if (inputBtns) inputBtns.style.display = "none";
            if (pianoKeyboard) pianoKeyboard.style.display = "none";
            if (pianoLarge) pianoLarge.style.display = "flex";

            currentNoteKey = notenBeutel.next();

            if (taskInstr) {
                taskInstr.innerText = (activeLevel === 8) ? "Drücke die exakte Taste (10s Zeitlimit!)" : "Drücke die exakte Taste (auf die Oktave achten!)";
                taskInstr.style.color = "#3b5bdb";
            }

            const keys = root.querySelectorAll('.piano-key');
            keys.forEach(k => { k.style.background = ''; k.style.color = ''; });

            drawNote(currentNoteKey, "q");
        }

        const output = $id("output");
        if (output) {
            output.style.display = (activeLevel === 4) ? "none" : "block";
            output.classList.remove("interactive-staff");
        }
    }

    function confirmPlacement() {
        if (roundDone) return;
        let activeLv = currentLevel;
        if (currentLevel === 7) {
            activeLv = currentTaskLevel;
        }
        if (activeLv !== 3) return;
        if (!placedNoteKey) return;

        isNoteLocked = true;

        if (placedNoteKey === targetNoteLetter) {
            if (currentLevel === 7 || currentLevel === 8) stopTimer();
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

    function retryCurrent() {
        const modal = $id("feedbackModal");
        if (modal) modal.style.display = "none";
        roundDone = false;
        isNoteLocked = false;

        const keys = root.querySelectorAll('.piano-key');
        keys.forEach(k => { k.style.background = ''; k.style.color = ''; });

        const allBtns = root.querySelectorAll("#n-input-buttons button, .answer-btn");
        allBtns.forEach(b => b.classList.remove("wrong", "correct"));

        let activeLv = currentLevel;
        if (currentLevel === 7) activeLv = currentTaskLevel;

        if (activeLv === 1 || activeLv === 2) {
            const inputBtns = $id("input-buttons");
            if (inputBtns) inputBtns.style.display = "flex";
            drawNote(currentNoteKey, currentNoteDuration, 150, "black");
        } else if (activeLv === 3) {
            const placementBtns = $id("placement-buttons");
            if (placementBtns) placementBtns.style.display = "flex";
            const confirmBtn = $id("btn-confirm");
            if (confirmBtn) {
                confirmBtn.style.display = "block";
                confirmBtn.disabled = false;
                confirmBtn.innerText = "Bestätigen";
            }
            drawNote(placedNoteKey, "q", 150, "black");
        } else if (activeLv === 4) {
            const pianoKeyboard = $id("piano-keyboard");
            if (pianoKeyboard) pianoKeyboard.style.display = "flex";
        } else if (activeLv === 5) {
            const pianoKeyboard = $id("piano-keyboard");
            if (pianoKeyboard) pianoKeyboard.style.display = "flex";
            drawNote(currentNoteKey, currentNoteDuration, 150, "black");
        } else if (activeLv === 6 || activeLv === 8) {
            const pianoLarge = $id("piano-keyboard-large");
            if (pianoLarge) pianoLarge.style.display = "flex";
            drawNote(currentNoteKey, currentNoteDuration, 150, "black");
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

        const passed = (currentLevel === 7 || currentLevel === 8) ? grade <= 2 : grade <= 3;
        const modal = $id("resultModal");
        modal.style.display = "flex";

        $id("modalGrade").innerText = grade;
        $id("modalStats").innerText = `${score} / ${totalRoundsForCurrentLevel} (${Math.round(percentage)}%)`;

        if (passed) {
            $id("modalTitle").innerText = "Level geschafft!";
            $id("modalGrade").style.color = "#12b76a";

            if (currentLevel === 7) {
                if (subLevelIndex < 5) {
                    subLevelIndex++;
                    $id("modalText").innerText = `Hervorragend! Weiter zur nächsten Stufe von Level 7.`;
                    modal.dataset.nextAction = "next_stage";
                } else {
                    subLevelIndex = 0;
                    if (maxUnlockedLevel < 8) maxUnlockedLevel = 8;
                    $id("modalText").innerText = "Grandios! Du hast die Tempo-Challenge abgeschlossen. Level 8 ist nun bereit.";
                    modal.dataset.nextAction = "next";
                }
            } else if (currentLevel === 8) {
                $id("modalText").innerText = "Ultimativ! Du hast die Meister-Klaviatur mit Bestnote gemeistert!";
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

            let req = (currentLevel === 7 || currentLevel === 8) ? "Note 2" : "Note 3";
            $id("modalText").innerText = `Wiederhole das Level für eine bessere Note (mindestens ${req}).`;
            modal.dataset.nextAction = "repeat";
        }
    }

    function closeModal() {
        $id("resultModal").style.display = "none";
        const action = $id("resultModal").dataset.nextAction;

        if (action === "next") {
            if (currentLevel < 8) {
                setLevel(currentLevel + 1);
            } else {
                setLevel(1);
            }
        } else if (action === "next_stage") {
            setLevel(currentLevel);
        } else if (action === "repeat") {
            setLevel(currentLevel);
        } else {
            setLevel(1);
        }
    }

    function checkAnswer(guess, btn) {
        if (roundDone) return;
        let activeLv = currentLevel;
        if (currentLevel === 7) {
            activeLv = currentTaskLevel;
        }
        if (activeLv !== 1 && activeLv !== 2) return;

        if (!btn && typeof event !== 'undefined' && event && event.target) btn = event.target;

        let noteLetter = currentNoteKey.split('/')[0];
        let expected = noteLetter === 'b' ? 'H' : noteLetter.toUpperCase();

        const allBtns = root.querySelectorAll("#n-input-buttons button");

        if (guess === expected) {
            if (currentLevel === 7 || currentLevel === 8) stopTimer();
            allBtns.forEach(b => b.classList.remove("wrong", "correct"));
            if (btn) btn.classList.add("correct");
            drawNote(currentNoteKey, currentNoteDuration, 150, "#12b76a");
            handleCorrect();
        } else {
            if (btn) btn.classList.add("wrong");
            drawNote(currentNoteKey, currentNoteDuration, 150, "#e5484d");
            handleWrong();
        }
    }

    function checkPianoKey(guess, element) {
        if (roundDone) return;
        let activeLv = currentLevel;
        if (currentLevel === 7) {
            activeLv = currentTaskLevel;
        }
        if (activeLv !== 4 && activeLv !== 5 && activeLv !== 6 && activeLv !== 8) return;

        // Ton auf Klaviertaste sofort spielen
        if (activeLv === 6 || activeLv === 8) {
            Core.sound.playNote(guess, 0.7);
        } else {
            const keyGuess = (guess === 'H' ? 'b' : guess.toLowerCase()) + "/4";
            Core.sound.playNote(keyGuess, 0.7);
        }

        let isCorrect = false;
        if (activeLv === 6 || activeLv === 8) {
            isCorrect = (guess === currentNoteKey);
        } else {
            isCorrect = (guess === targetNoteLetter);
        }

        const keys = root.querySelectorAll('.piano-key');

        if (isCorrect) {
            if (currentLevel === 7 || currentLevel === 8) stopTimer();
            keys.forEach(k => { k.style.background = ''; k.style.color = ''; });
            element.style.background = "#12b76a";
            element.style.color = "#fff";
            if (activeLv === 5 || activeLv === 6 || activeLv === 8) {
                drawNote(currentNoteKey, "q", 150, "#12b76a");
            }
            handleCorrect();
        } else {
            element.style.background = "#e5484d";
            element.style.color = "#fff";
            if (activeLv === 5 || activeLv === 6 || activeLv === 8) {
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
        if (placementBtns) {
            placementBtns.style.display = (lvl === 3) ? "flex" : "none";
        }

        totalRoundsForCurrentLevel = (lvl === 7) ? 10 : 20;

        const pianoNormal = $id("piano-keyboard");
        const pianoLarge = $id("piano-keyboard-large");

        let activeLv = lvl;
        if (lvl === 7) {
            const levels = [1, 2, 3, 4, 5, 6];
            activeLv = levels[subLevelIndex % levels.length];
        } else if (lvl === 8) {
            activeLv = 8;
        }

        if (pianoNormal) pianoNormal.style.display = (activeLv === 4 || activeLv === 5) ? "flex" : "none";
        if (pianoLarge) pianoLarge.style.display = (activeLv === 6 || activeLv === 8) ? "flex" : "none";

        const output = $id("output");
        if (output) {
            output.style.display = (activeLv === 4) ? "none" : "block";
            output.classList.remove("interactive-staff");
        }

        const isTimed = (lvl === 7 || lvl === 8);
        const cancelBtn = $id("btn-cancel");
        if (cancelBtn) cancelBtn.style.display = isTimed ? "inline-block" : "none";

        for (let i = 1; i <= 8; i++) {
            const btn = $id(`n-btn-lvl${i}`) || $id(`btn-lvl${i}`);
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
        basicBeutel.neu();
        notenBeutel.neu();
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
            maxUnlockedLevel = 8;
            setLevel(currentLevel);
            $id("unlockModal").style.display = "none";
        } else if (pw === "Klaviatur") {
            maxUnlockedLevel = 5;
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
        checkAnswer, checkPianoKey, moveNote, confirmPlacement, closeModal, onContinue, retryCurrent
    };
})();
