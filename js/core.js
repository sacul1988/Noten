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
       notes:  Array von Tonhöhen. Bei chord:true klingen sie gleichzeitig,
               sonst stehen sie nacheinander.
       colors: optionale Farbe je Position. */
    function renderStaff(el, options) {
        const VF = vexFlow();
        if (!el) return;
        // VexFlow reserviert oberhalb von staveY bereits Platz für Hilfslinien,
        // deshalb genügt hier ein kleiner Wert.
        const o = Object.assign({
            notes: [], chord: false, colors: [], width: 550, height: 215,
            scale: 1.6, staveWidth: 300, staveY: 5
        }, options || {});
        el.innerHTML = "";
        if (!VF) return;
        try {
            const renderer = new VF.Renderer(el, VF.Renderer.Backends.SVG);
            renderer.resize(o.width, o.height);
            const ctx = renderer.getContext();
            ctx.scale(o.scale, o.scale);

            const stave = new VF.Stave(10, o.staveY, o.staveWidth);
            stave.addClef("treble").setContext(ctx);
            stave.draw();

            if (!o.notes.length) return;

            const groups = o.chord ? [o.notes] : o.notes.map(function (n) { return [n]; });
            const staveNotes = groups.map(function (keys, i) {
                const sn = new VF.StaveNote({ keys: keys, duration: "q" });
                keys.forEach(function (k, j) {
                    const acc = noteName(k).slice(1);
                    if (acc) sn.addAccidental(j, new VF.Accidental(acc));
                });
                const highest = Math.max.apply(null, keys.map(midi));
                sn.setStemDirection(highest >= midi("b/4") ? -1 : 1);
                if (o.colors[i]) sn.setStyle({ fillStyle: o.colors[i], strokeStyle: o.colors[i] });
                return sn;
            });

            const voice = new VF.Voice({ num_beats: staveNotes.length, beat_value: 4 });
            voice.setStrict(false);
            voice.addTickables(staveNotes);
            new VF.Formatter().joinVoices([voice]).format([voice], o.staveWidth - 75);
            voice.draw(ctx, stave);
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
            if (onKey) {
                key.addEventListener("click", function () { onKey(m, key); });
            }
            el.appendChild(key);
        }
    }

    function keyElement(el, m) {
        return el.querySelector('.piano-key[data-midi="' + m + '"]');
    }

    function resetKeys(el) {
        if (!el) return;
        el.querySelectorAll(".piano-key").forEach(function (k) {
            k.style.background = k.classList.contains("black") ? "#333" : "white";
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
        let started = false;
        let el = {};

        buildDom();

        function buildDom() {
            root.innerHTML =
                '<div class="module-header">' +
                    '<button class="menu-btn js-menu">🏠 Menü</button>' +
                    '<h2>' + cfg.title + '</h2>' +
                    '<div class="header-spacer"></div>' +
                '</div>' +
                '<div class="score-board">Richtig: <span class="js-score">0</span>' +
                    '<div class="lvl-btns js-levels"></div>' +
                '</div>' +
                '<div class="staff-box js-staff"></div>' +
                '<div class="error-note js-error">Fehler beim Laden der Notengrafik. Bitte Seite neu laden.</div>' +
                '<div class="task-text js-task"></div>' +
                '<div class="hint-box js-hint"></div>' +
                '<div class="feedback-text js-feedback"></div>' +
                '<div class="round-info js-round"></div>' +
                '<div class="js-answers"></div>' +
                '<div class="piano-container wide js-keyboard"></div>' +
                modalMarkup();

            el = {
                score:    root.querySelector(".js-score"),
                levels:   root.querySelector(".js-levels"),
                staff:    root.querySelector(".js-staff"),
                error:    root.querySelector(".js-error"),
                task:     root.querySelector(".js-task"),
                hint:     root.querySelector(".js-hint"),
                feedback: root.querySelector(".js-feedback"),
                round:    root.querySelector(".js-round"),
                answers:  root.querySelector(".js-answers"),
                keyboard: root.querySelector(".js-keyboard"),
                result:   root.querySelector(".js-result-modal"),
                lock:     root.querySelector(".js-lock-modal"),
                unlock:   root.querySelector(".js-unlock-modal")
            };

            root.querySelector(".js-menu").addEventListener("click", function () { backToMenu(); });
            buildLevelButtons();
            wireModals();
        }

        function modalMarkup() {
            return '' +
            '<div class="modal js-result-modal"><div class="modal-content">' +
                '<h3 class="js-result-title">Ergebnis</h3>' +
                '<div class="grade-badge js-result-grade">1</div>' +
                '<div class="result-stats js-result-stats"></div>' +
                '<div class="js-result-text" style="margin-bottom:1.5rem"></div>' +
                '<button class="modal-btn js-result-ok">Weiter</button>' +
            '</div></div>' +
            '<div class="modal js-lock-modal"><div class="modal-content">' +
                '<h3 style="color:#e74c3c">Level gesperrt! 🔒</h3>' +
                '<div style="font-size:4rem;margin:1rem 0">🚫</div>' +
                '<div class="result-stats">Noch nicht freigeschaltet</div>' +
                '<div style="margin-bottom:1.5rem">Du musst erst das vorherige Level mit mindestens ' +
                    '<b>Note 3</b> bestehen, um hier fortzufahren.</div>' +
                '<button class="modal-btn js-lock-ok">Verstanden</button>' +
            '</div></div>' +
            '<div class="modal js-unlock-modal"><div class="modal-content">' +
                '<h3 class="js-unlock-title" style="color:#f1c40f">Freischaltung 🔑</h3>' +
                '<div class="js-unlock-icon" style="font-size:3rem;margin:0.5rem 0">👨‍🏫</div>' +
                '<p class="js-unlock-text">Gib das Passwort ein:</p>' +
                '<div class="js-unlock-input-wrap">' +
                    '<input type="password" class="unlock-input js-unlock-input">' +
                '</div>' +
                '<div class="js-unlock-actions" style="display:flex;gap:10px">' +
                    '<button class="modal-btn js-unlock-cancel" style="background:#95a5a6">Abbrechen</button>' +
                    '<button class="modal-btn js-unlock-ok" style="background:#f1c40f;color:#000">OK</button>' +
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
            el.levels.innerHTML = "";
            levels.forEach(function (lv, i) {
                const b = document.createElement("button");
                b.textContent = "Level " + (i + 1);
                b.title = lv.label || "";
                b.addEventListener("click", function () { setLevel(i); });
                el.levels.appendChild(b);
            });
            const unlockBtn = document.createElement("button");
            unlockBtn.textContent = "🔓";
            unlockBtn.className = "unlock-btn";
            unlockBtn.title = "Alle Level freischalten";
            unlockBtn.addEventListener("click", openUnlock);
            el.levels.appendChild(unlockBtn);
        }

        function refreshLevelButtons() {
            const btns = el.levels.querySelectorAll("button");
            levels.forEach(function (lv, i) {
                const b = btns[i];
                const isLocked = i > maxUnlocked;
                b.className = isLocked ? "lvl-locked" : "";
                b.style.background = (i === levelIndex) ? "#2ecc71" : (isLocked ? "#95a5a6" : "#4a90e2");
            });
        }

        /* ------------------------------------------------ Aufgaben-Schnittstelle */

        const ctx = {
            task: function (text) { el.task.innerText = text; },

            hint: function (html) {
                el.hint.innerHTML = html || "";
                el.hint.style.display = html ? "block" : "none";
            },

            staff: function (notes, options) {
                el.staff.style.display = "block";
                renderStaff(el.staff, Object.assign({ notes: notes || [] }, options || {}));
            },

            hideStaff: function () { el.staff.style.display = "none"; el.staff.innerHTML = ""; },

            keyboard: function (fromKey, toKey, onKey, options) {
                if (!fromKey) { el.keyboard.style.display = "none"; el.keyboard.innerHTML = ""; return; }
                el.keyboard.style.display = "flex";
                buildKeyboard(el.keyboard, fromKey, toKey, onKey, options);
            },

            keyEl: function (m) { return keyElement(el.keyboard, m); },
            resetKeys: function () { resetKeys(el.keyboard); },

            answers: function (list, onClick) {
                el.answers.innerHTML = "";
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
                        onClick(item.value !== undefined ? item.value : item, b);
                    });
                    grid.appendChild(b);
                });
                el.answers.appendChild(grid);
            },

            clearAnswers: function () { el.answers.innerHTML = ""; },

            feedback: function (text, color) {
                el.feedback.innerText = text || "";
                el.feedback.style.color = color || "#333";
            },

            solved: function (message) {
                ctx.feedback(message || "Korrekt! 🌟", "#2ecc71");
                if (!roundFailed) {
                    score++;
                    el.score.innerText = score;
                }
                roundCount++;
                setTimeout(nextRound, 900);
            },

            failed: function (message) {
                roundFailed = true;
                ctx.feedback(message || "Falsch! ❌ Versuche es noch einmal.", "#e74c3c");
            },

            german: german,
            midi: midi
        };

        /* ------------------------------------------------------------ Ablauf */

        function nextRound() {
            if (roundCount >= totalRounds) { showResult(); return; }
            roundFailed = false;
            ctx.feedback("");
            ctx.clearAnswers();
            ctx.hint("");
            // Aus dem Vorlauf stehengebliebene Klaviatur samt Markierungen entfernen;
            // Level, die eine brauchen, bauen sie in start() ohnehin neu auf.
            ctx.keyboard(false);
            el.round.innerText = "Runde: " + (roundCount + 1) + " / " + totalRounds;
            levels[levelIndex].start(ctx);
        }

        function setLevel(index) {
            if (index > maxUnlocked) { el.lock.style.display = "flex"; return; }
            levelIndex = index;
            score = 0;
            roundCount = 0;
            el.score.innerText = "0";
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
            root.querySelector(".js-result-grade").style.color = passed ? "#2ecc71" : "#e74c3c";
            root.querySelector(".js-result-stats").innerText =
                score + " / " + totalRounds + " (" + Math.round(percentage) + "%)";
            root.querySelector(".js-result-title").innerText =
                passed ? "Level geschafft! 🎉" : "Nicht bestanden 😕";

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
            root.querySelector(".js-unlock-title").innerText = "Freischaltung 🔑";
            root.querySelector(".js-unlock-title").style.color = "#f1c40f";
            root.querySelector(".js-unlock-icon").innerText = "👨‍🏫";
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
                root.querySelector(".js-unlock-title").innerText = "Erfolg! 🎉";
                root.querySelector(".js-unlock-title").style.color = "#2ecc71";
                root.querySelector(".js-unlock-icon").innerText = "🔓";
                root.querySelector(".js-unlock-text").innerText = "Alle Level wurden freigeschaltet!";
                root.querySelector(".js-unlock-input-wrap").style.display = "none";
                root.querySelector(".js-unlock-actions").style.display = "none";
                root.querySelector(".js-unlock-close").style.display = "block";
            } else {
                root.querySelector(".js-unlock-title").innerText = "Falsches Passwort! ❌";
                root.querySelector(".js-unlock-title").style.color = "#e74c3c";
                root.querySelector(".js-unlock-icon").innerText = "🚫";
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

    // Wählt aus list, vermeidet dabei die zuletzt gezogenen Einträge.
    function pickFresh(list, recent, memory) {
        const fresh = list.filter(function (x) { return recent.indexOf(x) === -1; });
        const chosen = pick(fresh.length ? fresh : list);
        recent.push(chosen);
        while (recent.length > (memory || 3)) recent.shift();
        return chosen;
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
        whenVexReady: whenVexReady,
        createModule: createModule,
        pick: pick,
        pickFresh: pickFresh
    };
})();
