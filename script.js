document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const calendarView = document.getElementById('calendar-view');
    const eventsList = document.getElementById('events-list');
    const currentDateElement = document.getElementById('current-date');
    const todayBtn = document.getElementById('today-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const viewOptions = document.querySelectorAll('.view-option');
    const addEventBtn = document.getElementById('add-event-btn');
    const eventModal = document.getElementById('event-modal');
    const eventDetailsModal = document.getElementById('event-details-modal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const eventForm = document.getElementById('event-form');
    const eventTitleInput = document.getElementById('event-title');
    const eventDateInput = document.getElementById('event-date');
    const eventStartTimeInput = document.getElementById('event-start-time');
    const eventEndTimeInput = document.getElementById('event-end-time');
    const eventDescriptionInput = document.getElementById('event-description');
    const eventColorInput = document.getElementById('event-color');
    const eventAlarmInput = document.getElementById('event-alarm');
    const eventAlarmBeforeSelect = document.getElementById('event-alarm-before');
    const detailsAlarm = document.getElementById('details-alarm');
    const alarmOverlay = document.getElementById('alarm-overlay');
    const alarmCard = document.getElementById('alarm-card');
    const alarmWhenEl = document.getElementById('alarm-when');
    const alarmTitleEl = document.getElementById('alarm-title');
    const alarmTimeEl = document.getElementById('alarm-time');
    const alarmDescEl = document.getElementById('alarm-desc');
    const alarmQueueEl = document.getElementById('alarm-queue');
    const alarmSnoozeBtn = document.getElementById('alarm-snooze');
    const alarmDismissBtn = document.getElementById('alarm-dismiss');
    const alarmPickBtn = document.getElementById('alarm-pick-btn');
    const alarmTestBtn = document.getElementById('alarm-test-btn');
    const alarmResetBtn = document.getElementById('alarm-reset-btn');
    const alarmFileInput = document.getElementById('alarm-file');
    const alarmVolumeInput = document.getElementById('alarm-volume');
    const alarmSoundName = document.getElementById('alarm-sound-name');
    const alarmStatus = document.getElementById('alarm-status');
    const notifBtn = document.getElementById('notif-btn');
    const alarmEditBtn = document.getElementById('alarm-edit-btn');
    const rtModal = document.getElementById('ringtone-modal');
    const rtClose = document.getElementById('rt-close');
    const rtFile = document.getElementById('rt-file');
    const rtCanvas = document.getElementById('rt-canvas');
    const rtWaveMsg = document.getElementById('rt-wave-msg');
    const rtNow = document.getElementById('rt-now');
    const rtTotal = document.getElementById('rt-total');
    const rtStart = document.getElementById('rt-start');
    const rtEnd = document.getElementById('rt-end');
    const rtStartLabel = document.getElementById('rt-start-label');
    const rtEndLabel = document.getElementById('rt-end-label');
    const rtLength = document.getElementById('rt-length');
    const rtSetStart = document.getElementById('rt-set-start');
    const rtSetEnd = document.getElementById('rt-set-end');
    const rtTestBtn = document.getElementById('rt-test');
    const rtSaveBtn = document.getElementById('rt-save');
    const detailsTitle = document.getElementById('details-title');
    const detailsDate = document.getElementById('details-date');
    const detailsTime = document.getElementById('details-time');
    const detailsDescription = document.getElementById('details-description');
    const deleteEventBtn = document.getElementById('delete-event-btn');
    const editEventBtn = document.getElementById('edit-event-btn');
    const closeDetailsBtn = document.getElementById('close-details-btn');
    const formTitle = document.getElementById('form-title');
    const themeToggle = document.getElementById('theme-toggle');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const backupStatus = document.getElementById('backup-status');

    // ===== Konfigurasi =====
    const HOLIDAY_API = 'https://api.kemendesa.link/libur-nasional/api/holidays/latest';
    // Urutan percobaan: API langsung -> holidays.json (disegarkan otomatis dari API oleh GitHub Actions)
    // -> proxy CORS publik. Berhenti di sumber pertama yang berhasil.
    const HOLIDAY_SOURCES = [
        HOLIDAY_API,
        'holidays.json',
        'https://api.allorigins.win/raw?url=' + encodeURIComponent(HOLIDAY_API)
    ];
    const HOLIDAY_CACHE_KEY = 'holidays_cache'; // salinan terakhir hasil API (bukan data manual)
    // Titik awal huruf "A": besok (19 Oktober 2026), lalu setiap 3 hari (19, 22, 25, ...)
    const A_START = new Date(2026, 9, 19);
    const A_INTERVAL = 3;

    // ===== Jadwal piket malam (00.00 - 06.00) =====
    // Mengikuti tanggal siklus A (19, 22, 25, 28, ...). Selang-seling Grup 1 dan Grup 2,
    // dan tiap Grup bergeser satu slot setiap putaran (yang jam 04 pindah ke jam 00).
    const PIKET_SLOTS = ['00.00 - 02.00', '02.00 - 04.00', '04.00 - 06.00'];
    const PIKET_GROUP_1 = [['Abiyu', 'Defri'], ['Diaz', 'Amat'], ['Andyka', 'Bahar']];
    const PIKET_GROUP_2 = [['Haris', 'Mister'], ['Repi', 'Ikbal'], ['Nur', 'Dody']];


    // App State
    let currentView = 'month';
    let currentDate = new Date();
    let events = JSON.parse(localStorage.getItem('events')) || [];
    let selectedEventId = null;
    let editingEventId = null;

    // Alarm
    const ALARM_CATCHUP_MS = 5 * 60 * 1000;   // alarm yang terlambat <= 5 menit (mis. tab sempat tertidur) tetap dibunyikan
    const ALARM_SNOOZE_MIN = 5;
    const ALARM_RENOTIFY_MS = 30 * 1000;       // selama alarm berbunyi & aplikasi di latar belakang, notifikasi diulang
    const ALARM_MAX_FILE_MB = 15;
    let alarmQueue = [];
    let currentAlarm = null;
    let ringer = null;
    let audioCtx = null;
    let customSound = null;                    // { name, url }
    let alarmVolume = 80;
    const baseTitle = document.title;
    let holidays = readHolidayCache();

    init();

    function init() {
        renderCalendar();
        renderEventsList();
        setupEventListeners();
        loadHolidays();
        initAlarms();
    }

    // ===== Hari libur nasional =====
    function readHolidayCache() {
        try {
            return JSON.parse(localStorage.getItem(HOLIDAY_CACHE_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    // Coba tiap sumber berurutan sampai ada yang berhasil.
    function fetchHolidayJson(i = 0) {
        if (i >= HOLIDAY_SOURCES.length) return Promise.reject(new Error('Semua sumber hari libur gagal'));
        return fetch(HOLIDAY_SOURCES[i])
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(json => {
                if (!json.data || !json.data.length) throw new Error('Data hari libur kosong');
                return json;
            })
            .catch(err => {
                console.warn('Sumber hari libur gagal:', HOLIDAY_SOURCES[i], err);
                return fetchHolidayJson(i + 1);
            });
    }

    // Hasil terakhir disimpan sebagai cache supaya tetap tampil saat offline,
    // dan tahun-tahun sebelumnya tidak hilang ketika API berganti ke tahun berikutnya.
    function loadHolidays() {
        fetchHolidayJson()
            .then(json => {
                const map = {};
                json.data.forEach(h => {
                    map[h.date] = h.name + (h.is_cuti_bersama ? ' (Cuti Bersama)' : '');
                });
                holidays = Object.assign({}, readHolidayCache(), map);
                try { localStorage.setItem(HOLIDAY_CACHE_KEY, JSON.stringify(holidays)); } catch (e) {}
                showHolidayStatus(null);
                renderCalendar();
            })
            .catch(err => {
                console.warn(err);
                showHolidayStatus(Object.keys(holidays).length
                    ? '⚠ Hari libur: memakai data tersimpan'
                    : '⚠ Hari libur gagal dimuat');
            });
    }

    function showHolidayStatus(message) {
        const header = document.querySelector('.sidebar-header');
        if (!header) return;
        let el = document.getElementById('holiday-status');
        if (!message) {
            if (el) el.remove();
            return;
        }
        if (!el) {
            el = document.createElement('span');
            el.id = 'holiday-status';
            el.className = 'holiday-status';
            header.appendChild(el);
        }
        el.textContent = message;
    }

    function dateKey(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getHolidayName(date) {
        return holidays[dateKey(date)] || null;
    }

    function isRedDate(date) {
        return date.getDay() === 0 || !!getHolidayName(date);
    }

    // ===== Huruf "A" =====
    function isCycleA(date) {
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diff = Math.round((d - A_START) / 86400000);
        return diff >= 0 && diff % A_INTERVAL === 0;
    }

    // Baris (minggu) ke-berapa dalam grid bulan (mulai Minggu), 1-based
    function getWeekRowInMonth(date) {
        const first = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return Math.floor((first + date.getDate() - 1) / 7) + 1;
    }

    function hasA(date) {
        if (isCycleA(date)) return true;
        // Jika A jatuh di hari Minggu pada baris 2/3/4, hari Selasa di minggu itu juga dapat A
        if (date.getDay() === 2) {
            const sunday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 2);
            const row = getWeekRowInMonth(sunday);
            if (isCycleA(sunday) && sunday.getDay() === 0 && row >= 2 && row <= 4) return true;
        }
        return false;
    }

    // Kembalikan jadwal piket untuk tanggal tertentu (null jika bukan tanggal siklus)
    function getPiket(date) {
        if (!isCycleA(date)) return null;
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const k = Math.round((d - A_START) / 86400000) / A_INTERVAL; // putaran ke-k (0, 1, 2, ...)
        const group = k % 2 === 0 ? PIKET_GROUP_1 : PIKET_GROUP_2;
        const step = Math.floor(k / 2);
        return PIKET_SLOTS.map((time, i) => ({
            time,
            names: group[(((i - step) % 3) + 3) % 3].join(' & ')
        }));
    }

    // Piket malam tanggal siklus (mis. 19) berlangsung pukul 00.00-06.00 pada keesokan harinya (20).
    // Jadi untuk tanggal kalender tertentu, ambil jadwal dari tanggal siklus H-1.
    function getPiketDini(date) {
        const kemarin = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
        return getPiket(kemarin);
    }

    function createPiketBlock(slot, withTime) {
        const el = document.createElement('div');
        el.className = 'piket-event';
        el.innerHTML = withTime
            ? `<strong>Piket</strong> ${slot.time} • ${escapeHtml(slot.names)}`
            : escapeHtml(slot.names);
        el.addEventListener('click', e => e.stopPropagation());
        return el;
    }

    function isTodayDate(date) {
        return date.toDateString() === new Date().toDateString();
    }

    function createTodayStamp() {
        const stamp = document.createElement('span');
        stamp.className = 'today-stamp';
        stamp.textContent = 'HARI INI';
        return stamp;
    }

    function createABadge(date) {
        const badge = document.createElement('span');
        badge.className = 'a-badge';
        badge.textContent = 'A';
        const piket = date ? getPiket(date) : null;
        if (piket) {
            const besok = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
            badge.title = `Piket malam ini (dini hari tgl ${besok.getDate()}):\n` +
                piket.map(p => `${p.time}  ${p.names}`).join('\n');
        } else {
            badge.title = 'Jadwal A';
        }
        return badge;
    }

    // ===== Backup & restore =====
    function showBackupStatus(message, isError) {
        if (!backupStatus) return;
        backupStatus.textContent = message;
        backupStatus.classList.toggle('error', !!isError);
        clearTimeout(showBackupStatus._t);
        showBackupStatus._t = setTimeout(() => { backupStatus.textContent = ''; }, 6000);
    }

    function exportData() {
        const payload = {
            app: 'kalender-acara',
            version: 1,
            exportedAt: new Date().toISOString(),
            events
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kalender-backup-${dateKey(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showBackupStatus(`✔ ${events.length} acara diekspor.`);
    }

    // Rapikan & validasi satu acara dari file backup
    function sanitizeEvent(e) {
        if (!e || typeof e !== 'object') return null;
        const start = new Date(e.startTime);
        const end = new Date(e.endTime);
        if (isNaN(start) || isNaN(end)) return null;
        return {
            id: String(e.id || (Date.now().toString() + Math.random().toString(36).slice(2, 8))),
            title: String(e.title || '(Tanpa judul)').slice(0, 200),
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            description: String(e.description || '').slice(0, 2000),
            color: /^#[0-9a-fA-F]{6}$/.test(e.color) ? e.color : '#4e73df',
            alarm: !!e.alarm,
            alarmBefore: [0, 5, 10, 15, 30, 60].includes(Number(e.alarmBefore)) ? Number(e.alarmBefore) : 0
        };
    }

    function importData(file) {
        const reader = new FileReader();
        reader.onerror = () => showBackupStatus('Gagal membaca file.', true);
        reader.onload = () => {
            let parsed;
            try {
                parsed = JSON.parse(reader.result);
            } catch (err) {
                showBackupStatus('File bukan JSON yang valid.', true);
                return;
            }

            const list = Array.isArray(parsed) ? parsed : parsed && parsed.events;
            if (!Array.isArray(list)) {
                showBackupStatus('Format backup tidak dikenali.', true);
                return;
            }

            const valid = list.map(sanitizeEvent).filter(Boolean);
            const existingIds = new Set(events.map(ev => ev.id));
            const fresh = valid.filter(ev => !existingIds.has(ev.id));

            const ok = confirm(
                `Ditemukan ${valid.length} acara di file ini:\n` +
                `• ${fresh.length} acara baru akan ditambahkan\n` +
                `• ${valid.length - fresh.length} acara sudah ada (dilewati)\n\n` +
                'Acara yang sudah ada di kalender tidak akan dihapus. Lanjutkan?'
            );
            if (!ok) return;

            events = events.concat(fresh);
            fresh.forEach(markPastAlarmFired);
            saveEventsToStorage();

            renderCalendar();
            renderEventsList();
            showBackupStatus(`✔ ${fresh.length} acara berhasil dipulihkan.`);
        };
        reader.readAsText(file);
    }

    // ===== Alarm & notifikasi =====
    function readJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
    }

    function writeJSON(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    }

    // --- IndexedDB: tempat menyimpan file lagu (localStorage terlalu kecil untuk audio) ---
    function idbRequest(mode, fn) {
        return new Promise((resolve, reject) => {
            const open = indexedDB.open('kalender-db', 1);
            open.onupgradeneeded = () => open.result.createObjectStore('files');
            open.onerror = () => reject(open.error);
            open.onsuccess = () => {
                const db = open.result;
                const tx = db.transaction('files', mode);
                const req = fn(tx.objectStore('files'));
                tx.oncomplete = () => { db.close(); resolve(req.result); };
                tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
            };
        });
    }

    function fmtTime(sec) {
        sec = Math.round(Math.max(0, sec || 0) * 10) / 10;
        const m = Math.floor(sec / 60);
        const r = sec - m * 60;
        return `${m}:${r.toFixed(1).padStart(4, '0')}`;
    }

    async function loadCustomSound() {
        try {
            const rec = await idbRequest('readonly', store => store.get('alarmSound'));
            if (customSound && customSound.url) URL.revokeObjectURL(customSound.url);
            customSound = rec && rec.blob
                ? { name: rec.name, url: URL.createObjectURL(rec.blob), start: rec.start || 0, end: rec.end || null }
                : null;
        } catch (e) {
            customSound = null;
        }
        if (alarmSoundName) {
            alarmSoundName.textContent = customSound
                ? `🎵 ${customSound.name} (${fmtTime(customSound.start)} – ${customSound.end ? fmtTime(customSound.end) : 'akhir'})`
                : '🎵 Nada bawaan (lonceng)';
        }
    }

    function showAlarmStatus(message, isError) {
        if (!alarmStatus) return;
        alarmStatus.textContent = message;
        alarmStatus.classList.toggle('error', !!isError);
        clearTimeout(showAlarmStatus._t);
        showAlarmStatus._t = setTimeout(() => { alarmStatus.textContent = ''; }, 7000);
    }

    // --- Suara ---
    function getAudioCtx() {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        if (!audioCtx) audioCtx = new AC();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    // Nada bawaan: lonceng pendek yang diulang (dibuat langsung oleh browser, tanpa file)
    function playChimeOnce(volume) {
        const ctx = getAudioCtx();
        if (!ctx) return;
        [659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
            const t = ctx.currentTime + i * 0.22;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.01) * 0.6, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.55);
        });
    }

    function updateTestButton() {
        if (alarmTestBtn) alarmTestBtn.textContent = ringer && ringer.preview ? '⏹ Stop' : '▶ Coba';
    }

    // Menyalakan suara + getar. Berulang terus sampai alarm dimatikan / ditunda.
    function startSound() {
        const volume = alarmVolume / 100;

        if (customSound) {
            const { start, end, url } = customSound;
            const audio = new Audio(url);
            audio.volume = volume;
            try { audio.currentTime = start; } catch (e) {}
            audio.addEventListener('loadedmetadata', () => {
                try { if (audio.currentTime < start) audio.currentTime = start; } catch (e) {}
            });
            // Ulangi potongan: kembali ke titik mulai setelah mencapai titik berhenti / akhir lagu
            audio.addEventListener('ended', () => {
                audio.currentTime = start;
                audio.play().catch(() => {});
            });
            if (end) {
                ringer.guard = setInterval(() => {
                    if (audio.currentTime >= end) audio.currentTime = start;
                }, 40);
            }
            ringer.audio = audio;
            audio.play().catch(() => {
                showAlarmStatus('Browser menahan suara. Ketuk layar sekali agar lagu berbunyi.', true);
            });
        } else {
            playChimeOnce(volume);
            ringer.timer = setInterval(() => playChimeOnce(volume), 2200);
        }

        if (navigator.vibrate) {
            const pattern = [400, 200, 400, 200, 600];
            navigator.vibrate(pattern);
            ringer.vib = setInterval(() => navigator.vibrate(pattern), 3000);
        }
    }

    // Mematikan suara + getar
    function stopSound() {
        if (!ringer) return;
        if (ringer.audio) {
            ringer.audio.pause();
            ringer.audio.currentTime = 0;
            ringer.audio = null;
        }
        clearInterval(ringer.timer);
        clearInterval(ringer.vib);
        clearInterval(ringer.guard);
        ringer.timer = ringer.vib = ringer.guard = null;
        if (navigator.vibrate) navigator.vibrate(0);
    }

    // preview = true -> cuplikan singkat dari tombol "Coba" (otomatis berhenti setelah 8 detik);
    // selain itu alarm sungguhan: berbunyi terus sampai pengguna menekan Matikan / Tunda.
    function startRinging(preview) {
        stopRinging();
        ringer = { preview: !!preview };
        startSound();

        if (preview) {
            ringer.stopTimer = setTimeout(stopRinging, 8000);
        } else {
            // Bila aplikasi di latar belakang, ingatkan lagi lewat notifikasi sistem
            ringer.notifTimer = setInterval(() => {
                if (document.hidden && currentAlarm) showSystemNotification(currentAlarm);
            }, ALARM_RENOTIFY_MS);
        }
        updateTestButton();
    }

    function stopRinging() {
        if (!ringer) return;
        stopSound();
        clearTimeout(ringer.stopTimer);
        clearInterval(ringer.notifTimer);
        ringer = null;
        updateTestButton();
    }

    // --- Penjadwalan ---
    function getAlarmAt(ev) {
        return new Date(ev.startTime).getTime() - (Number(ev.alarmBefore) || 0) * 60000;
    }

    function getFired() {
        const fired = readJSON('alarmFired', {});
        const cutoff = Date.now() - 24 * 3600 * 1000;
        Object.keys(fired).forEach(k => { if (fired[k] < cutoff) delete fired[k]; });
        return fired;
    }

    function markPastAlarmFired(ev) {
        if (!ev.alarm || getAlarmAt(ev) > Date.now()) return;
        const fired = getFired();
        fired[ev.id + '@' + getAlarmAt(ev)] = Date.now();
        writeJSON('alarmFired', fired);
    }

    function checkAlarms() {
        const now = Date.now();
        const fired = getFired();
        let changed = false;

        events.forEach(ev => {
            if (!ev.alarm) return;
            const at = getAlarmAt(ev);
            const key = ev.id + '@' + at;
            if (now >= at && now - at <= ALARM_CATCHUP_MS && !fired[key]) {
                fired[key] = now;
                changed = true;
                triggerAlarm(ev);
            }
        });
        if (changed) writeJSON('alarmFired', fired);

        const snoozes = readJSON('alarmSnoozes', []);
        if (snoozes.length) {
            const due = snoozes.filter(sn => sn.at <= now);
            if (due.length) {
                writeJSON('alarmSnoozes', snoozes.filter(sn => sn.at > now));
                due.forEach(sn => {
                    const ev = events.find(e => e.id === sn.id);
                    if (ev) triggerAlarm(ev);
                });
            }
        }
    }

    function triggerAlarm(ev) {
        if ((currentAlarm && currentAlarm.id === ev.id) || alarmQueue.some(a => a.id === ev.id)) return;
        alarmQueue.push(ev);
        if (document.hidden) showSystemNotification(ev);
        if (!currentAlarm) showNextAlarm();
        else updateAlarmQueueLabel();
    }

    function updateAlarmQueueLabel() {
        if (!alarmQueueEl) return;
        alarmQueueEl.textContent = alarmQueue.length ? `+${alarmQueue.length} alarm lain menunggu` : '';
    }

    function describeStart(ev) {
        const diff = Math.round((new Date(ev.startTime) - Date.now()) / 60000);
        if (diff > 0) return `Dimulai ${diff} menit lagi`;
        if (diff < 0) return `Dimulai ${-diff} menit lalu`;
        return 'Acara dimulai sekarang';
    }

    function showNextAlarm() {
        currentAlarm = alarmQueue.shift() || null;

        if (!currentAlarm) {
            alarmOverlay.hidden = true;
            stopRinging();
            document.title = baseTitle;
            return;
        }

        const ev = currentAlarm;
        const start = new Date(ev.startTime);
        const end = new Date(ev.endTime);

        alarmCard.style.setProperty('--alarm-color', ev.color || '#4e73df');
        alarmWhenEl.textContent = describeStart(ev);
        alarmTitleEl.textContent = ev.title;
        alarmTimeEl.textContent = start.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) +
            ' • ' + formatTime(start) + ' - ' + formatTime(end);
        alarmDescEl.textContent = ev.description || '';
        alarmDescEl.hidden = !ev.description;
        updateAlarmQueueLabel();

        alarmOverlay.hidden = false;
        document.title = '🔔 ' + ev.title;
        startRinging();
    }

    function dismissAlarm() {
        stopRinging();
        showNextAlarm();
    }

    function snoozeAlarm() {
        if (currentAlarm) {
            const snoozes = readJSON('alarmSnoozes', []);
            snoozes.push({ id: currentAlarm.id, at: Date.now() + ALARM_SNOOZE_MIN * 60000 });
            writeJSON('alarmSnoozes', snoozes);
        }
        dismissAlarm();
    }

    // Notifikasi sistem (tampil saat tab/aplikasi sedang di latar belakang)
    async function showSystemNotification(ev) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        const start = new Date(ev.startTime);
        const options = {
            body: describeStart(ev) + ' • ' + formatTime(start),
            tag: 'alarm-' + ev.id,
            requireInteraction: true,
            vibrate: [300, 150, 300, 150, 600]
        };
        try {
            const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
            if (reg) {
                await reg.showNotification('🔔 ' + ev.title, options);
                return;
            }
        } catch (e) { /* lanjut ke cara biasa */ }
        try { new Notification('🔔 ' + ev.title, options); } catch (e) {}
    }

    function updateNotifButton() {
        if (!notifBtn) return;
        if (!('Notification' in window)) {
            notifBtn.hidden = true;
            return;
        }
        const perm = Notification.permission;
        notifBtn.disabled = perm !== 'default';
        notifBtn.textContent = perm === 'granted' ? '✔ Notifikasi aktif'
            : perm === 'denied' ? '🚫 Notifikasi diblokir'
            : '🔔 Aktifkan notifikasi';
        if (perm === 'denied') {
            showAlarmStatus('Izinkan notifikasi lewat pengaturan situs di browser Anda.', true);
        }
    }

    // ===== Editor nada dering: pilih potongan lagu -> tes -> jadikan nada dering =====
    let rt = null;
    const RT_MIN_GAP = 1;        // potongan minimal 1 detik
    const RT_DEFAULT_LEN = 30;   // potongan awal 30 detik pertama

    function isAudioFile(file) {
        return (file.type && file.type.startsWith('audio/')) ||
            /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm|amr)$/i.test(file.name || '');
    }

    function handleSoundFile(file) {
        if (!file) return;
        if (!isAudioFile(file)) {
            showAlarmStatus('File harus berupa audio (mp3, wav, ogg, m4a).', true);
            return;
        }
        if (file.size > ALARM_MAX_FILE_MB * 1024 * 1024) {
            showAlarmStatus(`Ukuran file maksimal ${ALARM_MAX_FILE_MB} MB.`, true);
            return;
        }
        openRingtoneEditor(file, file.name, file.type, 0, null);
    }

    async function editSavedRingtone() {
        let rec = null;
        try { rec = await idbRequest('readonly', store => store.get('alarmSound')); } catch (e) {}
        if (!rec || !rec.blob) {
            showAlarmStatus('Belum ada lagu tersimpan. Tekan "Pilih lagu" dulu.', true);
            return;
        }
        openRingtoneEditor(rec.blob, rec.name, rec.type, rec.start || 0, rec.end || Infinity);
    }

    function metadataDuration(url) {
        return new Promise(resolve => {
            const a = new Audio();
            const timer = setTimeout(() => resolve(0), 5000);
            a.preload = 'metadata';
            a.onloadedmetadata = () => { clearTimeout(timer); resolve(isFinite(a.duration) ? a.duration : 0); };
            a.onerror = () => { clearTimeout(timer); resolve(0); };
            a.src = url;
        });
    }

    function computePeaks(buffer, bins) {
        const ch = [];
        for (let c = 0; c < Math.min(2, buffer.numberOfChannels); c++) ch.push(buffer.getChannelData(c));
        const len = ch[0].length;
        const per = Math.max(1, Math.floor(len / bins));
        const stride = Math.max(1, Math.floor(per / 40));
        const peaks = new Array(bins).fill(0);
        let max = 0;
        for (let i = 0; i < bins; i++) {
            let m = 0;
            const from = i * per;
            const to = Math.min(len, from + per);
            for (let j = from; j < to; j += stride) {
                for (let c = 0; c < ch.length; c++) {
                    const v = Math.abs(ch[c][j]);
                    if (v > m) m = v;
                }
            }
            peaks[i] = m;
            if (m > max) max = m;
        }
        return max > 0 ? peaks.map(p => p / max) : peaks;
    }

    // Membaca durasi + gelombang. Didecode pada 8 kHz agar hemat memori di HP.
    async function analyseAudio(blob, url) {
        let duration = 0;
        let peaks = null;
        try {
            const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
            const ctx = new OAC(1, 1, 8000);
            const data = await blob.arrayBuffer();
            const decoded = await new Promise((resolve, reject) => {
                const p = ctx.decodeAudioData(data, resolve, reject);
                if (p && p.then) p.then(resolve, reject);
            });
            duration = decoded.duration;
            peaks = computePeaks(decoded, 240);
        } catch (e) { /* lanjut tanpa gelombang */ }
        if (!duration) duration = await metadataDuration(url);
        return { duration, peaks };
    }

    function setRtEnabled(on) {
        [rtStart, rtEnd, rtSetStart, rtSetEnd, rtTestBtn, rtSaveBtn].forEach(el => { el.disabled = !on; });
    }

    async function openRingtoneEditor(blob, name, type, start, end) {
        closeRingtoneEditor();
        const url = URL.createObjectURL(blob);
        const token = {};
        rt = { token, blob, name, type: type || blob.type || 'audio/mpeg', url, duration: 0, start: 0, end: 0, peaks: null, audio: null, lastTime: 0 };

        rtFile.textContent = name;
        rtWaveMsg.textContent = 'Memuat lagu…';
        rtNow.textContent = fmtTime(0);
        rtTotal.textContent = '/ ' + fmtTime(0);
        setRtEnabled(false);
        rtModal.style.display = 'flex';

        const info = await analyseAudio(blob, url);
        if (!rt || rt.token !== token) return; // editor sudah ditutup / diganti

        if (!info.duration) {
            closeRingtoneEditor();
            showAlarmStatus('Format audio ini tidak bisa dibuka browser. Coba mp3, m4a, atau wav.', true);
            return;
        }

        rt.duration = info.duration;
        rt.peaks = info.peaks;
        rt.start = Math.min(start || 0, Math.max(0, rt.duration - 0.1));
        rt.end = end ? Math.min(end, rt.duration) : Math.min(rt.duration, rt.start + RT_DEFAULT_LEN);
        rtStart.max = rtEnd.max = String(rt.duration);
        rtTotal.textContent = '/ ' + fmtTime(rt.duration);
        rtWaveMsg.textContent = info.peaks ? '' : 'Gelombang tidak tersedia, potongan tetap bisa diatur dengan penggeser.';
        clampRt('start');
        setRtEnabled(true);
        syncRt();
    }

    function closeRingtoneEditor() {
        if (rt) {
            stopRtPreview();
            URL.revokeObjectURL(rt.url);
            rt = null;
        }
        if (rtModal) rtModal.style.display = 'none';
    }

    function clampRt(changed) {
        const gap = Math.min(RT_MIN_GAP, rt.duration);
        if (changed === 'start') {
            rt.start = Math.min(Math.max(0, rt.start), rt.duration - gap);
            if (rt.end < rt.start + gap) rt.end = Math.min(rt.duration, rt.start + gap);
        } else {
            rt.end = Math.max(Math.min(rt.duration, rt.end), gap);
            if (rt.start > rt.end - gap) rt.start = Math.max(0, rt.end - gap);
        }
    }

    function syncRt() {
        if (!rt) return;
        rtStart.value = String(rt.start);
        rtEnd.value = String(rt.end);
        rtStartLabel.textContent = fmtTime(rt.start);
        rtEndLabel.textContent = fmtTime(rt.end);
        rtLength.textContent = 'Durasi potongan: ' + fmtTime(rt.end - rt.start);
        drawWave();
    }

    function drawWave() {
        if (!rt || !rtCanvas || !rt.duration) return;
        const dpr = window.devicePixelRatio || 1;
        const w = rtCanvas.clientWidth;
        const h = rtCanvas.clientHeight;
        if (!w || !h) return;
        rtCanvas.width = Math.round(w * dpr);
        rtCanvas.height = Math.round(h * dpr);
        const g = rtCanvas.getContext('2d');
        g.scale(dpr, dpr);

        const css = getComputedStyle(document.documentElement);
        const on = css.getPropertyValue('--primary-color').trim() || '#4e73df';
        const off = css.getPropertyValue('--light-gray').trim() || '#d1d3e2';
        const x0 = (rt.start / rt.duration) * w;
        const x1 = (rt.end / rt.duration) * w;

        g.globalAlpha = 0.12;
        g.fillStyle = on;
        g.fillRect(x0, 0, Math.max(1, x1 - x0), h);
        g.globalAlpha = 1;

        if (rt.peaks) {
            const n = rt.peaks.length;
            const bw = w / n;
            for (let i = 0; i < n; i++) {
                const t = ((i + 0.5) / n) * rt.duration;
                const amp = Math.max(3, rt.peaks[i] * h * 0.85);
                g.fillStyle = t >= rt.start && t <= rt.end ? on : off;
                g.fillRect(i * bw + 0.5, (h - amp) / 2, Math.max(1, bw - 1.5), amp);
            }
        } else {
            g.fillStyle = off;
            g.fillRect(0, h / 2 - 4, w, 8);
            g.fillStyle = on;
            g.fillRect(x0, h / 2 - 4, Math.max(1, x1 - x0), 8);
        }

        // Penanda mulai & berhenti
        g.fillStyle = on;
        g.fillRect(Math.max(0, x0 - 1), 0, 2, h);
        g.fillRect(Math.min(w - 2, x1 - 1), 0, 2, h);

        // Posisi putar saat tes
        if (rt.audio) {
            const px = (rt.lastTime / rt.duration) * w;
            g.fillStyle = '#e74a3b';
            g.fillRect(px - 1, 0, 2, h);
        }
    }

    function stopRtPreview() {
        if (!rt) return;
        if (rt.audio) {
            rt.audio.pause();
            rt.audio = null;
        }
        clearInterval(rt.guard);
        cancelAnimationFrame(rt.raf);
        if (rtTestBtn) rtTestBtn.textContent = '▶ Tes potongan';
        drawWave();
    }

    function toggleRtPreview() {
        if (!rt) return;
        if (rt.audio) {
            stopRtPreview();
            return;
        }
        if (ringer) stopRinging(); // jangan tabrakan dengan alarm / cuplikan sidebar

        const audio = new Audio(rt.url);
        audio.volume = alarmVolume / 100;
        try { audio.currentTime = rt.start; } catch (e) {}
        rt.audio = audio;
        rt.lastTime = rt.start;
        rtTestBtn.textContent = '⏹ Stop tes';

        audio.play().catch(() => {
            rtWaveMsg.textContent = 'Browser menahan suara. Ketuk "Tes potongan" sekali lagi.';
            stopRtPreview();
        });

        // Berhenti otomatis di titik "berhenti"
        rt.guard = setInterval(() => {
            if (!rt || !rt.audio) return;
            if (rt.audio.currentTime >= rt.end - 0.02 || rt.audio.ended) stopRtPreview();
        }, 40);

        const tick = () => {
            if (!rt || !rt.audio) return;
            rt.lastTime = rt.audio.currentTime;
            rtNow.textContent = fmtTime(rt.lastTime);
            drawWave();
            rt.raf = requestAnimationFrame(tick);
        };
        tick();
    }

    async function saveRingtone() {
        if (!rt) return;
        stopRtPreview();
        const record = {
            name: rt.name,
            type: rt.type,
            blob: rt.blob,
            start: rt.start,
            end: rt.end >= rt.duration - 0.05 ? null : rt.end
        };
        try {
            await idbRequest('readwrite', store => store.put(record, 'alarmSound'));
            await loadCustomSound();
            closeRingtoneEditor();
            showAlarmStatus('✔ Nada dering disimpan. Tekan "Coba" untuk mendengar hasilnya.');
        } catch (e) {
            rtWaveMsg.textContent = 'Gagal menyimpan (penyimpanan browser penuh atau diblokir).';
        }
    }

    function initRingtoneEditor() {
        if (!rtModal) return;
        rtClose.addEventListener('click', closeRingtoneEditor);
        rtModal.addEventListener('click', e => { if (e.target === rtModal) closeRingtoneEditor(); });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && rtModal.style.display === 'flex') closeRingtoneEditor();
        });

        rtStart.addEventListener('input', () => {
            if (!rt) return;
            rt.start = Number(rtStart.value);
            clampRt('start');
            syncRt();
        });
        rtEnd.addEventListener('input', () => {
            if (!rt) return;
            rt.end = Number(rtEnd.value);
            clampRt('end');
            syncRt();
        });
        rtSetStart.addEventListener('click', () => {
            if (!rt) return;
            rt.start = rt.lastTime;
            clampRt('start');
            syncRt();
        });
        rtSetEnd.addEventListener('click', () => {
            if (!rt) return;
            rt.end = rt.lastTime || rt.end;
            clampRt('end');
            syncRt();
        });
        rtTestBtn.addEventListener('click', toggleRtPreview);
        rtSaveBtn.addEventListener('click', saveRingtone);
        window.addEventListener('resize', drawWave);
    }

    function initAlarms() {
        alarmVolume = Number(localStorage.getItem('alarmVolume'));
        if (!(alarmVolume >= 0 && alarmVolume <= 100) || localStorage.getItem('alarmVolume') === null) alarmVolume = 80;
        if (alarmVolumeInput) alarmVolumeInput.value = alarmVolume;

        if (alarmVolumeInput) {
            alarmVolumeInput.addEventListener('input', () => {
                alarmVolume = Number(alarmVolumeInput.value);
                try { localStorage.setItem('alarmVolume', String(alarmVolume)); } catch (e) {}
                if (ringer && ringer.audio) ringer.audio.volume = alarmVolume / 100;
            });
        }

        if (alarmPickBtn && alarmFileInput) {
            alarmPickBtn.addEventListener('click', () => alarmFileInput.click());
            alarmFileInput.addEventListener('change', () => {
                handleSoundFile(alarmFileInput.files[0]);
                alarmFileInput.value = '';
            });
        }

        if (alarmEditBtn) alarmEditBtn.addEventListener('click', editSavedRingtone);
        initRingtoneEditor();

        if (alarmTestBtn) {
            alarmTestBtn.addEventListener('click', () => {
                if (ringer && ringer.preview) stopRinging();
                else if (!ringer) startRinging(true);
                // jika alarm sungguhan sedang berbunyi, tombol ini diabaikan
            });
        }

        if (alarmResetBtn) {
            alarmResetBtn.addEventListener('click', async () => {
                try { await idbRequest('readwrite', store => store.delete('alarmSound')); } catch (e) {}
                await loadCustomSound();
                showAlarmStatus('Kembali memakai nada bawaan.');
            });
        }

        if (notifBtn) {
            notifBtn.addEventListener('click', () => {
                Notification.requestPermission().then(updateNotifButton).catch(() => {});
            });
        }

        alarmSnoozeBtn.addEventListener('click', snoozeAlarm);
        alarmDismissBtn.addEventListener('click', dismissAlarm);

        // Ketukan pada kartu membantu browser HP yang menahan suara sebelum ada interaksi
        alarmCard.addEventListener('click', () => {
            getAudioCtx();
            if (ringer && ringer.audio && ringer.audio.paused) ringer.audio.play().catch(() => {});
        });
        document.addEventListener('pointerdown', () => getAudioCtx(), { once: true });

        updateNotifButton();
        loadCustomSound();

        if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        }

        setInterval(checkAlarms, 1000);
        document.addEventListener('visibilitychange', checkAlarms);
        checkAlarms();
    }

    // ===== Mode terang / gelap =====
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem('theme', theme); } catch (e) {}
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            // Mode terang tampil bulan sabit (klik -> gelap), mode gelap tampil matahari (klik -> terang)
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            themeToggle.title = theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap';
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    }

    function setupEventListeners() {
        applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
        if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

        // Backup & restore
        if (exportBtn) exportBtn.addEventListener('click', exportData);
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', () => {
                if (importFile.files[0]) importData(importFile.files[0]);
                importFile.value = ''; // supaya file yang sama bisa dipilih lagi
            });
        }

        todayBtn.addEventListener('click', goToToday);
        prevBtn.addEventListener('click', navigatePrevious);
        nextBtn.addEventListener('click', navigateNext);

        viewOptions.forEach(option => {
            option.addEventListener('click', () => switchView(option.dataset.view));
        });

        if (addEventBtn) addEventBtn.addEventListener('click', openEventModal);
        closeBtns.forEach(btn => btn.addEventListener('click', closeModals));
        eventForm.addEventListener('submit', saveEvent);

        deleteEventBtn.addEventListener('click', deleteEvent);
        editEventBtn.addEventListener('click', editEvent);
        closeDetailsBtn.addEventListener('click', closeModals);

        window.addEventListener('click', (e) => {
            if (e.target === eventModal || e.target === eventDetailsModal) {
                closeModals();
            }
        });
    }

    function renderCalendar() {
        calendarView.innerHTML = '';

        switch (currentView) {
            case 'day': renderDayView(); break;
            case 'week': renderWeekView(); break;
            case 'month': renderMonthView(); break;
        }

        updateCurrentDateDisplay();
    }

    function renderMonthView() {
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-view';

        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';

        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        dayNames.forEach((day, idx) => {
            const dayElement = document.createElement('div');
            dayElement.className = 'day-header' + (idx === 0 ? ' red-text' : '');
            dayElement.textContent = day;
            monthHeader.appendChild(dayElement);
        });

        monthContainer.appendChild(monthHeader);

        const daysGrid = document.createElement('div');
        daysGrid.className = 'month-days';

        for (let i = 0; i < startingDay; i++) {
            const prevMonthDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0 - (startingDay - i - 1));
            daysGrid.appendChild(createDayCell(prevMonthDay, true));
        }

        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const isToday = dayDate.toDateString() === today.toDateString();
            daysGrid.appendChild(createDayCell(dayDate, false, isToday));
        }

        const totalCells = Math.ceil((startingDay + daysInMonth) / 7) * 7;
        const remainingCells = totalCells - (startingDay + daysInMonth);
        for (let i = 1; i <= remainingCells; i++) {
            const nextMonthDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
            daysGrid.appendChild(createDayCell(nextMonthDay, true));
        }

        monthContainer.appendChild(daysGrid);
        calendarView.appendChild(monthContainer);
    }

    function createDayCell(date, isOtherMonth, isToday = false) {
        const dayCell = document.createElement('div');
        dayCell.className = `day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'current-day' : ''}`;

        const holidayName = getHolidayName(date);
        if (isRedDate(date)) dayCell.classList.add('red-date');
        if (isTodayDate(date)) {
            dayCell.classList.add('current-day');
            dayCell.appendChild(createTodayStamp());
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayCell.appendChild(dayNumber);

        if (hasA(date)) dayCell.appendChild(createABadge(date));

        const piketDini = getPiketDini(date);
        if (piketDini) {
            const pb = document.createElement('span');
            pb.className = 'piket-badge';
            pb.textContent = '🌙';
            pb.title = 'Piket dini hari (00.00 - 06.00):\n' +
                piketDini.map(p => `${p.time}  ${p.names}`).join('\n');
            dayCell.appendChild(pb);
        }

        if (holidayName) {
            dayCell.title = holidayName;
            const hl = document.createElement('div');
            hl.className = 'holiday-label';
            hl.textContent = holidayName;
            dayCell.appendChild(hl);
        }

        const dayEventsContainer = document.createElement('div');
        dayEventsContainer.className = 'day-events';

        const dayEvents = getEventsForDate(date);

        const maxEventsToShow = holidayName ? 2 : 3;
        let eventsShown = 0;
        let spaceUsed = 0;

        for (const event of dayEvents) {
            if (eventsShown >= maxEventsToShow || spaceUsed >= maxEventsToShow) break;

            const eventElement = document.createElement('div');
            eventElement.className = 'day-event month-event';
            eventElement.textContent = event.title;
            eventElement.style.backgroundColor = event.color;

            spaceUsed += event.title.length > 15 ? 1.5 : 1;

            if (spaceUsed <= maxEventsToShow) {
                dayEventsContainer.appendChild(eventElement);
                eventsShown++;

                eventElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showEventDetails(event.id);
                });
            }
        }

        if (dayEvents.length > eventsShown) {
            const moreEvents = document.createElement('div');
            moreEvents.className = 'day-event month-event';
            moreEvents.textContent = `+${dayEvents.length - eventsShown} lainnya`;
            moreEvents.style.backgroundColor = '#5a5c69';
            dayEventsContainer.appendChild(moreEvents);
        }

        dayCell.appendChild(dayEventsContainer);

        dayCell.addEventListener('click', () => {
            currentDate = new Date(date);
            if (isOtherMonth) {
                if (currentView === 'month') renderCalendar();
                else switchView('month');
            } else {
                switchView('day');
            }
        });

        return dayCell;
    }

    function renderWeekView() {
        const weekContainer = document.createElement('div');
        weekContainer.className = 'week-view';

        const weekHeader = document.createElement('div');
        weekHeader.className = 'week-header';
        weekHeader.appendChild(document.createElement('div'));

        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);

            const dayHeader = document.createElement('div');
            dayHeader.className = 'week-day-header';

            if (dayDate.toDateString() === today.toDateString()) dayHeader.classList.add('current-day');
            if (isRedDate(dayDate)) dayHeader.classList.add('red-text');

            const holidayName = getHolidayName(dayDate);
            if (holidayName) dayHeader.title = holidayName;

            dayHeader.innerHTML = `
                <div>${['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][i]}</div>
                <div>${dayDate.getDate()}</div>
            `;
            if (isTodayDate(dayDate)) dayHeader.appendChild(createTodayStamp());
            if (hasA(dayDate)) {
                const b = createABadge(dayDate);
                b.classList.add('inline');
                dayHeader.appendChild(b);
            }
            weekHeader.appendChild(dayHeader);
        }

        weekContainer.appendChild(weekHeader);

        const weekGrid = document.createElement('div');
        weekGrid.className = 'week-grid';

        for (let hour = 0; hour < 24; hour++) {
            const hourLabel = document.createElement('div');
            hourLabel.className = 'hour-label';
            hourLabel.textContent = `${String(hour).padStart(2, '0')}.00`;
            weekGrid.appendChild(hourLabel);

            for (let day = 0; day < 7; day++) {
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + day);
                dayDate.setHours(hour);

                const dayCell = document.createElement('div');
                dayCell.className = 'week-cell' + (isRedDate(dayDate) ? ' red-bg' : '');
                weekGrid.appendChild(dayCell);

                if (hour < 6 && hour % 2 === 0) {
                    const piket = getPiketDini(dayDate);
                    if (piket) dayCell.appendChild(createPiketBlock(piket[hour / 2], false));
                }

                getEventsForDateAndHour(dayDate, hour).forEach(event => {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'week-event';
                    eventElement.textContent = event.title;
                    eventElement.style.backgroundColor = event.color;

                    const startMinutes = new Date(event.startTime).getHours() * 60 + new Date(event.startTime).getMinutes();
                    const endMinutes = new Date(event.endTime).getHours() * 60 + new Date(event.endTime).getMinutes();
                    const height = ((endMinutes - startMinutes) / 60) * 60;
                    const position = (startMinutes % 60) / 60 * 60;

                    eventElement.style.top = `${position}px`;
                    eventElement.style.height = `${height}px`;

                    dayCell.appendChild(eventElement);

                    eventElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        showEventDetails(event.id);
                    });
                });

                dayCell.addEventListener('click', () => {
                    currentDate = new Date(dayDate);
                    openEventModalWithTime(hour);
                });
            }
        }

        weekContainer.appendChild(weekGrid);
        calendarView.appendChild(weekContainer);
    }

    function renderDayView() {
        const dayContainer = document.createElement('div');
        dayContainer.className = 'day-view';

        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header' + (isRedDate(currentDate) ? ' red-text' : '');
        const h2 = document.createElement('h2');
        h2.textContent = currentDate.toLocaleDateString('id-ID', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        dayHeader.appendChild(h2);
        if (isTodayDate(currentDate)) {
            const pill = document.createElement('span');
            pill.className = 'today-pill';
            pill.textContent = '📍 Hari Ini';
            dayHeader.appendChild(pill);
        }
        if (hasA(currentDate)) {
            const b = createABadge(currentDate);
            b.classList.add('inline');
            dayHeader.appendChild(b);
        }
        const holidayName = getHolidayName(currentDate);
        if (holidayName) {
            const hl = document.createElement('div');
            hl.className = 'holiday-banner';
            hl.textContent = '🎌 ' + holidayName;
            dayHeader.appendChild(hl);
        }
        dayContainer.appendChild(dayHeader);

        const dayGrid = document.createElement('div');
        dayGrid.className = 'day-grid';

        for (let hour = 0; hour < 24; hour++) {
            const hourLabel = document.createElement('div');
            hourLabel.className = 'day-hour-label hour-label';
            hourLabel.textContent = `${String(hour).padStart(2, '0')}.00`;
            dayGrid.appendChild(hourLabel);

            const timeBlock = document.createElement('div');
            timeBlock.className = 'day-time-block day-hour';
            dayGrid.appendChild(timeBlock);

            if (hour < 6 && hour % 2 === 0) {
                const piket = getPiketDini(currentDate);
                if (piket) timeBlock.appendChild(createPiketBlock(piket[hour / 2], true));
            }

            getEventsForDateAndHour(currentDate, hour).forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'day-event';
                eventElement.textContent = `${formatTime(new Date(event.startTime))} - ${event.title}`;
                eventElement.style.backgroundColor = event.color;

                const startMinutes = new Date(event.startTime).getHours() * 60 + new Date(event.startTime).getMinutes();
                const endMinutes = new Date(event.endTime).getHours() * 60 + new Date(event.endTime).getMinutes();
                const height = ((endMinutes - startMinutes) / 60) * 60;
                const position = (startMinutes % 60) / 60 * 60;

                eventElement.style.top = `${position}px`;
                eventElement.style.height = `${height}px`;

                timeBlock.appendChild(eventElement);

                eventElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showEventDetails(event.id);
                });
            });

            timeBlock.addEventListener('click', () => openEventModalWithTime(hour));
        }

        dayContainer.appendChild(dayGrid);
        calendarView.appendChild(dayContainer);
    }

    function renderEventsList() {
        eventsList.innerHTML = '';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingEvents = events
            .filter(event => new Date(event.startTime) >= today)
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        if (upcomingEvents.length === 0) {
            const noEvents = document.createElement('div');
            noEvents.className = 'no-events';
            noEvents.textContent = 'Belum ada acara mendatang. Klik jam atau tanggal untuk menambah.';
            eventsList.appendChild(noEvents);
            return;
        }

        upcomingEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event-item';
            eventElement.style.borderLeftColor = event.color;

            const startDate = new Date(event.startTime);
            const endDate = new Date(event.endTime);

            eventElement.innerHTML = `
                <div class="event-title">
                    <span>${escapeHtml(event.title)}${event.alarm ? ' 🔔' : ''}</span>
                    <span style="color: ${event.color}">●</span>
                </div>
                <div class="event-time">${formatDateTime(startDate, endDate)}</div>
                ${event.description ? `<div class="event-description">${escapeHtml(event.description)}</div>` : ''}
            `;

            eventsList.appendChild(eventElement);
            eventElement.addEventListener('click', () => showEventDetails(event.id));
        });
    }

    function getEventsForDate(date) {
        const key = dateKey(date);
        return events.filter(event => dateKey(new Date(event.startTime)) === key);
    }

    function getEventsForDateAndHour(date, hour) {
        const key = dateKey(date);
        return events.filter(event => {
            const s = new Date(event.startTime);
            return dateKey(s) === key && s.getHours() === hour;
        });
    }

    function updateCurrentDateDisplay() {
        switch (currentView) {
            case 'day':
                currentDateElement.textContent = currentDate.toLocaleDateString('id-ID', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                });
                break;
            case 'week': {
                const startOfWeek = new Date(currentDate);
                startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                currentDateElement.textContent =
                    `${startOfWeek.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })} - ` +
                    `${endOfWeek.toLocaleDateString('id-ID', {
                        month: endOfWeek.getMonth() !== startOfWeek.getMonth() ? 'short' : undefined,
                        day: 'numeric',
                        year: endOfWeek.getFullYear() !== startOfWeek.getFullYear() ? 'numeric' : undefined
                    })}`;
                break;
            }
            case 'month':
                currentDateElement.textContent = currentDate.toLocaleDateString('id-ID', {
                    month: 'long', year: 'numeric'
                });
                break;
        }
    }

    function switchView(view) {
        currentView = view;
        viewOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.view === view);
        });
        renderCalendar();
    }

    function navigatePrevious() {
        switch (currentView) {
            case 'day': currentDate.setDate(currentDate.getDate() - 1); break;
            case 'week': currentDate.setDate(currentDate.getDate() - 7); break;
            case 'month': currentDate.setDate(1); currentDate.setMonth(currentDate.getMonth() - 1); break;
        }
        renderCalendar();
    }

    function navigateNext() {
        switch (currentView) {
            case 'day': currentDate.setDate(currentDate.getDate() + 1); break;
            case 'week': currentDate.setDate(currentDate.getDate() + 7); break;
            case 'month': currentDate.setDate(1); currentDate.setMonth(currentDate.getMonth() + 1); break;
        }
        renderCalendar();
    }

    function goToToday() {
        currentDate = new Date();
        renderCalendar();
    }

    function openEventModal() {
        editingEventId = null;
        if (formTitle) formTitle.textContent = 'Tambah Acara Baru';
        eventForm.reset();
        eventDateInput.value = dateKey(currentDate);
        eventStartTimeInput.value = '09:00';
        eventEndTimeInput.value = '10:00';
        eventColorInput.value = '#4e73df';
        eventModal.style.display = 'flex';
    }

    function openEventModalWithTime(hour) {
        openEventModal();
        eventStartTimeInput.value = `${hour.toString().padStart(2, '0')}:00`;
        eventEndTimeInput.value = `${Math.min(hour + 1, 23).toString().padStart(2, '0')}:${hour === 23 ? '59' : '00'}`;
    }

    function closeModals() {
        eventModal.style.display = 'none';
        eventDetailsModal.style.display = 'none';
    }

    function buildDateTime(dateStr, timeStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const [hh, mm] = timeStr.split(':').map(Number);
        return new Date(y, m - 1, d, hh, mm);
    }

    function saveEvent(e) {
        e.preventDefault();

        const startDateTime = buildDateTime(eventDateInput.value, eventStartTimeInput.value);
        const endDateTime = buildDateTime(eventDateInput.value, eventEndTimeInput.value);
        const alarmOn = eventAlarmInput ? eventAlarmInput.checked : false;
        const alarmBefore = eventAlarmBeforeSelect ? (parseInt(eventAlarmBeforeSelect.value, 10) || 0) : 0;

        if (editingEventId) {
            const ev = events.find(x => x.id === editingEventId);
            if (ev) {
                ev.title = eventTitleInput.value;
                ev.startTime = startDateTime.toISOString();
                ev.endTime = endDateTime.toISOString();
                ev.description = eventDescriptionInput.value;
                ev.color = eventColorInput.value;
                ev.alarm = alarmOn;
                ev.alarmBefore = alarmBefore;
                markPastAlarmFired(ev);
            }
            editingEventId = null;
        } else {
            const newEvent = {
                id: Date.now().toString(),
                title: eventTitleInput.value,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                description: eventDescriptionInput.value,
                color: eventColorInput.value,
                alarm: alarmOn,
                alarmBefore: alarmBefore
            };
            events.push(newEvent);
            markPastAlarmFired(newEvent); // jangan bunyikan alarm untuk waktu yang sudah lewat
        }

        // Minta izin notifikasi saat pertama kali membuat acara beralarm (harus dari aksi pengguna)
        if (alarmOn && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(updateNotifButton).catch(() => {});
        }

        saveEventsToStorage();
        renderCalendar();
        renderEventsList();
        closeModals();
    }

    function showEventDetails(eventId) {
        const event = events.find(e => e.id === eventId);
        if (!event) return;

        selectedEventId = eventId;

        detailsTitle.textContent = event.title;
        detailsDate.textContent = new Date(event.startTime).toLocaleDateString('id-ID', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
        });
        detailsTime.textContent = `${formatTime(new Date(event.startTime))} - ${formatTime(new Date(event.endTime))}`;
        detailsDescription.textContent = event.description || 'Tidak ada deskripsi';
        if (detailsAlarm) {
            detailsAlarm.textContent = event.alarm
                ? (event.alarmBefore ? `Alarm ${event.alarmBefore} menit sebelumnya` : 'Alarm tepat waktu')
                : 'Alarm mati';
        }

        eventDetailsModal.style.display = 'flex';
    }

    function editEvent() {
        if (!selectedEventId) return;

        const event = events.find(e => e.id === selectedEventId);
        if (!event) return;

        editingEventId = selectedEventId;
        if (formTitle) formTitle.textContent = 'Edit Acara';

        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);

        eventTitleInput.value = event.title;
        eventDateInput.value = dateKey(startDate);
        eventStartTimeInput.value = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
        eventEndTimeInput.value = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
        eventDescriptionInput.value = event.description || '';
        eventColorInput.value = event.color;
        if (eventAlarmInput) eventAlarmInput.checked = !!event.alarm;
        if (eventAlarmBeforeSelect) eventAlarmBeforeSelect.value = String(event.alarmBefore || 0);

        closeModals();
        eventModal.style.display = 'flex';
    }

    function deleteEvent() {
        if (!selectedEventId) return;

        if (confirm('Yakin ingin menghapus acara ini?')) {
            events = events.filter(event => event.id !== selectedEventId);
            saveEventsToStorage();
            renderCalendar();
            renderEventsList();
            closeModals();
        }
    }

    function saveEventsToStorage() {
        localStorage.setItem('events', JSON.stringify(events));
    }

    // Helper functions
    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function formatTime(date) {
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    function formatDateTime(startDate, endDate) {
        const isSameDay = startDate.toDateString() === endDate.toDateString();
        const fmt = d => d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });

        if (isSameDay) {
            return `${fmt(startDate)} • ${formatTime(startDate)} - ${formatTime(endDate)}`;
        }
        return `${fmt(startDate)} ${formatTime(startDate)} - ${fmt(endDate)} ${formatTime(endDate)}`;
    }

});