/* ============================================================================
   Gemeinsamer Kern für alle Module:
   Musiktheorie, Notensatz, Klaviatur und das Level-/Bewertungsgerüst.
   ========================================================================== */
const Core = (function () {

    /* ---------------------------------------------------------------- Töne */

    const LETTERS = ["c", "d", "e", "f", "g", "a", "b"];
    const LETTER_SEMITONE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
    const ACC_SEMITONE = { "bb": -2, "b": -1, "": 0, "#": 1, "##": 2 };
    const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

    // Deutsche Schreibweise: b = H, bb = B
    const GERMAN_NAMES = {
        "c": "C", "c#": "Cis", "cb": "Ces",
        "d": "D", "d#": "Dis", "db": "Des",
        "e": "E", "e#": "Eis", "eb": "Es",
        "f": "F", "f#": "Fis", "fb": "Fes",
        "g": "G", "g#": "Gis", "gb": "Ges",
        "a": "A", "a#": "Ais", "ab": "As",
        "b": "H", "b#": "His", "bb": "B"
    };

    /* Notennamen, die als Antwort-Buttons angeboten werden. Aufgaben dürfen nur
       Töne verlangen, die hier vorkommen — Schreibweisen wie Ces oder Heses
       gehören nicht in den Schulunterricht und wären auch nicht anklickbar. */
    const NOTE_BUTTONS = ["C", "Cis", "Des", "D", "Dis", "Es", "E", "F", "Fis",
                          "Ges", "G", "Gis", "As", "A", "Ais", "B", "H"];

    function noteName(key) { return key.split("/")[0]; }

    function parseKey(key) {
        const parts = key.split("/");
        return { letter: parts[0][0], acc: parts[0].slice(1), octave: parseInt(parts[1], 10) };
    }

    function midi(key) {
        const p = parseKey(key);
        return (p.octave + 1) * 12 + LETTER_SEMITONE[p.letter] + ACC_SEMITONE[p.acc];
    }

    function german(key) {
        const n = noteName(key);
        return GERMAN_NAMES[n] || n.toUpperCase();
    }

    // Ist der Ton mit einem der Antwort-Buttons benennbar?
    function isUsable(key) {
        return !!key && NOTE_BUTTONS.indexOf(german(key)) !== -1;
    }

    // Notenname für eine gegebene Tonhöhe, aber mit vorgeschriebenem Stammton.
    // So entsteht die musikalisch korrekte Schreibweise (fis statt ges usw.).
    function keyForPitch(letter, octave, targetPitch) {
        const natural = (octave + 1) * 12 + LETTER_SEMITONE[letter];
        const diff = targetPitch - natural;
        let acc = null;
        for (const a in ACC_SEMITONE) {
            if (ACC_SEMITONE[a] === diff) { acc = a; break; }
        }
        if (acc === null) return null;
        return letter + acc + "/" + octave;
    }

    /* ----------------------------------------------------------- Tonleitern */

    // Halbtonschritte. Moll ist harmonisch (erhöhte 7. Stufe → 1½ Töne davor).
    const SCALE_STEPS = {
        dur:  [2, 2, 1, 2, 2, 2, 1],
        moll: [2, 1, 2, 2, 1, 3, 1]
    };

    const STEP_LABELS = { 1: "Halbton", 2: "Ganzton", 3: "1½ Töne" };

    function scaleSteps(type) { return SCALE_STEPS[type].slice(); }

    function buildScale(rootKey, type) {
        const root = parseKey(rootKey);
        const notes = [rootKey];
        let letterIdx = LETTERS.indexOf(root.letter);
        let octave = root.octave;
        let pitch = midi(rootKey);
        SCALE_STEPS[type].forEach(function (step) {
            pitch += step;
            letterIdx++;
            if (letterIdx >= 7) { letterIdx -= 7; octave++; }
            notes.push(keyForPitch(LETTERS[letterIdx], octave, pitch));
        });
        return notes;
    }

    /* ---------------------------------------------------------- Dreiklänge */

    const TRIAD_STEPS = { dur: [4, 3], moll: [3, 4] };

    function buildTriad(rootKey, type) {
        const root = parseKey(rootKey);
        const notes = [rootKey];
        let letterIdx = LETTERS.indexOf(root.letter);
        let octave = root.octave;
        let pitch = midi(rootKey);
        TRIAD_STEPS[type].forEach(function (step) {
            pitch += step;
            letterIdx += 2;                       // Terz = zwei Stammtöne weiter
            if (letterIdx >= 7) { letterIdx -= 7; octave++; }
            notes.push(keyForPitch(LETTERS[letterIdx], octave, pitch));
        });
        return notes;
    }

    /* ----------------------------------------------------------- Intervalle */

    const INTERVAL_NAMES = ["Prime", "Sekunde", "Terz", "Quarte", "Quinte", "Sexte", "Septime", "Oktave"];
    const INTERVAL_QUALITY = {
        1: { 0: "reine" },
        2: { 1: "kleine", 2: "große" },
        3: { 3: "kleine", 4: "große" },
        4: { 5: "reine" },
        5: { 7: "reine" },
        6: { 8: "kleine", 9: "große" },
        7: { 10: "kleine", 11: "große" },
        8: { 12: "reine" }
    };

    function intervalInfo(lowKey, highKey) {
        const a = parseKey(lowKey), b = parseKey(highKey);
        const steps = (LETTERS.indexOf(b.letter) + 7 * b.octave) - (LETTERS.indexOf(a.letter) + 7 * a.octave);
        const number = steps + 1;
        const semitones = midi(highKey) - midi(lowKey);
        const quality = (INTERVAL_QUALITY[number] || {})[semitones] || "";
        const name = INTERVAL_NAMES[number - 1] || ("Intervall " + number);
        return {
            number: number,
            semitones: semitones,
            name: name,
            quality: quality,
            full: quality ? quality + " " + name : name
        };
    }

    // Zweiter Ton eines Intervalls über einem Grundton, mit korrektem Stammton.
    function noteAbove(rootKey, number, semitones) {
        const root = parseKey(rootKey);
        let letterIdx = LETTERS.indexOf(root.letter) + (number - 1);
        let octave = root.octave;
        while (letterIdx >= 7) { letterIdx -= 7; octave++; }
        return keyForPitch(LETTERS[letterIdx], octave, midi(rootKey) + semitones);
    }

    /* ------------------------------------------------------------- Audio-Synthesizer */

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    let isMuted = false;
    try {
        isMuted = localStorage.getItem("musik_trainer_muted") === "true";
    } catch (e) {}

    function getAudioCtx() {
        if (!audioCtx && AudioContext) {
            audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function midiToFreq(m) {
        return 440 * Math.pow(2, (m - 69) / 12);
    }

    function playTone(freq, durationSec, type) {
        if (isMuted || !freq) return;
        try {
            const ctx = getAudioCtx();
            if (!ctx) return;
            const dur = durationSec || 0.6;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type || "triangle";
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(0.28, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + dur);
        } catch (e) {
            console.warn("Audio error:", e);
        }
    }

    function playNote(key, durationSec) {
        if (isMuted || !key) return;
        try {
            const m = midi(key);
            playTone(midiToFreq(m), durationSec || 0.7, "triangle");
        } catch (e) {}
    }

    function playMidi(m, durationSec) {
        if (isMuted) return;
        playTone(midiToFreq(m), durationSec || 0.7, "triangle");
    }

    // Keine störenden Signaltöne bei Richtig/Falsch im Unterricht
    function playSuccess() {}
    function playError() {}

    // Mehrstimmiges Abspielen eines Akkords (z.B. Dreiklang oder Intervall)
    function playChord(keys, durationSec) {
        if (isMuted || !keys || !keys.length) return;
        keys.forEach(function (k) {
            playNote(k, durationSec || 1.2);
        });
    }

    // Melodisches Abspielen einer Tonfolge nacheinander (z.B. Tonleiter)
    function playMelody(keys, delayMs, durationSec) {
        if (isMuted || !keys || !keys.length) return;
        const delay = delayMs || 260;
        const dur = durationSec || 0.45;
        keys.forEach(function (k, i) {
            setTimeout(function () {
                playNote(k, dur);
            }, i * delay);
        });
    }

    function toggleMute() {
        isMuted = !isMuted;
        try {
            localStorage.setItem("musik_trainer_muted", isMuted ? "true" : "false");
        } catch (e) {}
        updateAllSoundButtons();
        return isMuted;
    }

    function updateAllSoundButtons() {
        document.querySelectorAll(".js-sound-toggle").forEach(function (btn) {
            btn.textContent = isMuted ? "🔇" : "🔊";
            btn.title = isMuted ? "Ton einschalten" : "Ton stummschalten";
            btn.setAttribute("aria-label", isMuted ? "Ton einschalten" : "Ton stummschalten");
            btn.classList.toggle("muted", isMuted);
        });
    }

    const sound = {
        playTone: playTone,
        playNote: playNote,
        playMidi: playMidi,
        playChord: playChord,
        playMelody: playMelody,
        playSuccess: playSuccess,
        playError: playError,
        toggleMute: toggleMute,
        isMuted: function () { return isMuted; },
        updateButtons: updateAllSoundButtons
    };

    /* ------------------------------------------------------------ Notensatz */

    function vexFlow() {
        if (typeof Vex !== "undefined" && Vex.Flow) return Vex.Flow;
        if (typeof VexFlow !== "undefined") return VexFlow;
        return null;
    }

    function whenVexReady(callback, errorEl) {
        let attempts = 0;
        const check = setInterval(function () {
            attempts++;
            if (vexFlow() || attempts > 30) {
                clearInterval(check);
                if (!vexFlow() && errorEl) {
                    errorEl.style.display = "block";
                    errorEl.innerText = "Bibliothek konnte nicht geladen werden (Timeout).";
                }
                callback();
            }
        }, 100);
    }

    /* Zeichnet ein Notensystem.
       notes:  Array von Tonhöhen oder Notenobjekten {key, duration, dot, rest, color}.
               Bei chord:true klingen sie gleichzeitig, sonst stehen sie nacheinander.
       colors: optionale Farbe je Position. */
    function renderStaff(el, options) {
        const VF = vexFlow();
        if (!el) return;
        const o = Object.assign({
            notes: [], chord: false, colors: [], width: 700, height: 180,
            scale: 1.3, staveWidth: 500, staveY: 9, staveX: 16, clef: "treble",
            timeSignature: null
        }, options || {});
        el.innerHTML = "";
        if (!VF) return;
        try {
            const renderer = new VF.Renderer(el, VF.Renderer.Backends.SVG);
            renderer.resize(o.width, o.height);
            const ctx = renderer.getContext();
            ctx.scale(o.scale, o.scale);

            const stave = new VF.Stave(o.staveX !== undefined ? o.staveX : 16, o.staveY, o.staveWidth);
            stave.setBegBarType(VF.Barline.type.SINGLE);
            stave.setEndBarType(VF.Barline.type.DOUBLE);
            stave.addClef(o.clef).setContext(ctx);
            if (o.timeSignature) {
                stave.addTimeSignature(o.timeSignature);
            }
            stave.draw();

            if (!o.notes.length) return;

            let staveNotes = [];
            if (o.chord) {
                const keys = o.notes.map(function(n) { return typeof n === "string" ? n : n.key; });
                const sn = new VF.StaveNote({ keys: keys, duration: o.duration || "q" });
                keys.forEach(function (k, j) {
                    const acc = noteName(k).slice(1);
                    if (acc) sn.addAccidental(j, new VF.Accidental(acc));
                });
                const highest = Math.max.apply(null, keys.map(midi));
                sn.setStemDirection(highest >= midi("b/4") ? -1 : 1);
                if (o.colors && o.colors.length) {
                    sn.setStyle({ fillStyle: o.colors[0], strokeStyle: o.colors[0] });
                }
                staveNotes.push(sn);
            } else {
                staveNotes = o.notes.map(function (item, i) {
                    let noteObj;
                    if (typeof item === "string") {
                        noteObj = { keys: [item], duration: o.duration || "q", color: (o.colors && o.colors[i]) || null };
                    } else if (item && item.keys) {
                        noteObj = Object.assign({ duration: "q" }, item);
                    } else if (item && item.key) {
                        noteObj = Object.assign({ keys: [item.key], duration: item.duration || "q" }, item);
                    } else if (item && item.rest) {
                        const dur = (item.duration || "q") + (item.duration && String(item.duration).endsWith("r") ? "" : "r");
                        noteObj = Object.assign({ keys: ["b/4"], duration: dur }, item);
                    } else {
                        noteObj = item;
                    }

                    const sn = new VF.StaveNote({
                        keys: noteObj.keys || ["b/4"],
                        duration: noteObj.duration || "q"
                    });

                    if (noteObj.dot) {
                        sn.addDotToAll();
                    }

                    const durStr = String(noteObj.duration || "");
                    if (!durStr.includes("r")) {
                        noteObj.keys.forEach(function (k, j) {
                            const acc = noteName(k).slice(1);
                            if (acc) sn.addAccidental(j, new VF.Accidental(acc));
                        });
                        const highest = Math.max.apply(null, noteObj.keys.map(midi));
                        sn.setStemDirection(highest >= midi("b/4") ? -1 : 1);
                    }

                    const col = noteObj.color || (o.colors && o.colors[i]);
                    if (col) {
                        sn.setStyle({ fillStyle: col, strokeStyle: col });
                    }
                    return sn;
                });
            }

            if (staveNotes.length > 0) {
                const voice = new VF.Voice({ num_beats: staveNotes.length, beat_value: 4 });
                voice.setStrict(false);
                voice.addTickables(staveNotes);

                if (staveNotes.length === 1 || o.chord) {
                    new VF.Formatter().joinVoices([voice]).format([voice], o.staveWidth - 75);
                    // Exakt in der horizontalen Mitte des Feldes mit den Notenlinien
                    const staveMid = stave.getX() + (o.staveWidth / 2);
                    stave.setNoteStartX(Math.round(staveMid - 18));
                } else if (staveNotes.length === 2) {
                    // Kompakte Noten nebeneinander in der Mitte des Notensystems (z.B. Intervalle)
                    const noteSpacing = 75;
                    new VF.Formatter().joinVoices([voice]).format([voice], noteSpacing);
                    const staveMid = stave.getX() + (o.staveWidth / 2);
                    stave.setNoteStartX(Math.round(staveMid - (noteSpacing / 2) - 16));
                } else if (staveNotes.length === 3 || staveNotes.length === 4) {
                    // Dreiklänge / Vierklänge
                    const noteSpacing = (staveNotes.length - 1) * 60;
                    new VF.Formatter().joinVoices([voice]).format([voice], noteSpacing);
                    const staveMid = stave.getX() + (o.staveWidth / 2);
                    stave.setNoteStartX(Math.round(staveMid - (noteSpacing / 2) - 16));
                } else {
                    new VF.Formatter().joinVoices([voice]).format([voice], o.staveWidth - 80);
                }

                voice.draw(ctx, stave);
            }
        } catch (err) {
            console.error("VexFlow Draw Error:", err);
        }
    }

    /* ------------------------------------------------------------ Klaviatur */

    function buildKeyboard(el, fromKey, toKey, onKey, options) {
        const o = Object.assign({ labels: false }, options || {});
        const from = midi(fromKey), to = midi(toKey);
        el.innerHTML = "";
        for (let m = from; m <= to; m++) {
            const isBlack = WHITE_SEMITONES.indexOf(m % 12) === -1;
            const key = document.createElement("div");
            key.className = "piano-key" + (isBlack ? " black" : "");
            key.dataset.midi = String(m);
            if (o.labels && !isBlack) {
                const idx = WHITE_SEMITONES.indexOf(m % 12);
                key.textContent = ["C", "D", "E", "F", "G", "A", "H"][idx];
            }
            // Touch- & Click-Unterstützung für iPad
            key.addEventListener("pointerdown", function (e) {
                playMidi(m);
                if (onKey) onKey(m, key);
            });
            el.appendChild(key);
        }
    }

    function keyElement(el, m) {
        return el.querySelector('.piano-key[data-midi="' + m + '"]');
    }

    /* Eingefärbte Taste: die Beschriftung muss auf der Farbe lesbar bleiben. */
    function paintKey(el, color, onRemove) {
        if (!el) return;
        el.style.background = color;
        el.style.color = "#fff";

        const oldBadge = el.querySelector(".key-remove-btn");
        if (oldBadge) oldBadge.remove();

        if (onRemove) {
            const badge = document.createElement("div");
            badge.className = "key-remove-btn";
            badge.innerHTML = "✕";
            badge.title = "Auswahl aufheben";
            badge.addEventListener("pointerdown", function (e) {
                e.stopPropagation();
                e.preventDefault();
                onRemove();
            });
            el.appendChild(badge);
        }
    }

    function resetKeys(el) {
        if (!el) return;
        el.querySelectorAll(".piano-key").forEach(function (k) {
            k.style.background = "";
            k.style.color = "";
            const b = k.querySelector(".key-remove-btn");
            if (b) b.remove();
        });
    }

    /* ------------------------------------------------- Level- und Punktegerüst */

    const PASSWORD = "Musikunterricht";

    function createModule(cfg) {
        const root = document.getElementById("module-" + cfg.id);
        const totalRounds = cfg.rounds || 20;
        const levels = cfg.levels;

        let levelIndex = 0;
        let maxUnlocked = 0;
        let score = 0;
        let roundCount = 0;
        let roundFailed = false;
        let roundDone = false;      // gelöst, wartet auf "Weiter"
        let started = false;
        let el = {};

        buildDom();

        function buildDom() {
            root.innerHTML =
                '<div class="exercise-card">' +
                    '<div class="lvl-bar">' +
                        '<button class="exit-btn js-menu" title="Zum Menü">✕</button>' +
                        '<div class="lvl-btns js-levels"></div>' +
                    '</div>' +
                    '<div class="fokus-header">' +
                        '<div class="progress-container">' +
                            '<div class="progress-wrap"><div class="progress-bar js-progress-bar"></div></div>' +
                            '<div class="round-counter js-round">Runde: 1 / ' + totalRounds + '</div>' +
                        '</div>' +
                        '<div class="star-badge"><span class="star-icon">★</span><b class="js-score">0</b></div>' +
                    '</div>' +
                    '<div class="module-stage">' +
                        '<div class="staff-box js-staff"></div>' +
                        '<div class="error-note js-error">Fehler beim Laden der Notengrafik. Bitte Seite neu laden.</div>' +
                        '<div class="task-box">' +
                            '<div class="hint-box js-hint" style="display: none; margin-bottom: 8px;"></div>' +
                            '<div class="task-text js-task"></div>' +
                        '</div>' +
                        '<div class="interactive-area">' +
                            '<div class="js-answers"></div>' +
                            '<div class="piano-container wide js-keyboard"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="bottom-action-bar">' +
                        '<button class="confirm-btn js-confirm-btn" style="display: none;">Bestätigen</button>' +
                        '<button class="continue-btn js-continue-btn" disabled>Weiter →</button>' +
                    '</div>' +
                '</div>' +
                modalMarkup();

            el = {
                score:            root.querySelector(".js-score"),
                levels:           root.querySelector(".js-levels"),
                progress:         root.querySelector(".js-progress-bar"),
                staff:            root.querySelector(".js-staff"),
                error:            root.querySelector(".js-error"),
                task:             root.querySelector(".js-task"),
                hint:             root.querySelector(".js-hint"),
                drawer:           root.querySelector(".js-feedback-drawer"),
                icon:             root.querySelector(".js-feedback-icon"),
                feedback:         root.querySelector(".js-feedback"),
                fModal:           root.querySelector(".js-feedback-modal"),
                fIcon:            root.querySelector(".js-f-icon"),
                fTitle:           root.querySelector(".js-f-title"),
                fText:            root.querySelector(".js-f-text"),
                fBtn:             root.querySelector(".js-f-btn"),
                round:            root.querySelector(".js-round"),
                answers:          root.querySelector(".js-answers"),
                contBtn:          root.querySelector(".js-continue-btn"),
                confirmContainer: root.querySelector(".js-confirm-container"),
                confirmBtn:       root.querySelector(".js-confirm-btn"),
                keyboard:         root.querySelector(".js-keyboard"),
                result:           root.querySelector(".js-result-modal"),
                lock:             root.querySelector(".js-lock-modal"),
                unlock:           root.querySelector(".js-unlock-modal")
            };

            root.querySelector(".js-menu").addEventListener("click", function () { backToMenu(); });
            const soundBtn = root.querySelector(".js-sound-toggle");
            if (soundBtn) soundBtn.addEventListener("click", function () { sound.toggleMute(); });
            if (el.contBtn) {
                el.contBtn.addEventListener("click", function () {
                    if (el.contBtn.disabled) return;
                    if (customContinueHandler) {
                        customContinueHandler();
                    } else if (roundDone) {
                        nextRound();
                    } else if (el.contBtn.textContent.includes("versuchen") || roundFailed) {
                        retryCurrentRound();
                    }
                });
            }
            buildLevelButtons();
            wireModals();
        }

        function modalMarkup() {
            return '' +
            '<div class="modal js-feedback-modal" style="display:none"><div class="modal-content feedback-modal-content">' +
                '<div class="feedback-modal-icon js-f-icon">✔</div>' +
                '<h3 class="js-f-title">Richtig!</h3>' +
                '<div class="js-f-text feedback-modal-text"></div>' +
                '<button class="modal-btn js-f-btn">Weiter →</button>' +
            '</div></div>' +
            '<div class="modal js-result-modal"><div class="modal-content">' +
                '<h3 class="js-result-title">Ergebnis</h3>' +
                '<div class="grade-badge js-result-grade">1</div>' +
                '<div class="result-stats js-result-stats"></div>' +
                '<div class="js-result-text" style="margin-bottom:1.5rem"></div>' +
                '<button class="modal-btn js-result-ok">Weiter</button>' +
            '</div></div>' +
            '<div class="modal js-lock-modal"><div class="modal-content">' +
                '<h3 style="color:#e5484d">Level gesperrt!</h3>' +
                '<div class="result-stats">Noch nicht freigeschaltet</div>' +
                '<div style="margin-bottom:1.5rem">Du musst erst das vorherige Level mit mindestens ' +
                    '<b>Note 3</b> bestehen, um hier fortzufahren.</div>' +
                '<button class="modal-btn js-lock-ok">Verstanden</button>' +
            '</div></div>' +
            '<div class="modal js-unlock-modal"><div class="modal-content">' +
                '<h3 class="js-unlock-title" style="color:#eab308">Freischaltung</h3>' +
                '<div class="js-unlock-icon"></div>' +
                '<p class="js-unlock-text">Gib das Passwort ein:</p>' +
                '<div class="js-unlock-input-wrap">' +
                    '<input type="text" class="unlock-input js-unlock-input" ' +
                        'autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">' +
                '</div>' +
                '<div class="js-unlock-actions" style="display:flex;gap:10px">' +
                    '<button class="modal-btn js-unlock-cancel" style="background:#98a2b3">Abbrechen</button>' +
                    '<button class="modal-btn js-unlock-ok" style="background:#eab308;color:#000">OK</button>' +
                '</div>' +
                '<button class="modal-btn js-unlock-close" style="display:none">Verstanden</button>' +
            '</div></div>';
        }

        function wireModals() {
            root.querySelector(".js-result-ok").addEventListener("click", closeResult);
            root.querySelector(".js-lock-ok").addEventListener("click", function () {
                el.lock.style.display = "none";
            });
            root.querySelector(".js-unlock-cancel").addEventListener("click", function () {
                el.unlock.style.display = "none";
            });
            root.querySelector(".js-unlock-close").addEventListener("click", function () {
                el.unlock.style.display = "none";
            });
            root.querySelector(".js-unlock-ok").addEventListener("click", checkPassword);
            root.querySelector(".js-unlock-input").addEventListener("keyup", function (e) {
                if (e.key === "Enter") checkPassword();
            });
        }

        function buildLevelButtons() {
            if (!el.levels) return;
            el.levels.innerHTML = "";
            levels.forEach(function (lv, i) {
                const b = document.createElement("button");
                b.textContent = "Level " + (i + 1);
                b.title = lv.label || "";
                b.addEventListener("click", function () { setLevel(i); });
                el.levels.appendChild(b);
            });
            const unlockBtn = document.createElement("button");
            unlockBtn.textContent = "Freischalten";
            unlockBtn.className = "unlock-btn";
            unlockBtn.title = "Alle Level freischalten";
            unlockBtn.addEventListener("click", openUnlock);
            el.levels.appendChild(unlockBtn);
        }

        function refreshLevelButtons() {
            if (!el.levels) return;
            const btns = el.levels.querySelectorAll("button");
            levels.forEach(function (lv, i) {
                const b = btns[i];
                if (!b) return;
                const isLocked = i > maxUnlocked;
                b.className = isLocked ? "lvl-locked" : (i === levelIndex ? "active" : "");
                b.style.background = "";
                b.style.color = "";
            });
        }

        /* ------------------------------------------------ Aufgaben-Schnittstelle */

        const ctx = {
            task: function (html) { el.task.innerHTML = html || ""; },

            hint: function (html) {
                if (el.hint) {
                    if (html) {
                        el.hint.innerHTML = html;
                        el.hint.style.display = "block";
                    } else {
                        el.hint.innerHTML = "";
                        el.hint.style.display = "none";
                    }
                }
            },

            staff: function (notes, options) {
                el.staff.style.display = "block";
                renderStaff(el.staff, Object.assign({ notes: notes || [] }, options || {}));
            },

            hideStaff: function () { el.staff.style.display = "none"; el.staff.innerHTML = ""; },

            keyboard: function (fromKey, toKey, onKey, options) {
                if (!fromKey) { el.keyboard.style.display = "none"; el.keyboard.innerHTML = ""; return; }
                el.keyboard.style.display = "flex";
                const guarded = onKey && function (m, keyEl) {
                    if (roundDone) return;          // gelöste Runde nicht mehr verändern
                    lastClickedKey = keyEl;
                    onKey(m, keyEl);
                };
                buildKeyboard(el.keyboard, fromKey, toKey, guarded, options);
            },

            keyEl: function (m) { return keyElement(el.keyboard, m); },
            paintKey: paintKey,
            resetKeys: function () { resetKeys(el.keyboard); },

            answers: function (list, onClick) {
                el.answers.innerHTML = "";
                lastClickedBtn = null;
                if (!list || !list.length) return;
                const grid = document.createElement("div");
                grid.className = "answer-grid";
                if (list.length > 8) grid.classList.add("dense");
                list.forEach(function (item) {
                    const b = document.createElement("button");
                    b.className = "answer-btn";
                    b.textContent = item.label !== undefined ? item.label : item;
                    if (item.color) b.style.background = item.color;
                    b.addEventListener("click", function () {
                        if (roundDone) return;
                        lastClickedBtn = b;
                        onClick(item.value !== undefined ? item.value : item, b);
                    });
                    grid.appendChild(b);
                });
                el.answers.appendChild(grid);
            },

            clearAnswers: function () {
                el.answers.innerHTML = "";
                lastClickedBtn = null;
            },

            feedback: function (text, color) {
                el.feedback.innerHTML = text || "";
                el.feedback.style.color = color || "#333";
            },

            /* Direktes Feedback: Taste/Button färben + Weiter-Button enablen */
            solved: function (message) {
                if (lastClickedBtn) {
                    lastClickedBtn.classList.remove("wrong");
                    lastClickedBtn.classList.add("correct");
                }
                if (lastClickedKey) {
                    paintKey(lastClickedKey, "#16a34a");
                }
                if (!roundFailed) {
                    score++;
                    el.score.innerText = score;
                }
                roundCount++;
                roundDone = true;
                if (el.progress) {
                    el.progress.style.width = Math.min(100, Math.round((roundCount) / totalRounds * 100)) + "%";
                }
                if (el.round) {
                    el.round.innerText = "Runde: " + Math.min(roundCount + 1, totalRounds) + " / " + totalRounds;
                }
                if (el.contBtn) {
                    el.contBtn.disabled = false;
                    el.contBtn.textContent = (roundCount >= totalRounds ? "Ergebnis →" : "Weiter →");
                    el.contBtn.focus();
                }
            },

            failed: function (message) {
                if (lastClickedBtn) {
                    lastClickedBtn.classList.add("wrong");
                }
                if (lastClickedKey) {
                    paintKey(lastClickedKey, "#ef4444");
                }
                roundFailed = true;
                roundDone = false;
                if (el.contBtn) {
                    el.contBtn.disabled = false;
                    el.contBtn.textContent = "Erneut versuchen ↺";
                    el.contBtn.focus();
                }
            },

            playNote: function (key, dur) { sound.playNote(key, dur); },
            playMidi: function (m, dur) { sound.playMidi(m, dur); },
            playTone: function (freq, dur, type) { sound.playTone(freq, dur, type); },
            playChord: function (keys, dur) { sound.playChord(keys, dur); },
            playMelody: function (keys, delay, dur) { sound.playMelody(keys, delay, dur); },
            sound: sound,

            onContinue: function (fn) { customContinueHandler = fn; },
            enableContinue: function (text) {
                if (el.contBtn) {
                    el.contBtn.disabled = false;
                    if (text) el.contBtn.textContent = text;
                    el.contBtn.focus();
                }
            },
            disableContinue: function (text) {
                if (el.contBtn) {
                    el.contBtn.disabled = true;
                    if (text) el.contBtn.textContent = text;
                }
            },

            showConfirm: function (onConfirm, text) {
                if (el.confirmBtn) {
                    el.confirmBtn.style.display = "inline-flex";
                    el.confirmBtn.textContent = text || "Bestätigen";
                    el.confirmBtn.onclick = onConfirm || null;
                    el.confirmBtn.disabled = false;
                }
            },
            enableConfirm: function (enabled) {
                if (el.confirmBtn) {
                    el.confirmBtn.disabled = !enabled;
                }
            },
            hideConfirm: function () {
                if (el.confirmBtn) {
                    el.confirmBtn.style.display = "none";
                    el.confirmBtn.onclick = null;
                }
            },

            german: german,
            midi: midi
        };

        /* ------------------------------------------------------------ Ablauf */

        let lastClickedBtn = null;
        let lastClickedKey = null;
        let customContinueHandler = null;

        function retryCurrentRound() {
            roundFailed = false;
            lastClickedBtn = null;
            lastClickedKey = null;
            if (el.answers) {
                el.answers.querySelectorAll(".answer-btn").forEach(function (b) {
                    b.classList.remove("wrong", "correct");
                });
            }
            if (el.keyboard) {
                resetKeys(el.keyboard);
            }
            if (el.contBtn) {
                el.contBtn.disabled = true;
                el.contBtn.textContent = "Weiter →";
            }
            if (levels[levelIndex] && levels[levelIndex].onRetry) {
                levels[levelIndex].onRetry(ctx);
            }
        }

        function nextRound() {
            if (el.fModal) el.fModal.style.display = "none";
            roundDone = false;
            customContinueHandler = null;
            if (el.contBtn) {
                el.contBtn.disabled = true;
                el.contBtn.textContent = (roundCount + 1 >= totalRounds ? "Ergebnis →" : "Weiter →");
            }
            if (roundCount >= totalRounds) { showResult(); return; }
            roundFailed = false;
            ctx.clearAnswers();
            ctx.hint("");
            ctx.keyboard(false);
            if (el.progress) {
                el.progress.style.width = Math.min(100, Math.round((roundCount) / totalRounds * 100)) + "%";
            }
            if (el.round) {
                el.round.innerText = "Runde: " + (roundCount + 1) + " / " + totalRounds;
            }
            levels[levelIndex].start(ctx);
        }

        function setLevel(index) {
            if (index > maxUnlocked) { el.lock.style.display = "flex"; return; }
            levelIndex = index;
            // Aufgabenbeutel des Levels frisch fuellen
            if (typeof levels[index].reset === "function") levels[index].reset();
            score = 0;
            roundCount = 0;
            el.score.innerText = "0";
            if (el.progress) el.progress.style.width = "0%";
            refreshLevelButtons();
            nextRound();
        }

        function showResult() {
            const percentage = (score / totalRounds) * 100;
            let grade = 6;
            if (percentage >= 92) grade = 1;
            else if (percentage >= 80) grade = 2;
            else if (percentage >= 65) grade = 3;
            else if (percentage >= 50) grade = 4;
            else if (percentage >= 20) grade = 5;

            const passed = grade <= 3;
            const isLast = levelIndex >= levels.length - 1;

            root.querySelector(".js-result-grade").innerText = grade;
            root.querySelector(".js-result-grade").style.color = passed ? "#12b76a" : "#e5484d";
            root.querySelector(".js-result-stats").innerText =
                score + " / " + totalRounds + " (" + Math.round(percentage) + "%)";
            root.querySelector(".js-result-title").innerText =
                passed ? "Level geschafft!" : "Nicht bestanden";

            if (passed && !isLast) {
                if (maxUnlocked < levelIndex + 1) maxUnlocked = levelIndex + 1;
                root.querySelector(".js-result-text").innerText =
                    "Hervorragend! Level " + (levelIndex + 2) + " ist nun freigeschaltet.";
                el.result.dataset.next = "next";
            } else if (passed) {
                root.querySelector(".js-result-text").innerText =
                    "Ultimativ! Du hast alle Level dieses Moduls gemeistert.";
                el.result.dataset.next = "repeat";
            } else {
                root.querySelector(".js-result-text").innerText =
                    "Wiederhole das Level für eine bessere Note (mindestens Note 3).";
                el.result.dataset.next = "repeat";
            }
            el.result.style.display = "flex";
        }

        function closeResult() {
            el.result.style.display = "none";
            const action = el.result.dataset.next;
            setLevel(action === "next" ? levelIndex + 1 : levelIndex);
        }

        /* ------------------------------------------------------ Freischaltung */

        function openUnlock() {
            root.querySelector(".js-unlock-title").innerText = "Freischaltung";
            root.querySelector(".js-unlock-title").style.color = "#eab308";
            root.querySelector(".js-unlock-icon").innerText = "";
            root.querySelector(".js-unlock-text").innerText = "Gib das Passwort ein:";
            root.querySelector(".js-unlock-input-wrap").style.display = "block";
            root.querySelector(".js-unlock-actions").style.display = "flex";
            root.querySelector(".js-unlock-close").style.display = "none";
            root.querySelector(".js-unlock-input").value = "";
            el.unlock.style.display = "flex";
            setTimeout(function () { root.querySelector(".js-unlock-input").focus(); }, 100);
        }

        function checkPassword() {
            const input = root.querySelector(".js-unlock-input");
            if (input.value === PASSWORD) {
                maxUnlocked = levels.length - 1;
                refreshLevelButtons();
                el.unlock.style.display = "none";
            } else {
                root.querySelector(".js-unlock-title").innerText = "Falsches Passwort!";
                root.querySelector(".js-unlock-title").style.color = "#e5484d";
                root.querySelector(".js-unlock-icon").innerText = "";
                root.querySelector(".js-unlock-text").innerText = "Bitte versuche es erneut.";
                input.value = "";
                input.focus();
            }
        }

        /* -------------------------------------------------------- Modul-API */

        return {
            open: function () {
                if (!started) {
                    started = true;
                    whenVexReady(function () { setLevel(0); }, el.error);
                } else {
                    setLevel(levelIndex);
                }
            },
            suspend: function () {}
        };
    }

    /* ------------------------------------------------------------ Zufall */

    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

    function mischen(list) {
        const a = list.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    /* Zieht ohne Zurücklegen: erst wenn jeder Eintrag einmal an der Reihe war,
       wird neu gemischt. Reiner Zufall würde in einem Level manche Tonarten
       mehrfach bringen und andere gar nicht.
       merkmal bestimmt, was als gleiche Aufgabe gilt (etwa der Notenname
       unabhängig von der Oktave). */
    function createBag(list, merkmal) {
        const kennung = merkmal || function (x) { return x; };

        // Einträge gleicher Kennung bilden eine Gruppe. Gezogen wird die
        // Gruppe; welcher Vertreter daraus kommt (etwa dieselbe Tonart in
        // einer anderen Oktave), entscheidet der Zufall.
        const gruppen = {};
        const schluessel = [];
        list.forEach(function (x) {
            const k = kennung(x);
            if (!gruppen[k]) { gruppen[k] = []; schluessel.push(k); }
            gruppen[k].push(x);
        });

        let rest = [];
        let zuletzt = null;

        function nachfuellen() {
            rest = mischen(schluessel);
            // Kein direkter Anschluss an die zuletzt gezogene Gruppe
            if (zuletzt !== null && rest.length > 1 && rest[0] === zuletzt) {
                rest.push(rest.shift());
            }
        }

        return {
            next: function () {
                if (!rest.length) nachfuellen();
                const k = rest.shift();
                zuletzt = k;
                return pick(gruppen[k]);
            },
            neu: function () { rest = []; zuletzt = null; }
        };
    }

    /* Wählt aus list und vermeidet dabei die zuletzt gezogenen Einträge.
       Bei kurzen Listen wird weniger gesperrt, sonst bliebe rechnerisch nur
       noch ein Kandidat übrig und die Reihenfolge wäre vorhersehbar.
       merkmal bestimmt, was als "schon dagewesen" gilt — bei Grundtönen in
       mehreren Oktaven soll der Notenname zählen, nicht die Lage. */
    function pickFresh(list, recent, memory, merkmal) {
        const kennung = merkmal || function (x) { return x; };
        const verschieden = new Set(list.map(kennung)).size;
        const limit = Math.max(1, Math.min(memory || 3, verschieden - 2));
        const fresh = list.filter(function (x) { return recent.indexOf(kennung(x)) === -1; });
        const chosen = pick(fresh.length ? fresh : list);
        recent.push(kennung(chosen));
        while (recent.length > limit) recent.shift();
        return chosen;
    }

    function midiToKey(m) {
        const octave = Math.floor(m / 12) - 1;
        const semitone = m % 12;
        const pitchMap = {
            0: "c", 1: "c#", 2: "d", 3: "eb", 4: "e", 5: "f",
            6: "f#", 7: "g", 8: "ab", 9: "a", 10: "bb", 11: "b"
        };
        return (pitchMap[semitone] || "c") + "/" + octave;
    }

    return {
        LETTERS: LETTERS,
        GERMAN_NAMES: GERMAN_NAMES,
        NOTE_BUTTONS: NOTE_BUTTONS,
        isUsable: isUsable,
        STEP_LABELS: STEP_LABELS,
        INTERVAL_NAMES: INTERVAL_NAMES,
        noteName: noteName,
        parseKey: parseKey,
        midi: midi,
        midiToKey: midiToKey,
        german: german,
        keyForPitch: keyForPitch,
        scaleSteps: scaleSteps,
        buildScale: buildScale,
        buildTriad: buildTriad,
        intervalInfo: intervalInfo,
        noteAbove: noteAbove,
        renderStaff: renderStaff,
        buildKeyboard: buildKeyboard,
        resetKeys: resetKeys,
        paintKey: paintKey,
        whenVexReady: whenVexReady,
        createModule: createModule,
        sound: sound,
        pick: pick,
        pickFresh: pickFresh,
        createBag: createBag,
        shuffle: mischen
    };
})();
