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
    // Google Calendar "Hari Libur di Indonesia". Kunci ini dibatasi (HTTP referrer + hanya Calendar API) di Google Cloud.
    const GOOGLE_API_KEY = 'AIzaSyB8x1hS9-MEsgxn81zGR_4aYk2PH89tJmQ';
    const GOOGLE_HOLIDAY_CAL = 'id.indonesian#holiday@group.v.calendar.google.com';
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
    let piketWho = localStorage.getItem('piketWho') || '';           // '' = mati, 'all' = semua, atau satu nama
    let piketBefore = Number(localStorage.getItem('piketBefore')) || 0; // menit sebelum slot dimulai

    // Waktu solat. Sumber utama: MyQuran (jadwal resmi Kemenag RI, Kota Jakarta).
    // Cadangan: Aladhan (metode 20 = Kemenag RI) memakai koordinat Semper Barat.
    const PRAYER_PLACE = 'Semper Barat, Jakarta Utara';
    const PRAYER_LAT = -6.1269;
    const PRAYER_LNG = 106.9333;
    const PRAYER_CITY_ID = 1301;               // KOTA JAKARTA di MyQuran
    const PRAYER_CACHE_KEY = 'prayer_times_v1';
    const PRAYERS = [
        { key: 'subuh', name: 'Subuh', icon: '馃寣' },
        { key: 'dzuhur', name: 'Dzuhur', icon: '鈽�锔�' },
        { key: 'ashar', name: 'Ashar', icon: '馃尋锔�' },
        { key: 'maghrib', name: 'Maghrib', icon: '馃寚' },
        { key: 'isya', name: 'Isya', icon: '馃寵' }
    ];
    const PRAYER_DEFAULTS = {
        master: true, sound: true, notif: true, before: 0, volume: 80,
        on: { subuh: true, dzuhur: true, ashar: true, maghrib: true, isya: true }
    };
    let prayerSettings = readPrayerSettings();
    let prayerTimes = readJSON(PRAYER_CACHE_KEY, {}); // { 'YYYY-MM-DD': { subuh: '04:13', ..., src: 'myquran' } }
    let prayerSound = null;                           // { name, url, start, end }
    let prayerViewDate = null;                        // tanggal yang sedang dilihat di popup (null = hari ini)
    let prayerState = '';                             // '', 'loading', 'ok', 'fail'
    let prayerLoading = false;
    let prayerLastSig = '';

    // Lampiran catatan (state; fungsinya ada di bagian bawah)
    const ATT_MAX_FILES = 30;
    const attUrlCache = new Map();           // id -> object URL
    let editFiles = [];                      // lampiran pada editor: { id, name, type, size, blob?, url? }
    let editRemoved = [];                    // id lampiran lama yang dihapus di editor
    let attSaving = false;


    // Kondisi udara & cuaca (state; fungsinya ada di bagian bawah)
    const WX_LAT = -6.12, WX_LON = 106.92;          // Semper Barat, Jakarta Utara
    const WX_KEY = 'weather_v1';
    const WX_TTL = 30 * 60 * 1000;
    let wxData = null;

    const WX_CODES = {
        0: ['鈽�锔�', 'Cerah'], 1: ['馃尋锔�', 'Cerah berawan'], 2: ['鉀�', 'Berawan sebagian'], 3: ['鈽侊笍', 'Berawan'],
        45: ['馃尗锔�', 'Kabut'], 48: ['馃尗锔�', 'Kabut'],
        51: ['馃對锔�', 'Gerimis ringan'], 53: ['馃對锔�', 'Gerimis'], 55: ['馃對锔�', 'Gerimis lebat'],
        56: ['馃對锔�', 'Gerimis beku'], 57: ['馃對锔�', 'Gerimis beku'],
        61: ['馃導锔�', 'Hujan ringan'], 63: ['馃導锔�', 'Hujan sedang'], 65: ['馃導锔�', 'Hujan lebat'],
        66: ['馃導锔�', 'Hujan beku'], 67: ['馃導锔�', 'Hujan beku'],
        80: ['馃對锔�', 'Hujan lokal ringan'], 81: ['馃導锔�', 'Hujan lokal'], 82: ['鉀堬笍', 'Hujan lokal lebat'],
        95: ['鉀堬笍', 'Badai petir'], 96: ['鉀堬笍', 'Petir & es'], 99: ['鉀堬笍', 'Petir & es lebat']
    };

    // Catatan harian: { 'YYYY-MM-DD': [ { id, title, body, color, pinned, done, createdAt, updatedAt } ] }
    const NOTES_KEY = 'dailyNotes_v1';
    const NOTE_COLORS = [
        { v: '#4e73df', n: 'Biru' }, { v: '#1cc88a', n: 'Hijau' }, { v: '#f6c23e', n: 'Kuning' },
        { v: '#e74a3b', n: 'Merah' }, { v: '#6f42c1', n: 'Ungu' }, { v: '#858796', n: 'Abu-abu' }
    ];
    let notes = readNotes();
    let notesFilter = { q: '', mode: 'all' };
    let editingNote = null;                    // { key, id } saat mengedit, null saat menambah

    const baseTitle = document.title;
    let holidays = readHolidayCache();

    init();

    function init() {
        renderCalendar();
        renderEventsList();
        setupEventListeners();
        loadHolidays();
        initAlarms();
        initPiketAlarm();
        initPrayer();
        initNotes();
        initWeather();

        // Tahun di footer mengikuti tahun berjalan
        const footerYear = document.getElementById('footer-year');
        if (footerYear) footerYear.textContent = new Date().getFullYear();
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
        Promise.allSettled([fetchGoogleHolidays(), fetchHolidayJson()])
            .then(([g, o]) => {
                if (g.status !== 'fulfilled' && o.status !== 'fulfilled') throw new Error('Semua sumber hari libur gagal');
                if (g.status !== 'fulfilled') console.warn('Google hari libur gagal:', g.reason);
                const map = {};
                if (o.status === 'fulfilled') {
                    o.value.data.forEach(h => {
                        map[h.date] = h.name + (h.is_cuti_bersama ? ' (Cuti Bersama)' : '');
                    });
                }
                if (g.status === 'fulfilled') Object.assign(map, g.value);   // data Google diutamakan
                holidays = Object.assign({}, readHolidayCache(), map);
                try { localStorage.setItem(HOLIDAY_CACHE_KEY, JSON.stringify(holidays)); } catch (e) {}
                showHolidayStatus(null);
                renderCalendar();
            })
            .catch(err => {
                console.warn(err);
                showHolidayStatus(Object.keys(holidays).length
                    ? '鈿� Hari libur: memakai data tersimpan'
                    : '鈿� Hari libur gagal dimuat');
            });
    }

    // Ambil libur dari Google Calendar: 2 tahun ke belakang sampai 3 tahun ke depan
    function fetchGoogleHolidays() {
        if (!GOOGLE_API_KEY) return Promise.reject(new Error('Kunci Google kosong'));
        const y = new Date().getFullYear();
        const url = 'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(GOOGLE_HOLIDAY_CAL) + '/events' +
            '?key=' + encodeURIComponent(GOOGLE_API_KEY) +
            '&timeMin=' + encodeURIComponent((y - 2) + '-01-01T00:00:00Z') +
            '&timeMax=' + encodeURIComponent((y + 3) + '-12-31T23:59:59Z') +
            '&singleEvents=true&orderBy=startTime&maxResults=2500';
        // Kirim alamat halaman lengkap sebagai referrer supaya cocok dengan batasan kunci yang memakai path
        return fetch(url, { referrerPolicy: 'no-referrer-when-downgrade' })
            .then(res => {
                if (!res.ok) throw new Error('Google HTTP ' + res.status);
                return res.json();
            })
            .then(json => {
                const items = (json.items || []).filter(ev => ev.start && ev.start.date && ev.summary);
                // Buang "peringatan" (observance) yang bukan hari libur, kecuali jika semuanya terbuang
                const real = items.filter(ev => !/^\s*(observance|hari peringatan)/i.test(ev.description || ''));
                const list = real.length ? real : items;
                const map = {};
                list.forEach(ev => {
                    const [sy, sm, sd] = ev.start.date.split('-').map(Number);
                    const [ey, em, ed] = (ev.end && ev.end.date ? ev.end.date : ev.start.date).split('-').map(Number);
                    const last = ev.end && ev.end.date ? new Date(ey, em - 1, ed - 1) : new Date(sy, sm - 1, sd);
                    for (let d = new Date(sy, sm - 1, sd); d <= last; d.setDate(d.getDate() + 1)) {
                        map[dateKey(d)] = ev.summary;
                    }
                });
                if (!Object.keys(map).length) throw new Error('Data Google kosong');
                return map;
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
        return ((diff % A_INTERVAL) + A_INTERVAL) % A_INTERVAL === 0;   // juga berlaku mundur ke tanggal sebelum A_START
    }

    // Baris (minggu) ke-berapa dalam grid bulan (mulai Minggu), 1-based
    function getWeekRowInMonth(date) {
        const first = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return Math.floor((first + date.getDate() - 1) / 7) + 1;
    }

    // Cadangan (C): saat hari Minggu bersiklus A (masuk) jatuh di minggu ke-2, 3, atau 4 bulannya
    // (minggu 1 = tgl 1-7, minggu 2 = 8-14, minggu 3 = 15-21, minggu 4 = 22-28), maka Selasa-nya cadangan.
    // Siklus A berulang tiap 21 hari, jadi setiap bulan pasti tepat ada satu cadangan.
    function isCadanganSunday(sunday) {
        const d = sunday.getDate();
        return d >= 8 && d <= 28;
    }

    function hasA(date) {
        if (isCycleA(date)) return true;
        if (date.getDay() === 2) {
            const sunday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 2);
            if (isCycleA(sunday) && sunday.getDay() === 0 && isCadanganSunday(sunday)) return true;
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
        return PIKET_SLOTS.map((time, i) => {
            const people = group[(((i - step) % 3) + 3) % 3];
            return { time, people, names: people.join(' & ') };
        });
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
            ? `<strong>Piket</strong> ${slot.time} 鈥� ${escapeHtml(slot.names)}`
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
        // Selasa setelah Minggu (baris 2-4) yang jatuh pada siklus A = huruf "C" (cadangan)
        const isC = !!date && !isCycleA(date);
        badge.className = 'a-badge' + (isC ? ' c-badge' : '');
        badge.textContent = isC ? 'C' : 'A';
        if (isC) { badge.title = 'Cadangan bulan ini'; return badge; }
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

    async function exportData() {
        let attachments = {};
        let attNote = '';
        try { attachments = await collectAttachmentsForExport(); } catch (e) { attNote = ' (lampiran tidak ikut: terlalu besar)'; }
        const payload = {
            app: 'kalender-acara',
            version: 1,
            exportedAt: new Date().toISOString(),
            events,
            notes,
            attachments
        };
        let blob;
        try {
            blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        } catch (e) {
            payload.attachments = {};
            attNote = ' (lampiran tidak ikut: terlalu besar untuk satu file backup)';
            blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kalender-backup-${dateKey(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showBackupStatus(`鉁� ${events.length} acara dan ${countAllNotes()} catatan diekspor.` + attNote);
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
        reader.onload = async () => {
            let parsed;
            try {
                parsed = JSON.parse(reader.result);
            } catch (err) {
                showBackupStatus('File bukan JSON yang valid.', true);
                return;
            }

            const noteSource = parsed && !Array.isArray(parsed) && parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : null;
            const list = Array.isArray(parsed) ? parsed
                : parsed && Array.isArray(parsed.events) ? parsed.events
                : noteSource ? [] : null;
            if (!Array.isArray(list)) {
                showBackupStatus('Format backup tidak dikenali.', true);
                return;
            }

            const valid = list.map(sanitizeEvent).filter(Boolean);
            const existingIds = new Set(events.map(ev => ev.id));
            const fresh = valid.filter(ev => !existingIds.has(ev.id));

            const freshNotes = collectImportNotes(noteSource);
            const ok = confirm(
                `Ditemukan ${valid.length} acara di file ini:\n` +
                `鈥� ${fresh.length} acara baru akan ditambahkan\n` +
                `鈥� ${valid.length - fresh.length} acara sudah ada (dilewati)\n` +
                (noteSource ? `鈥� ${freshNotes.length} catatan baru akan ditambahkan\n` : '') + '\n' +
                'Data yang sudah ada di kalender tidak akan dihapus. Lanjutkan?'
            );
            if (!ok) return;

            events = events.concat(fresh);
            fresh.forEach(markPastAlarmFired);
            saveEventsToStorage();
            await restoreImportedAttachments(freshNotes, parsed && parsed.attachments);
            freshNotes.forEach(x => { (notes[x.key] = notes[x.key] || []).push(x.note); });
            if (freshNotes.length) saveNotes();

            renderCalendar();
            renderEventsList();
            renderNotesPanel();
            showBackupStatus(`鉁� ${fresh.length} acara` + (noteSource ? ` dan ${freshNotes.length} catatan` : '') + ' berhasil dipulihkan.');
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

    async function readSoundRecord(key, old) {
        let next = null;
        try {
            const rec = await idbRequest('readonly', store => store.get(key));
            if (rec && rec.blob) {
                next = { name: rec.name, url: URL.createObjectURL(rec.blob), start: rec.start || 0, end: rec.end || null };
            }
        } catch (e) { /* tanpa IndexedDB: pakai nada bawaan */ }
        if (old && old.url) URL.revokeObjectURL(old.url);
        return next;
    }

    function soundLabel(snd, fallback) {
        return snd
            ? `馃幍 ${snd.name} (${fmtTime(snd.start)} 鈥� ${snd.end ? fmtTime(snd.end) : 'akhir'})`
            : fallback;
    }

    // Memuat nada alarm acara dan nada solat (disimpan terpisah)
    async function loadCustomSound() {
        customSound = await readSoundRecord('alarmSound', customSound);
        prayerSound = await readSoundRecord('prayerSound', prayerSound);
        if (alarmSoundName) alarmSoundName.textContent = soundLabel(customSound, '馃幍 Nada bawaan (lonceng)');
        const prayerName = document.getElementById('prayer-sound-name');
        if (prayerName) prayerName.textContent = soundLabel(prayerSound, '馃晫 Nada bawaan (lembut)');
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
        const prayerPreview = !!(ringer && ringer.preview && ringer.kind === 'prayer');
        if (alarmTestBtn) alarmTestBtn.textContent = ringer && ringer.preview && !prayerPreview ? '鈴� Stop' : '鈻� Coba';
        const prayerTest = document.getElementById('prayer-test-btn');
        if (prayerTest) prayerTest.textContent = prayerPreview ? '鈴� Stop' : '鈻� Coba';
    }

    // Menyalakan suara + getar. Berulang terus sampai alarm dimatikan / ditunda.
    function startSound() {
        const isPrayer = !!ringer && ringer.kind === 'prayer';
        // Alarm solat dengan suara dimatikan: hanya popup/notifikasi (cuplikan "Coba" tetap berbunyi)
        if (isPrayer && !prayerSettings.sound && !ringer.preview) return;
        const volume = (isPrayer ? prayerSettings.volume : alarmVolume) / 100;
        const snd = isPrayer ? prayerSound : customSound;

        if (snd) {
            const { start, end, url } = snd;
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
            const chime = isPrayer ? playPrayerChimeOnce : playChimeOnce;
            chime(volume);
            ringer.timer = setInterval(() => chime(volume), isPrayer ? 4500 : 2200);
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
    function startRinging(preview, kind) {
        stopRinging();
        ringer = { preview: !!preview, kind: kind || 'event' };
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
        if (checkPiketAlarms(now, fired)) changed = true;
        if (checkPrayerAlarms(now, fired)) changed = true;
        if (changed) writeJSON('alarmFired', fired);

        const snoozes = readJSON('alarmSnoozes', []);
        if (snoozes.length) {
            const due = snoozes.filter(sn => sn.at <= now);
            if (due.length) {
                writeJSON('alarmSnoozes', snoozes.filter(sn => sn.at > now));
                due.forEach(sn => {
                    const ev = events.find(e => e.id === sn.id) ||
                        (String(sn.id).startsWith('piket-') ? makePiketEvent(Number(String(sn.id).slice(6))) : null) ||
                        (String(sn.id).startsWith('solat-') ? makePrayerEventById(String(sn.id)) : null);
                    if (ev) triggerAlarm(ev);
                });
            }
        }
    }

    // ===== Alarm piket malam =====
    // Jadwal piket dihitung dari siklus A (lihat getPiket). Alarm berbunyi di awal tiap slot
    // (00.00, 02.00, 04.00) untuk nama yang dipilih, atau semua slot bila memilih "Semua orang".
    function allPiketNames() {
        return PIKET_GROUP_1.flat().concat(PIKET_GROUP_2.flat());
    }

    // Slot piket yang berawal dari kemarin sampai `days` hari ke depan
    function piketSlots(fromDate, days) {
        const out = [];
        for (let off = -1; off <= days; off++) {
            const cycle = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + off);
            const piket = getPiket(cycle);
            if (!piket) continue;
            piket.forEach((slot, i) => {
                out.push({
                    startMs: new Date(cycle.getFullYear(), cycle.getMonth(), cycle.getDate() + 1, i * 2).getTime(),
                    time: slot.time,
                    names: slot.names,
                    people: slot.people
                });
            });
        }
        return out;
    }

    function piketMatches(slot, who) {
        return who === 'all' || slot.people.includes(who);
    }

    // Bentuk "acara" sementara supaya popup alarm yang sama bisa dipakai
    function makePiketEvent(startMs) {
        const start = new Date(startMs);
        const cycle = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1);
        const piket = getPiket(cycle);
        const slot = piket && piket[Math.floor(start.getHours() / 2)];
        if (!slot) return null;
        return {
            id: 'piket-' + startMs,
            title: '馃寵 Piket ' + slot.time,
            startTime: start.toISOString(),
            endTime: new Date(startMs + 2 * 3600000).toISOString(),
            description: 'Bertugas: ' + slot.names,
            color: '#6f42c1',
            alarm: true,
            alarmBefore: 0
        };
    }

    function checkPiketAlarms(now, fired) {
        if (!piketWho) return false;
        let changed = false;
        piketSlots(new Date(now), 1).forEach(slot => {
            if (!piketMatches(slot, piketWho)) return;
            const at = slot.startMs - piketBefore * 60000;
            const key = 'piket-' + slot.startMs + '@' + at;
            if (now >= at && now - at <= ALARM_CATCHUP_MS && !fired[key]) {
                fired[key] = now;
                changed = true;
                const ev = makePiketEvent(slot.startMs);
                if (ev) triggerAlarm(ev);
            }
        });
        return changed;
    }

    // Saat pengaturan diubah, alarm yang waktunya sudah lewat tidak boleh langsung berbunyi
    function markPiketPastFired() {
        const now = Date.now();
        const fired = getFired();
        piketSlots(new Date(now), 1).forEach(slot => {
            const at = slot.startMs - piketBefore * 60000;
            if (at <= now) fired['piket-' + slot.startMs + '@' + at] = now;
        });
        writeJSON('alarmFired', fired);
    }

    function updatePiketNext() {
        const el = document.getElementById('piket-next');
        if (!el) return;
        if (!piketWho) {
            el.textContent = 'Alarm piket mati.';
            return;
        }
        const now = Date.now();
        const slot = piketSlots(new Date(now), 40).find(s => piketMatches(s, piketWho) && s.startMs + 2 * 3600000 > now);
        if (!slot) {
            el.textContent = 'Belum ada jadwal piket dalam 40 hari ke depan.';
            return;
        }
        const d = new Date(slot.startMs);
        el.textContent = (piketWho === 'all' ? 'Piket berikutnya: ' : 'Piket berikutnya untuk ' + piketWho + ': ') +
            d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) +
            ' 鈥� ' + slot.time + (piketWho === 'all' ? ' (' + slot.names + ')' : '');
    }

    function initPiketAlarm() {
        const whoSel = document.getElementById('piket-who');
        const beforeSel = document.getElementById('piket-before');
        if (!whoSel || !beforeSel) return;

        [['Grup 1', PIKET_GROUP_1], ['Grup 2', PIKET_GROUP_2]].forEach(([label, groups]) => {
            const og = document.createElement('optgroup');
            og.label = label;
            groups.flat().forEach(name => {
                const o = document.createElement('option');
                o.value = name;
                o.textContent = name;
                og.appendChild(o);
            });
            whoSel.appendChild(og);
        });

        if (!['', 'all'].concat(allPiketNames()).includes(piketWho)) piketWho = '';
        if (![0, 5, 10, 15, 30, 60].includes(piketBefore)) piketBefore = 0;
        whoSel.value = piketWho;
        beforeSel.value = String(piketBefore);

        whoSel.addEventListener('change', () => {
            piketWho = whoSel.value;
            try { localStorage.setItem('piketWho', piketWho); } catch (e) {}
            markPiketPastFired();
            updatePiketNext();
            // Izin notifikasi harus diminta dari aksi pengguna
            if (piketWho && 'Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().then(updateNotifButton).catch(() => {});
            }
            showAlarmStatus(piketWho
                ? '鉁� Alarm piket aktif untuk ' + (piketWho === 'all' ? 'semua orang' : piketWho) + '.'
                : 'Alarm piket dimatikan.');
        });

        beforeSel.addEventListener('change', () => {
            piketBefore = Number(beforeSel.value) || 0;
            try { localStorage.setItem('piketBefore', String(piketBefore)); } catch (e) {}
            markPiketPastFired();
            updatePiketNext();
        });

        updatePiketNext();
        setInterval(updatePiketNext, 60000);
    }

    // ===== Catatan harian =====
    function newNoteId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

    function sanitizeNote(n) {
        if (!n || typeof n !== 'object') return null;
        const title = String(n.title || '').slice(0, 80);
        const body = String(n.body || '').slice(0, 2000);
        const files = sanitizeFiles(n.files);
        if (!title.trim() && !body.trim() && !files.length) return null;
        const created = Number(n.createdAt) || Date.now();
        return {
            id: String(n.id || newNoteId()),
            title, body,
            color: NOTE_COLORS.some(c => c.v === n.color) ? n.color : NOTE_COLORS[0].v,
            pinned: !!n.pinned,
            done: !!n.done,
            files,
            createdAt: created,
            updatedAt: Number(n.updatedAt) || created
        };
    }

    function readNotes() {
        const raw = readJSON(NOTES_KEY, {});
        const out = {};
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
        Object.keys(raw).forEach(k => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !Array.isArray(raw[k])) return;
            const list = raw[k].map(sanitizeNote).filter(Boolean);
            if (list.length) out[k] = list;
        });
        return out;
    }

    function saveNotes() { writeJSON(NOTES_KEY, notes); }

    function sortedNotes(key) {
        return (notes[key] || []).slice().sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (a.createdAt - b.createdAt));
    }

    function noteCount(key) { return (notes[key] || []).length; }

    function countAllNotes() {
        return Object.keys(notes).reduce((sum, k) => sum + notes[k].length, 0);
    }

    // Catatan dari file backup yang belum ada di perangkat ini
    function collectImportNotes(source) {
        if (!source) return [];
        const have = new Set();
        Object.keys(notes).forEach(k => notes[k].forEach(n => have.add(n.id)));
        const out = [];
        Object.keys(source).forEach(k => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !Array.isArray(source[k])) return;
            source[k].map(sanitizeNote).filter(Boolean).forEach(n => {
                if (!have.has(n.id)) { have.add(n.id); out.push({ key: k, note: n }); }
            });
        });
        return out;
    }

    function noteDateLabel(key, short) {
        const [y, m, d] = key.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('id-ID', short
            ? { weekday: 'short', day: 'numeric', month: 'short' }
            : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    function noteTimeLabel(ms) {
        return new Date(ms).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    function isShown(id) {
        const el = document.getElementById(id);
        return !!el && el.style.display === 'flex';
    }

    // Gambar ulang semua tampilan yang memuat catatan (posisi scroll kalender dipertahankan)
    function refreshNotesUI() {
        const top = calendarView.scrollTop;
        renderCalendar();
        calendarView.scrollTop = top;
        renderNotesPanel();
        if (isShown('notes-book-modal')) renderNotesBook();
    }

    function removeNote(key, id) {
        notes[key] = (notes[key] || []).filter(n => n.id !== id);
        if (!notes[key].length) delete notes[key];
    }

    function patchNote(key, id, patch) {
        const n = (notes[key] || []).find(x => x.id === id);
        if (!n) return;
        Object.assign(n, patch, { updatedAt: Date.now() });
        saveNotes();
        refreshNotesUI();
    }

    function deleteNote(key, id) {
        if (!confirm('Hapus catatan ini?')) return false;
        attDeleteAll(((notes[key] || []).find(n => n.id === id) || {}).files);
        removeNote(key, id);
        saveNotes();
        refreshNotesUI();
        return true;
    }

    function createNoteBadge(date) {
        const key = dateKey(date);
        const n = noteCount(key);
        if (!n) return null;
        const badge = document.createElement('span');
        badge.className = 'note-badge';
        badge.textContent = '馃摑 ' + n;
        const first = sortedNotes(key).slice(0, 3).map(x => '鈥� ' + (x.title.trim() || x.body.trim()).slice(0, 40));
        badge.title = `${n} catatan:\n` + first.join('\n') + (n > 3 ? '\n鈥�' : '');
        return badge;
    }

    // Ikon garis (SVG) untuk tombol catatan
    function noteIcon(name) {
        const open = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
        const paths = {
            pin: '<path d="M12 17v5"/><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6z"/>',
            share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>',
            trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v5M14 11v5"/>'
        };
        return open + (paths[name] || '') + '</svg>';
    }

    function createNoteCard(note, key, opts) {
        opts = opts || {};
        const card = document.createElement('div');
        card.className = 'note-card' + (note.done ? ' done' : '') + (note.pinned ? ' pinned' : '') + (opts.compact ? ' compact' : '');
        card.style.setProperty('--note-color', note.color);

        const check = document.createElement('input');
        check.type = 'checkbox';
        check.className = 'note-check';
        check.checked = note.done;
        check.title = 'Tandai selesai';
        check.setAttribute('aria-label', 'Tandai selesai');
        check.addEventListener('click', e => e.stopPropagation());
        check.addEventListener('change', () => patchNote(key, note.id, { done: check.checked }));

        const main = document.createElement('div');
        main.className = 'note-main';
        if (note.title.trim()) {
            const t = document.createElement('div');
            t.className = 'note-title';
            t.textContent = note.title;
            main.appendChild(t);
        }
        if (note.body.trim()) {
            const b = document.createElement('div');
            b.className = 'note-body';
            b.textContent = note.body;
            main.appendChild(b);
        }
        if (note.files && note.files.length) {
            if (opts.compact) {
                const c = document.createElement('div');
                c.className = 'note-att-count';
                c.textContent = '馃搸 ' + note.files.length + ' lampiran';
                main.appendChild(c);
            } else {
                main.appendChild(createAttachmentsView(note.files, key, note.id));
            }
        }
        const meta = document.createElement('div');
        meta.className = 'note-meta';
        meta.textContent = (note.pinned ? '馃搶 ' : '') + (opts.showDate ? noteDateLabel(key, true) + ' 鈥� ' : '') +
            'Diubah ' + noteTimeLabel(note.updatedAt);
        main.appendChild(meta);

        card.appendChild(check);
        card.appendChild(main);

        if (!opts.compact) {
            const actions = document.createElement('div');
            actions.className = 'note-actions';
            const pin = document.createElement('button');
            pin.type = 'button';
            pin.className = 'note-icon-btn' + (note.pinned ? ' on' : '');
            pin.innerHTML = noteIcon('pin');
            pin.title = note.pinned ? 'Lepas sematan' : 'Sematkan di atas';
            pin.setAttribute('aria-label', pin.title);
            pin.addEventListener('click', e => { e.stopPropagation(); patchNote(key, note.id, { pinned: !note.pinned }); });
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'note-icon-btn';
            del.innerHTML = noteIcon('trash');
            del.title = 'Hapus catatan';
            del.setAttribute('aria-label', 'Hapus catatan');
            del.addEventListener('click', e => { e.stopPropagation(); deleteNote(key, note.id); });
            const share = document.createElement('button');
            share.type = 'button';
            share.className = 'note-icon-btn';
            share.innerHTML = noteIcon('share');
            share.title = 'Bagikan catatan';
            share.setAttribute('aria-label', 'Bagikan catatan');
            share.addEventListener('click', e => { e.stopPropagation(); shareNote(key, note); });
            actions.appendChild(pin);
            actions.appendChild(share);
            actions.appendChild(del);
            card.appendChild(actions);
        }

        card.title = 'Klik untuk mengedit';
        card.addEventListener('click', () => openNoteEditor(key, note.id));
        return card;
    }

    // Bagian "Catatan" di tampilan Hari
    function createDayNotesSection(date) {
        const key = dateKey(date);
        const items = sortedNotes(key);
        const sec = document.createElement('section');
        sec.className = 'notes-section';

        const head = document.createElement('div');
        head.className = 'notes-section-head';
        const title = document.createElement('div');
        title.className = 'notes-section-title';
        title.textContent = '馃摑 Catatan';
        const pill = document.createElement('span');
        pill.className = 'notes-count-pill';
        pill.textContent = items.length;
        title.appendChild(pill);
        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'note-add-btn';
        add.textContent = '锛� Tambah catatan';
        add.addEventListener('click', () => openNoteEditor(key));
        head.appendChild(title);
        head.appendChild(add);
        sec.appendChild(head);

        if (!items.length) {
            const empty = document.createElement('div');
            empty.className = 'notes-empty';
            empty.textContent = 'Belum ada catatan untuk hari ini. Tulis hal penting, ide, atau pengingat di sini.';
            sec.appendChild(empty);
        } else {
            const list = document.createElement('div');
            list.className = 'notes-list';
            items.forEach(n => list.appendChild(createNoteCard(n, key)));
            sec.appendChild(list);
        }
        return sec;
    }

    // Panel di sidebar: catatan hari ini
    function renderNotesPanel() {
        const list = document.getElementById('notes-mini-list');
        if (!list) return;
        const key = dateKey(new Date());
        renderNotesPanel.key = key;
        const items = sortedNotes(key);
        document.getElementById('notes-today-count').textContent = items.length;
        document.getElementById('notes-panel-date').textContent = noteDateLabel(key);
        list.innerHTML = '';
        if (!items.length) {
            const empty = document.createElement('div');
            empty.className = 'notes-empty';
            empty.textContent = 'Belum ada catatan hari ini.';
            list.appendChild(empty);
            return;
        }
        items.slice(0, 3).forEach(n => list.appendChild(createNoteCard(n, key, { compact: true })));
        if (items.length > 3) {
            const more = document.createElement('button');
            more.type = 'button';
            more.className = 'note-more-btn';
            more.textContent = `+${items.length - 3} catatan lainnya, lihat semua`;
            more.addEventListener('click', () => goToNoteDay(key));
            list.appendChild(more);
        }
    }

    function goToNoteDay(key) {
        const [y, m, d] = key.split('-').map(Number);
        currentDate = new Date(y, m - 1, d);
        closeNotesBook();
        switchView('day');
    }

    // Buku catatan: semua catatan, dikelompokkan per tanggal
    function renderNotesBook() {
        const list = document.getElementById('notes-book-list');
        const summary = document.getElementById('notes-summary');
        if (!list) return;
        const q = notesFilter.q.trim().toLowerCase();
        const thisMonth = dateKey(new Date()).slice(0, 7);
        const todayKey = dateKey(new Date());
        list.innerHTML = '';
        document.querySelectorAll('#notes-chips .note-chip').forEach(c =>
            c.classList.toggle('active', c.dataset.mode === notesFilter.mode));

        let total = 0;
        let days = 0;
        Object.keys(notes).sort().reverse().forEach(key => {
            const items = sortedNotes(key).filter(n => {
                if (notesFilter.mode === 'pinned' && !n.pinned) return false;
                if (notesFilter.mode === 'open' && n.done) return false;
                if (notesFilter.mode === 'month' && !key.startsWith(thisMonth)) return false;
                if (q && !(n.title + ' ' + n.body).toLowerCase().includes(q)) return false;
                return true;
            });
            if (!items.length) return;
            total += items.length;
            days++;

            const group = document.createElement('div');
            group.className = 'notes-group';
            const head = document.createElement('button');
            head.type = 'button';
            head.className = 'notes-group-head';
            head.title = 'Buka tampilan hari ini';
            const label = document.createElement('span');
            label.textContent = noteDateLabel(key) + (key === todayKey ? ' 鈥� Hari ini' : '');
            const count = document.createElement('span');
            count.className = 'notes-count-pill';
            count.textContent = items.length;
            head.appendChild(label);
            head.appendChild(count);
            head.addEventListener('click', () => goToNoteDay(key));
            group.appendChild(head);
            items.forEach(n => group.appendChild(createNoteCard(n, key)));
            list.appendChild(group);
        });

        if (!total) {
            const empty = document.createElement('div');
            empty.className = 'notes-empty big';
            empty.textContent = countAllNotes()
                ? 'Tidak ada catatan yang cocok dengan pencarian atau filter ini.'
                : 'Belum ada catatan. Tekan "锛� Catatan" untuk mulai menulis.';
            list.appendChild(empty);
        }
        summary.textContent = total ? `${total} catatan di ${days} hari` : '';
    }

    function openNotesBook() {
        notesFilter = { q: '', mode: 'all' };
        document.getElementById('notes-search').value = '';
        renderNotesBook();
        document.getElementById('notes-book-modal').style.display = 'flex';
    }

    function closeNotesBook() {
        const m = document.getElementById('notes-book-modal');
        if (m) m.style.display = 'none';
    }

    // Editor catatan (tambah / edit)
    function openNoteEditor(key, id) {
        const $ = x => document.getElementById(x);
        const existing = id ? (notes[key] || []).find(n => n.id === id) : null;
        editingNote = existing ? { key, id } : null;
        $('note-form-title').textContent = existing ? 'Edit catatan' : 'Tambah catatan';
        $('note-date').value = key || dateKey(new Date());
        $('note-title').value = existing ? existing.title : '';
        $('note-body').value = existing ? existing.body : '';
        $('note-pinned').checked = existing ? existing.pinned : false;
        const color = existing ? existing.color : NOTE_COLORS[0].v;
        document.querySelectorAll('input[name="note-color"]').forEach(r => { r.checked = r.value === color; });
        $('note-counter').textContent = `${$('note-body').value.length} / 2000`;
        $('note-error').textContent = '';
        $('note-delete').hidden = !existing;
        attEditInit(existing);
        $('note-modal').style.display = 'flex';
        setTimeout(() => { try { (existing ? $('note-body') : $('note-title')).focus(); } catch (e) {} }, 50);
    }

    function closeNoteEditor() {
        const m = document.getElementById('note-modal');
        if (m) m.style.display = 'none';
        editingNote = null;
        attEditReset();
    }

    async function saveNoteFromForm() {
        if (attSaving) return;
        const $ = x => document.getElementById(x);
        const title = $('note-title').value.trim();
        const body = $('note-body').value.replace(/\s+$/, '');
        if (!title && !body.trim() && !editFiles.length) {
            $('note-error').textContent = 'Isi judul, catatan, atau lampiran dulu.';
            return;
        }
        const key = $('note-date').value || dateKey(new Date());
        const picked = document.querySelector('input[name="note-color"]:checked');
        const now = Date.now();
        if (editFiles.some(f => f.pending)) {
            $('note-error').textContent = 'Tunggu proses lampiran selesai dulu.';
            return;
        }
        // Simpan lampiran baru lebih dulu; jika gagal, catatan tidak diubah
        attSaving = true;
        const saveBtn = document.querySelector('#note-form .note-save-btn');
        const saveLabel = saveBtn.textContent;
        const todo = editFiles.filter(f => f.blob);
        const totalBytes = todo.reduce((a, f) => a + f.size, 0) || 1;
        let savedBytes = 0;
        saveBtn.disabled = true;
        try {
            for (const f of todo) {
                saveBtn.textContent = `Menyimpan鈥� ${Math.round(savedBytes / totalBytes * 100)}%`;
                await attPut(f.id, f.blob, f.name, f.type);
                savedBytes += f.size;
            }
            saveBtn.textContent = todo.length ? 'Menyimpan鈥� 100%' : saveLabel;
            saveBtn.disabled = false;
            saveBtn.textContent = saveLabel;
        } catch (e) {
            saveBtn.disabled = false;
            saveBtn.textContent = saveLabel;
            attSaving = false;
            $('note-error').textContent = 'Lampiran gagal disimpan (penyimpanan perangkat penuh atau dibatasi browser).';
            return;
        }
        editRemoved.forEach(id => attDelete(id));
        const savedFiles = editFiles.map(f => ({ id: f.id, name: f.name, type: f.type, size: f.size }));
        attSaving = false;
        let base = { id: newNoteId(), createdAt: now, done: false };
        if (editingNote) {
            const old = (notes[editingNote.key] || []).find(n => n.id === editingNote.id);
            if (old) {
                base = { id: old.id, createdAt: old.createdAt, done: old.done };
                removeNote(editingNote.key, old.id);
            }
        }
        const note = Object.assign(base, {
            title, body,
            color: picked ? picked.value : NOTE_COLORS[0].v,
            pinned: $('note-pinned').checked,
            files: savedFiles,
            updatedAt: now
        });
        (notes[key] = notes[key] || []).push(note);
        saveNotes();
        closeNoteEditor();
        refreshNotesUI();
    }

    // ===== Lampiran catatan (foto & file) =====
    // Metadata ada di catatan (note.files); isi filenya di IndexedDB dengan kunci "att:<id>".
    function attPut(id, blob, name, type) { return idbRequest('readwrite', s => s.put({ blob, name, type }, 'att:' + id)); }
    function attGet(id) { return idbRequest('readonly', s => s.get('att:' + id)); }
    function attDelete(id) {
        const u = attUrlCache.get(id);
        if (u) { URL.revokeObjectURL(u); attUrlCache.delete(id); }
        return idbRequest('readwrite', s => s.delete('att:' + id)).catch(() => {});
    }
    function attDeleteAll(files) { (files || []).forEach(f => attDelete(f.id)); }

    function attUrl(id) {
        if (attUrlCache.has(id)) return Promise.resolve(attUrlCache.get(id));
        return attGet(id).then(rec => {
            if (!rec || !rec.blob) return null;
            const u = URL.createObjectURL(rec.blob);
            attUrlCache.set(id, u);
            return u;
        }).catch(() => null);
    }

    function fmtSize(b) {
        if (b < 1024) return b + ' B';
        if (b < 1024 * 1024) return (b / 1024).toFixed(0) + ' KB';
        return (b / 1024 / 1024).toFixed(1) + ' MB';
    }

    function fileIcon(type, name) {
        if (/^image\//.test(type)) return '馃柤锔�';
        if (/^video\//.test(type)) return '馃幀';
        if (/^audio\//.test(type)) return '馃幍';
        if (/pdf/.test(type) || /\.pdf$/i.test(name)) return '馃摃';
        if (/sheet|excel|csv/.test(type) || /\.(xlsx?|csv)$/i.test(name)) return '馃搳';
        if (/word|document|rtf/.test(type) || /\.(docx?|rtf)$/i.test(name)) return '馃摌';
        if (/zip|rar|7z|tar/.test(type) || /\.(zip|rar|7z|tar|gz)$/i.test(name)) return '馃棞锔�';
        return '馃搫';
    }

    // Foto dikecilkan (maks 1600 px) supaya hemat tempat; file lain disimpan apa adanya
    function compressImage(file) {
        if (!/^image\/(jpeg|png|webp|heic|heif|bmp)$/i.test(file.type)) return Promise.resolve(file);
        return new Promise(resolve => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                const max = 1600;
                const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
                if (scale === 1 && file.size < 600 * 1024) return resolve(file);
                const c = document.createElement('canvas');
                c.width = Math.max(1, Math.round(img.naturalWidth * scale));
                c.height = Math.max(1, Math.round(img.naturalHeight * scale));
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                c.toBlob(b => resolve(b && b.size < file.size ? b : file), 'image/jpeg', 0.82);
            };
            img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
            img.src = url;
        });
    }

    // Warna & label jenis file (untuk ikon file selain foto)
    function fileBadge(type, name) {
        const m = /\.([A-Za-z0-9]{1,5})$/.exec(name || '');
        const ext = m ? m[1].toUpperCase() : '';
        let color = '#858796';
        if (/pdf/i.test(type) || ext === 'PDF') color = '#e74a3b';
        else if (/word|document|rtf/i.test(type) || /^(DOCX?|RTF|ODT|TXT)$/.test(ext)) color = '#2b6cb0';
        else if (/sheet|excel|csv/i.test(type) || /^(XLSX?|CSV|ODS)$/.test(ext)) color = '#1cc88a';
        else if (/presentation|powerpoint/i.test(type) || /^(PPTX?|ODP)$/.test(ext)) color = '#fd7e14';
        else if (/zip|rar|7z|tar|gzip|compressed/i.test(type) || /^(ZIP|RAR|7Z|TAR|GZ|ISO)$/.test(ext)) color = '#d97706';
        else if (/^audio\//.test(type)) color = '#6f42c1';
        else if (/^video\//.test(type)) color = '#d63384';
        return { label: ext ? ext.slice(0, 4) : (/^video\//.test(type) ? 'VID' : /^audio\//.test(type) ? 'AUD' : 'FILE'), color };
    }

    function attExists(id) {
        return idbRequest('readonly', s => s.count('att:' + id)).then(n => n > 0).catch(() => false);
    }

    // Unduh dengan indikator persen (menyiapkan file dari penyimpanan perangkat)
    async function downloadAttachment(f, setProgress) {
        try {
            const rec = await attGet(f.id);
            if (!rec || !rec.blob) { alert('File tidak ada di perangkat ini.'); return false; }
            let blob = rec.blob;
            if (setProgress) {
                setProgress(0);
                blob = await readWithProgress(rec.blob, setProgress);
                setProgress(100);
            }
            const u = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = u; a.download = f.name;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(u), 60000);
            return true;
        } catch (e) {
            alert('Gagal menyiapkan file.');
            return false;
        } finally {
            if (setProgress) setProgress(null);
        }
    }

    // File hilang dari perangkat (mis. data browser terhapus / perangkat lain): pilih file yang sama lagi
    function attRelink(f, setProgress) {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = async () => {
            const file = input.files && input.files[0];
            if (!file) return;
            try {
                setProgress && setProgress(0, 'Membaca');
                let blob = await readWithProgress(file, p => setProgress && setProgress(p, 'Membaca'));
                if (/^image\//.test(f.type)) blob = await compressImage(blob);
                await attPut(f.id, blob, f.name, f.type);
                const old = attUrlCache.get(f.id);
                if (old) { URL.revokeObjectURL(old); attUrlCache.delete(f.id); }
                refreshNotesUI();
            } catch (e) {
                alert('File gagal disimpan ulang.');
                setProgress && setProgress(null);
            }
        };
        input.click();
    }

    // Penampil foto layar penuh
    let viewerList = [], viewerIdx = 0;
    function openViewer(images, idx) {
        viewerList = images; viewerIdx = idx;
        document.getElementById('att-viewer').style.display = 'flex';
        showViewer();
    }
    function showViewer() {
        const f = viewerList[viewerIdx];
        const img = document.getElementById('att-viewer-img');
        img.removeAttribute('src');
        document.getElementById('att-viewer-name').textContent = f.name + (viewerList.length > 1 ? `  (${viewerIdx + 1}/${viewerList.length})` : '');
        document.getElementById('att-viewer-prev').hidden = document.getElementById('att-viewer-next').hidden = viewerList.length < 2;
        attUrl(f.id).then(u => { if (viewerList[viewerIdx] === f && u) img.src = u; });
    }
    function closeViewer() { document.getElementById('att-viewer').style.display = 'none'; }
    function stepViewer(d) {
        if (viewerList.length < 2) return;
        viewerIdx = (viewerIdx + d + viewerList.length) % viewerList.length;
        showViewer();
    }

    // Tampilan lampiran di kartu catatan
    function createAttachmentsView(files, key, noteId) {
        const wrap = document.createElement('div');
        wrap.className = 'att-view';
        wrap.addEventListener('click', e => e.stopPropagation());
        const images = files.filter(f => /^image\//.test(f.type));
        const others = files.filter(f => !/^image\//.test(f.type));

        // Pembuat indikator persen kecil di sebuah elemen
        function progressUI(host) {
            const bar = document.createElement('div');
            bar.className = 'att-progress';
            bar.hidden = true;
            const fill = document.createElement('div');
            fill.className = 'att-progress-fill';
            bar.appendChild(fill);
            const txt = document.createElement('small');
            txt.className = 'att-progress-text';
            txt.hidden = true;
            host.append(bar, txt);
            return (p, label) => {
                if (p == null) { bar.hidden = txt.hidden = true; return; }
                bar.hidden = txt.hidden = false;
                fill.style.width = p + '%';
                txt.textContent = (label || 'Menyiapkan') + ' ' + p + '%';
            };
        }

        function removeFromNote(f) {
            if (!confirm('Hapus lampiran "' + f.name + '" dari catatan ini?')) return;
            const n = (notes[key] || []).find(x => x.id === noteId);
            if (!n) return;
            n.files = n.files.filter(x => x.id !== f.id);
            n.updatedAt = Date.now();
            attDelete(f.id);
            saveNotes();
            refreshNotesUI();
        }

        if (images.length) {
            const grid = document.createElement('div');
            const shown = Math.min(images.length, 6);
            grid.className = 'att-thumbs n' + shown;
            images.slice(0, shown).forEach((f, i) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'att-thumb';
                b.title = f.name;
                b.setAttribute('aria-label', 'Lihat foto ' + f.name);
                const im = document.createElement('img');
                im.alt = f.name;
                im.loading = 'lazy';
                b.appendChild(im);
                const ui = progressUI(b);
                attUrl(f.id).then(u => {
                    if (u) { im.src = u; return; }
                    b.classList.add('missing');
                    b.title = 'File tidak ada di perangkat ini. Klik untuk memilih file lagi.';
                });
                b.addEventListener('click', () => {
                    if (b.classList.contains('missing')) {
                        if (confirm('Foto "' + f.name + '" tidak ada di perangkat ini.\n\nPilih file foto itu lagi dari perangkat?\n(Batal = biarkan)')) attRelink(f, ui);
                    } else openViewer(images, i);
                });
                if (i === shown - 1 && images.length > shown) {
                    const more = document.createElement('span');
                    more.className = 'att-more';
                    more.textContent = '+' + (images.length - shown + 1);
                    b.appendChild(more);
                }
                grid.appendChild(b);
            });
            wrap.appendChild(grid);
        }

        others.forEach(f => {
            const row = document.createElement('div');
            row.className = 'att-file';
            const badge = fileBadge(f.type, f.name);
            const ico = document.createElement('div');
            ico.className = 'att-file-ico';
            ico.style.setProperty('--c', badge.color);
            ico.textContent = badge.label;
            const main = document.createElement('div');
            main.className = 'att-file-main';
            const name = document.createElement('div');
            name.className = 'att-file-name';
            name.textContent = f.name;
            name.title = f.name;
            const sub = document.createElement('small');
            sub.className = 'att-file-sub';
            sub.textContent = fmtSize(f.size);
            main.append(name, sub);
            const ui = progressUI(main);
            const actions = document.createElement('div');
            actions.className = 'att-file-actions';
            const dl = document.createElement('button');
            dl.type = 'button';
            dl.className = 'att-file-btn';
            dl.textContent = '猬� Unduh';
            dl.addEventListener('click', () => { dl.disabled = true; downloadAttachment(f, ui).then(() => { dl.disabled = false; }); });
            actions.appendChild(dl);
            const sh = document.createElement('button');
            sh.type = 'button';
            sh.className = 'att-share-btn';
            sh.textContent = '馃摛 Bagikan';
            sh.addEventListener('click', () => shareFile(f));
            actions.appendChild(sh);
            row.append(ico, main, actions);
            wrap.appendChild(row);

            // Cek apakah file masih ada di perangkat ini
            attExists(f.id).then(ok => {
                if (ok) return;
                row.classList.add('missing');
                sh.remove();
                sub.textContent = '鈿� File tidak ada di perangkat ini';
                dl.textContent = '馃搧 Pilih file lagi';
                dl.onclick = null;
                const fresh = dl.cloneNode(true);
                dl.replaceWith(fresh);
                fresh.addEventListener('click', () => attRelink(f, ui));
                const del = document.createElement('button');
                del.type = 'button';
                del.className = 'att-file-btn danger';
                del.textContent = '鉁� Hapus';
                del.addEventListener('click', () => removeFromNote(f));
                actions.appendChild(del);
            });
        });
        return wrap;
    }

    // Editor: daftar lampiran yang sedang disiapkan
    function attEditInit(existing) {
        attEditReset();
        editFiles = existing && existing.files ? existing.files.map(f => Object.assign({}, f)) : [];
        renderEditFiles();
    }

    function attEditReset() {
        editFiles.forEach(f => { f.cancelled = true; if (f.url) URL.revokeObjectURL(f.url); });
        editFiles = [];
        editRemoved = [];
    }

    function renderEditFiles() {
        const list = document.getElementById('att-edit-list');
        if (!list) return;
        list.innerHTML = '';
        editFiles.forEach(f => {
            const item = document.createElement('div');
            item.className = 'att-edit-item';
            if (/^image\//.test(f.type) && !f.pending) {
                const im = document.createElement('img');
                im.alt = f.name;
                if (f.url) im.src = f.url; else attUrl(f.id).then(u => { if (u) im.src = u; });
                item.appendChild(im);
            } else {
                const ic = document.createElement('div');
                const bd = fileBadge(f.type, f.name);
                ic.className = 'att-edit-icon badge';
                ic.style.setProperty('--c', bd.color);
                ic.textContent = f.pending && /^image\//.test(f.type) ? '馃柤锔�' : bd.label;
                item.appendChild(ic);
            }
            const meta = document.createElement('div');
            meta.className = 'att-edit-meta';
            const n = document.createElement('div');
            n.className = 'att-edit-name';
            n.textContent = f.name;
            const s = document.createElement('small');
            s.textContent = fmtSize(f.size);
            meta.append(n, s);
            if (f.pending) {
                const bar = document.createElement('div');
                bar.className = 'att-progress';
                const fill = document.createElement('div');
                fill.className = 'att-progress-fill';
                bar.appendChild(fill);
                const pct = document.createElement('small');
                pct.className = 'att-progress-text';
                f.barEl = fill;
                f.pctEl = pct;
                meta.append(bar, pct);
                updatePending(f);
            }
            item.appendChild(meta);
            const rm = document.createElement('button');
            rm.type = 'button';
            rm.className = 'att-edit-remove';
            rm.textContent = '鉁�';
            rm.title = 'Hapus lampiran';
            rm.setAttribute('aria-label', 'Hapus lampiran ' + f.name);
            rm.addEventListener('click', () => {
                if (f.pending) f.cancelled = true;
                if (f.blob || f.pending) { if (f.url) URL.revokeObjectURL(f.url); } else editRemoved.push(f.id);
                editFiles = editFiles.filter(x => x !== f);
                renderEditFiles();
            });
            item.appendChild(rm);
            list.appendChild(item);
        });
        const info = document.getElementById('att-info');
        const base = editFiles.length ? `${editFiles.length} / ${ATT_MAX_FILES} lampiran` : '';
        info.textContent = base;
        try {
            if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e => {
                if (e && e.quota) info.textContent = (base ? base + ' 鈥� ' : '') + 'Ruang tersisa 卤 ' + fmtSize(Math.max(0, e.quota - (e.usage || 0)));
            });
        } catch (e) {}
    }

    // Baca file dengan indikator persen (file sangat besar dilewati agar tidak memenuhi memori)
    async function readWithProgress(file, onProgress) {
        if (!file.stream || file.size > 300 * 1024 * 1024) { onProgress(100); return file; }
        const reader = file.stream().getReader();
        const chunks = [];
        let got = 0;
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            got += value.length;
            onProgress(file.size ? Math.min(100, Math.round(got / file.size * 100)) : 100);
        }
        return new Blob(chunks, { type: file.type });
    }

    function updatePending(f) {
        if (f.barEl) f.barEl.style.width = f.progress + '%';
        if (f.pctEl) f.pctEl.textContent = f.stage + ' ' + (f.stage === 'Menunggu' ? '' : f.progress + '%');
        const pend = editFiles.filter(x => x.pending);
        const info = document.getElementById('att-info');
        if (info && pend.length) {
            const total = pend.reduce((a, x) => a + (x.size || 1), 0);
            const done = pend.reduce((a, x) => a + (x.size || 1) * x.progress / 100, 0);
            info.textContent = `Memproses ${pend.length} file鈥� ${Math.round(done / total * 100)}%`;
        }
    }

    async function attAddFiles(fileList) {
        const err = document.getElementById('note-error');
        err.textContent = '';
        // Minta browser menyimpan data situs secara permanen (tidak dibersihkan otomatis saat ruang menipis)
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
        const queue = [];
        for (const file of Array.from(fileList)) {
            if (editFiles.length >= ATT_MAX_FILES) { err.textContent = `Maksimal ${ATT_MAX_FILES} lampiran per catatan.`; break; }
            const rec = { id: newNoteId(), name: (file.name || 'foto').slice(0, 120), type: file.type || 'application/octet-stream',
                size: file.size, pending: true, progress: 0, stage: 'Menunggu' };
            editFiles.push(rec);
            queue.push({ file, rec });
        }
        renderEditFiles();
        for (const { file, rec } of queue) {
            if (rec.cancelled) continue;
            try {
                rec.stage = 'Membaca';
                updatePending(rec);
                const raw = await readWithProgress(file, p => { rec.progress = p; updatePending(rec); });
                if (rec.cancelled) continue;
                let blob = raw;
                if (/^image\//.test(rec.type)) {
                    rec.stage = 'Mengecilkan foto';
                    updatePending(rec);
                    blob = await compressImage(raw);
                }
                if (rec.cancelled) continue;
                let name = rec.name;
                if (blob !== raw && blob.type === 'image/jpeg') name = name.replace(/\.(png|webp|heic|heif|bmp)$/i, '') + (/\.jpe?g$/i.test(name) ? '' : '.jpg');
                rec.name = name;
                rec.type = blob !== raw && blob.type ? blob.type : rec.type;
                rec.size = blob.size;
                rec.blob = blob;
                rec.progress = 100;
                if (/^image\//.test(rec.type)) rec.url = URL.createObjectURL(blob);
                delete rec.pending;
            } catch (e) {
                editFiles = editFiles.filter(x => x !== rec);
                err.textContent = `"${rec.name}" gagal dibaca.`;
            }
            renderEditFiles();
        }
        renderEditFiles();
    }

    function sanitizeFiles(arr) {
        if (!Array.isArray(arr)) return [];
        return arr.slice(0, ATT_MAX_FILES).map(f => f && typeof f === 'object' && f.id ? {
            id: String(f.id).slice(0, 40),
            name: String(f.name || 'file').slice(0, 120),
            type: String(f.type || 'application/octet-stream').slice(0, 100),
            size: Math.max(0, Number(f.size) || 0)
        } : null).filter(Boolean);
    }

    function blobToDataUrl(blob) {
        return new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.onerror = () => rej(r.error);
            r.readAsDataURL(blob);
        });
    }

    async function collectAttachmentsForExport() {
        const out = {};
        for (const key of Object.keys(notes)) {
            for (const n of notes[key]) {
                for (const f of n.files || []) {
                    try {
                        const rec = await attGet(f.id);
                        if (rec && rec.blob) out[f.id] = { name: f.name, type: f.type, dataUrl: await blobToDataUrl(rec.blob) };
                    } catch (e) { /* lampiran hilang: dilewati */ }
                }
            }
        }
        return out;
    }

    // Pulihkan lampiran dari backup; lampiran yang datanya tidak ada dibuang dari catatan
    async function restoreImportedAttachments(freshNotes, source) {
        for (const x of freshNotes) {
            const kept = [];
            for (const f of x.note.files || []) {
                const a = source && source[f.id];
                if (!a || typeof a.dataUrl !== 'string') continue;
                try {
                    const blob = await (await fetch(a.dataUrl)).blob();
                    await attPut(f.id, blob, f.name, f.type);
                    kept.push(Object.assign({}, f, { size: blob.size }));
                } catch (e) { /* dilewati */ }
            }
            x.note.files = kept;
        }
    }

    // ===== Bagikan catatan / file =====
    function noteShareText(key, note) {
        const parts = [];
        if (note.title.trim()) parts.push('馃摑 ' + note.title.trim());
        parts.push('馃搮 ' + noteDateLabel(key));
        if (note.body.trim()) parts.push('', note.body.trim());
        if (note.files && note.files.length) parts.push('', '馃搸 ' + note.files.length + ' lampiran');
        return parts.join('\n');
    }

    function showToast(msg) {
        let el = document.getElementById('app-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'app-toast';
            el.className = 'app-toast';
            el.setAttribute('role', 'status');
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => el.classList.remove('show'), 4500);
    }

    async function attToFile(f) {
        const rec = await attGet(f.id);
        return rec && rec.blob ? new File([rec.blob], f.name, { type: f.type || rec.blob.type }) : null;
    }

    // Menu bagikan bawaan perangkat (WhatsApp, Instagram, TikTok, Gmail, dll.); jika tidak ada, tampilkan pilihan manual
    async function doShare(title, text, fileMetas) {
        const files = [];
        let missing = 0;
        for (const m of fileMetas || []) {
            try { const f = await attToFile(m); if (f) files.push(f); else missing++; } catch (e) { missing++; }
        }
        if (missing) showToast(`${missing} file tidak ada di perangkat ini dan tidak ikut dibagikan.`);
        if (navigator.share) {
            try {
                if (files.length && navigator.canShare && navigator.canShare({ files })) {
                    await navigator.share({ title, text, files });
                    return;
                }
                if (files.length) showToast('Perangkat ini tidak bisa membagikan file langsung, jadi hanya teks yang dibagikan.');
                await navigator.share({ title, text });
                return;
            } catch (e) {
                if (e && e.name === 'AbortError') return;      // pengguna membatalkan
            }
        }
        openShareFallback(title, text, (fileMetas || []));
    }

    function shareNote(key, note) {
        doShare(note.title.trim() || 'Catatan ' + noteDateLabel(key, true), noteShareText(key, note), note.files);
    }

    function shareFile(f) {
        doShare(f.name, f.name, [f]);
    }

    function openShareFallback(title, text, fileMetas) {
        const $ = x => document.getElementById(x);
        $('share-text').value = text;
        const enc = encodeURIComponent;
        $('share-wa').href = 'https://wa.me/?text=' + enc(text);
        $('share-tg').href = 'https://t.me/share/url?url=%20&text=' + enc(text);
        $('share-mail').href = 'mailto:?subject=' + enc(title) + '&body=' + enc(text);
        const list = $('share-files');
        list.innerHTML = '';
        if (fileMetas.length) {
            const h = document.createElement('div');
            h.className = 'att-hint';
            h.textContent = 'File tidak bisa dikirim langsung dari sini. Unduh dulu, lalu lampirkan manual di aplikasi tujuan:';
            list.appendChild(h);
            fileMetas.forEach(f => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'att-file-btn';
                b.textContent = '猬� ' + f.name;
                b.addEventListener('click', () => downloadAttachment(f, null));
                list.appendChild(b);
            });
        }
        $('share-modal').style.display = 'flex';
    }

    function closeShare() { const m = document.getElementById('share-modal'); if (m) m.style.display = 'none'; }

    function initNotes() {
        const $ = x => document.getElementById(x);
        if (!$('note-modal') || !$('notes-book-modal')) return;

        $('note-swatches').innerHTML = NOTE_COLORS.map((c, i) =>
            `<label class="note-swatch" title="${c.n}"><input type="radio" name="note-color" value="${c.v}"` +
            `${i === 0 ? ' checked' : ''}><span style="background:${c.v}"></span></label>`).join('');

        $('notes-panel-add').addEventListener('click', () => openNoteEditor(dateKey(new Date())));
        $('notes-open-book').addEventListener('click', openNotesBook);
        $('notes-book-add').addEventListener('click', () => openNoteEditor(dateKey(new Date())));
        $('notes-book-close').addEventListener('click', closeNotesBook);
        $('notes-book-modal').addEventListener('click', e => { if (e.target === $('notes-book-modal')) closeNotesBook(); });
        $('notes-search').addEventListener('input', e => { notesFilter.q = e.target.value; renderNotesBook(); });
        $('notes-chips').addEventListener('click', e => {
            const chip = e.target.closest('.note-chip');
            if (!chip) return;
            notesFilter.mode = chip.dataset.mode;
            renderNotesBook();
        });

        $('note-close').addEventListener('click', closeNoteEditor);
        $('note-cancel').addEventListener('click', closeNoteEditor);
        $('note-modal').addEventListener('click', e => { if (e.target === $('note-modal')) closeNoteEditor(); });
        $('note-form').addEventListener('submit', e => { e.preventDefault(); saveNoteFromForm(); });
        $('note-body').addEventListener('input', () => {
            $('note-counter').textContent = `${$('note-body').value.length} / 2000`;
            $('note-error').textContent = '';
        });
        $('note-title').addEventListener('input', () => { $('note-error').textContent = ''; });
        $('note-body').addEventListener('keydown', e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('note-form').requestSubmit(); }
        });
        $('att-add').addEventListener('click', () => $('att-input').click());
        const dropBox = document.querySelector('#note-modal .note-editor');
        ['dragenter', 'dragover'].forEach(ev => dropBox.addEventListener(ev, e => { e.preventDefault(); dropBox.classList.add('dragging'); }));
        ['dragleave', 'drop'].forEach(ev => dropBox.addEventListener(ev, e => { e.preventDefault(); dropBox.classList.remove('dragging'); }));
        dropBox.addEventListener('drop', e => { if (e.dataTransfer && e.dataTransfer.files.length) attAddFiles(e.dataTransfer.files); });
        $('att-input').addEventListener('change', e => { attAddFiles(e.target.files).then(() => { e.target.value = ''; }); });
        $('att-viewer-close').addEventListener('click', closeViewer);
        $('att-viewer-share').addEventListener('click', () => { if (viewerList[viewerIdx]) shareFile(viewerList[viewerIdx]); });
        $('share-close').addEventListener('click', closeShare);
        $('share-modal').addEventListener('click', e => { if (e.target === $('share-modal')) closeShare(); });
        $('share-copy').addEventListener('click', () => {
            const txt = $('share-text').value;
            (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(
                () => showToast('Teks disalin.'),
                () => { $('share-text').select(); try { document.execCommand('copy'); showToast('Teks disalin.'); } catch (e) { showToast('Tekan Ctrl+C untuk menyalin.'); } });
        });
        $('att-viewer-prev').addEventListener('click', () => stepViewer(-1));
        $('att-viewer-next').addEventListener('click', () => stepViewer(1));
        $('att-viewer').addEventListener('click', e => { if (e.target === $('att-viewer') || e.target.classList.contains('att-viewer-box')) closeViewer(); });
        $('note-delete').addEventListener('click', () => {
            if (editingNote && deleteNote(editingNote.key, editingNote.id)) closeNoteEditor();
        });
        document.addEventListener('keydown', e => {
            if (isShown('att-viewer') && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) stepViewer(e.key === 'ArrowLeft' ? -1 : 1);
            if (e.key !== 'Escape') return;
            if (isShown('share-modal')) closeShare();
            else if (isShown('att-viewer')) closeViewer();
            else if (isShown('note-modal')) closeNoteEditor();
            else if (isShown('notes-book-modal')) closeNotesBook();
        });

        renderNotesPanel();
        // Panel "hari ini" ikut berganti saat lewat tengah malam
        setInterval(() => {
            if (renderNotesPanel.key !== dateKey(new Date())) renderNotesPanel();
        }, 60000);
    }

    // ===== Kondisi udara & cuaca (Open-Meteo, tanpa API key) =====
    function wxInfo(code) { return WX_CODES[code] || ['馃尅锔�', 'Tidak diketahui']; }

    // Skala US AQI
    function aqiInfo(v) {
        if (v == null || isNaN(v)) return { label: 'Tidak tersedia', color: '#858796', tip: 'Data kualitas udara belum tersedia.' };
        if (v <= 50) return { label: 'Baik', color: '#1cc88a', tip: 'Udara bersih, aman untuk beraktivitas di luar.' };
        if (v <= 100) return { label: 'Sedang', color: '#f6c23e', tip: 'Dapat diterima. Orang yang sangat sensitif sebaiknya mengurangi aktivitas berat di luar.' };
        if (v <= 150) return { label: 'Tidak sehat bagi kelompok sensitif', color: '#fd7e14', tip: 'Anak-anak, lansia, dan penderita asma/jantung sebaiknya membatasi aktivitas di luar. Pakai masker bila perlu.' };
        if (v <= 200) return { label: 'Tidak sehat', color: '#e74a3b', tip: 'Kurangi aktivitas berat di luar ruangan dan gunakan masker.' };
        if (v <= 300) return { label: 'Sangat tidak sehat', color: '#8e44ad', tip: 'Hindari aktivitas di luar ruangan. Gunakan masker.' };
        return { label: 'Berbahaya', color: '#7b1e3a', tip: 'Tetap di dalam ruangan.' };
    }

    function wxFetchJSON(url) {
        return fetch(url, { cache: 'no-store' }).then(r => {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        });
    }

    function loadWeather(force) {
        let cached = null;
        try { cached = JSON.parse(localStorage.getItem(WX_KEY) || 'null'); } catch (e) {}
        if (cached && cached.data) {
            wxData = cached.data;
            wxData.fetchedAt = cached.t;
            renderWeather();
        }
        if (!force && cached && Date.now() - cached.t < WX_TTL) return Promise.resolve();

        const tz = 'timezone=Asia%2FJakarta';
        const ll = `latitude=${WX_LAT}&longitude=${WX_LON}`;
        const now = wxFetchJSON(`https://api.open-meteo.com/v1/forecast?${ll}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation` +
            `&hourly=temperature_2m,precipitation_probability,weather_code&forecast_days=2&${tz}`);
        const daily = wxFetchJSON(`https://api.open-meteo.com/v1/forecast?${ll}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum` +
            `&past_days=31&forecast_days=16&${tz}`);
        const air = wxFetchJSON(`https://air-quality-api.open-meteo.com/v1/air-quality?${ll}&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide&${tz}`);

        return Promise.allSettled([now, daily, air]).then(([a, b, c]) => {
            if (a.status !== 'fulfilled' && b.status !== 'fulfilled' && c.status !== 'fulfilled') throw new Error('offline');
            const prev = wxData || {};
            wxData = {
                now: a.status === 'fulfilled' ? a.value : prev.now,
                daily: b.status === 'fulfilled' ? b.value : prev.daily,
                air: c.status === 'fulfilled' ? c.value : prev.air,
                fetchedAt: Date.now()
            };
            try { localStorage.setItem(WX_KEY, JSON.stringify({ t: wxData.fetchedAt, data: { now: wxData.now, daily: wxData.daily, air: wxData.air } })); } catch (e) {}
            renderWeather();
        }).catch(() => {
            const el = document.getElementById('wx-status');
            if (el) el.textContent = wxData ? '鈿� Gagal memperbarui, memakai data terakhir' : '鈿� Cuaca gagal dimuat (cek koneksi)';
        });
    }

    function wxNum(v, d) { return v == null || isNaN(v) ? '鈥�' : Number(v).toFixed(d || 0); }

    function renderWeather() {
        const card = document.getElementById('wx-card');
        if (!card || !wxData) return;
        const cur = wxData.now && wxData.now.current;
        const air = wxData.air && wxData.air.current;
        if (cur) {
            const [icon, label] = wxInfo(cur.weather_code);
            document.getElementById('wx-icon').textContent = icon;
            document.getElementById('wx-temp').textContent = wxNum(cur.temperature_2m) + '掳C';
            document.getElementById('wx-desc').textContent = label;
            document.getElementById('wx-extra').textContent =
                `Terasa ${wxNum(cur.apparent_temperature)}掳 鈥� Lembap ${wxNum(cur.relative_humidity_2m)}% 鈥� Angin ${wxNum(cur.wind_speed_10m)} km/j`;
        }
        const aqi = aqiInfo(air ? air.us_aqi : null);
        const badge = document.getElementById('wx-aqi');
        badge.style.setProperty('--aqi-color', aqi.color);
        document.getElementById('wx-aqi-val').textContent = air && air.us_aqi != null ? Math.round(air.us_aqi) : '鈥�';
        document.getElementById('wx-aqi-label').textContent = aqi.label;
        const st = document.getElementById('wx-status');
        st.textContent = wxData.fetchedAt
            ? 'Diperbarui ' + new Date(wxData.fetchedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
        if (isShown('wx-modal')) renderWeatherDetail();
    }

    // Detail: hari ini (per jam + polutan) dan bulan ini (per hari)
    function renderWeatherDetail() {
        if (!wxData) return;
        const cur = wxData.now && wxData.now.current;
        const air = wxData.air && wxData.air.current;
        const nowStr = cur && cur.time ? cur.time : null;     // "YYYY-MM-DDTHH:MM" (WIB)
        const todayKey = nowStr ? nowStr.slice(0, 10) : dateKey(new Date());

        // --- Hari ini ---
        const box = document.getElementById('wx-today');
        box.innerHTML = '';
        if (cur) {
            const [icon, label] = wxInfo(cur.weather_code);
            const hero = document.createElement('div');
            hero.className = 'wx-hero';
            hero.innerHTML = `<div class="wx-hero-icon">${icon}</div><div><div class="wx-hero-temp">${wxNum(cur.temperature_2m)}掳C</div>` +
                `<div>${label}</div><div class="wx-hero-sub">Terasa ${wxNum(cur.apparent_temperature)}掳 鈥� Lembap ${wxNum(cur.relative_humidity_2m)}% 鈥� Angin ${wxNum(cur.wind_speed_10m)} km/j</div></div>`;
            box.appendChild(hero);
        }
        const aqi = aqiInfo(air ? air.us_aqi : null);
        const aq = document.createElement('div');
        aq.className = 'wx-aq';
        aq.style.setProperty('--aqi-color', aqi.color);
        const pol = air ? [['PM2.5', air.pm2_5, '碌g/m鲁'], ['PM10', air.pm10, '碌g/m鲁'], ['O鈧�', air.ozone, '碌g/m鲁'],
            ['NO鈧�', air.nitrogen_dioxide, '碌g/m鲁'], ['SO鈧�', air.sulphur_dioxide, '碌g/m鲁'], ['CO', air.carbon_monoxide, '碌g/m鲁']] : [];
        aq.innerHTML = `<div class="wx-aq-head"><span class="wx-aq-val">${air && air.us_aqi != null ? Math.round(air.us_aqi) : '鈥�'}</span>` +
            `<div><div class="wx-aq-title">Kualitas Udara (US AQI)</div><div class="wx-aq-label"></div></div></div>` +
            `<div class="wx-aq-tip"></div><div class="wx-pol">` +
            pol.map(p => `<div><span>${p[0]}</span><strong>${wxNum(p[1], 1)}</strong><small>${p[2]}</small></div>`).join('') + '</div>';
        aq.querySelector('.wx-aq-label').textContent = aqi.label;
        aq.querySelector('.wx-aq-tip').textContent = aqi.tip;
        box.appendChild(aq);

        const hourly = wxData.now && wxData.now.hourly;
        if (hourly && hourly.time) {
            const title = document.createElement('div');
            title.className = 'wx-sub';
            title.textContent = 'Perkiraan per jam';
            box.appendChild(title);
            const strip = document.createElement('div');
            strip.className = 'wx-hours';
            const startIdx = hourly.time.findIndex(t => nowStr && t >= nowStr.slice(0, 13) + ':00');
            hourly.time.slice(Math.max(startIdx, 0), Math.max(startIdx, 0) + 24).forEach((t, i) => {
                const k = Math.max(startIdx, 0) + i;
                const item = document.createElement('div');
                item.className = 'wx-hour' + (i === 0 ? ' now' : '');
                item.innerHTML = `<span>${i === 0 ? 'Kini' : t.slice(11, 16)}</span><div>${wxInfo(hourly.weather_code[k])[0]}</div>` +
                    `<strong>${wxNum(hourly.temperature_2m[k])}掳</strong><small>馃挧${wxNum(hourly.precipitation_probability[k])}%</small>`;
                strip.appendChild(item);
            });
            box.appendChild(strip);
        }

        // --- Bulan ini ---
        const mbox = document.getElementById('wx-month');
        mbox.innerHTML = '';
        const [ty, tm] = todayKey.split('-').map(Number);
        const dl = wxData.daily && wxData.daily.daily;
        document.getElementById('wx-month-title').textContent =
            new Date(ty, tm - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        const byDate = {};
        if (dl && dl.time) dl.time.forEach((t, i) => { byDate[t] = i; });
        const first = new Date(ty, tm - 1, 1).getDay();
        const total = new Date(ty, tm, 0).getDate();
        ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].forEach(n => {
            const h = document.createElement('div'); h.className = 'wx-dow'; h.textContent = n; mbox.appendChild(h);
        });
        for (let i = 0; i < first; i++) mbox.appendChild(document.createElement('div'));
        for (let d = 1; d <= total; d++) {
            const key = `${ty}-${String(tm).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const i = byDate[key];
            const cell = document.createElement('div');
            cell.className = 'wx-day' + (key === todayKey ? ' today' : '') + (key < todayKey ? ' past' : '');
            if (i == null) {
                cell.innerHTML = `<b>${d}</b><div class="wx-na">鈥�</div>`;
                cell.title = 'Prakiraan belum tersedia';
            } else {
                const [icon, label] = wxInfo(dl.weather_code[i]);
                cell.innerHTML = `<b>${d}</b><div class="wx-day-icon">${icon}</div>` +
                    `<strong>${wxNum(dl.temperature_2m_max[i])}掳</strong><small>${wxNum(dl.temperature_2m_min[i])}掳</small>` +
                    `<small>馃挧${wxNum(dl.precipitation_probability_max[i])}%</small>`;
                cell.title = `${label}\nSuhu ${wxNum(dl.temperature_2m_min[i])}鈥�${wxNum(dl.temperature_2m_max[i])}掳C\n` +
                    `Peluang hujan ${wxNum(dl.precipitation_probability_max[i])}% 鈥� Curah ${wxNum(dl.precipitation_sum[i], 1)} mm`;
            }
            mbox.appendChild(cell);
        }
        const note = document.getElementById('wx-month-note');
        note.textContent = 'Prakiraan tersedia sekitar 16 hari ke depan; tanggal setelahnya ditandai "鈥�". Tanggal lalu memakai data model cuaca.';
    }

    function openWeatherDetail() {
        document.getElementById('wx-modal').style.display = 'flex';
        renderWeatherDetail();
        loadWeather(false);
    }

    function initWeather() {
        const $ = x => document.getElementById(x);
        if (!$('wx-card')) return;
        $('wx-detail-btn').addEventListener('click', openWeatherDetail);
        $('wx-close').addEventListener('click', () => { $('wx-modal').style.display = 'none'; });
        $('wx-modal').addEventListener('click', e => { if (e.target === $('wx-modal')) $('wx-modal').style.display = 'none'; });
        document.querySelectorAll('#wx-tabs .note-chip').forEach(btn => btn.addEventListener('click', () => {
            document.querySelectorAll('#wx-tabs .note-chip').forEach(b => b.classList.toggle('active', b === btn));
            $('wx-pane-today').hidden = btn.dataset.tab !== 'today';
            $('wx-pane-month').hidden = btn.dataset.tab !== 'month';
        }));
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && isShown('wx-modal')) $('wx-modal').style.display = 'none'; });
        loadWeather(false);
        setInterval(() => loadWeather(false), 10 * 60 * 1000);
    }

    // ===== Waktu solat 5 waktu =====
    // Semua jam dari API adalah WIB. Waktu mutlak dihitung dengan offset +07:00,
    // jadi alarm tetap tepat walaupun zona waktu perangkat berbeda.
    function pad2(n) { return String(n).padStart(2, '0'); }
    function wibKey(ms) { return new Date(ms + 7 * 3600000).toISOString().slice(0, 10); }
    function shiftKey(key, days) {
        const [y, m, d] = key.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
    }
    function prayerEpoch(key, hhmm) { return new Date(key + 'T' + hhmm + ':00+07:00').getTime(); }
    function isFridayKey(key) {
        const [y, m, d] = key.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 5;
    }
    function addMinutes(hhmm, n) {
        const [h, m] = hhmm.split(':').map(Number);
        const t = (h * 60 + m + n + 1440) % 1440;
        return pad2(Math.floor(t / 60)) + ':' + pad2(t % 60);
    }
    function validTime(s) { return /^\d{2}:\d{2}$/.test(String(s)); }
    function fmtHM(t) { return String(t).replace(':', '.'); }
    function fmtCountdown(ms) {
        const s = Math.max(0, Math.floor(ms / 1000));
        return pad2(Math.floor(s / 3600)) + ':' + pad2(Math.floor((s % 3600) / 60)) + ':' + pad2(s % 60);
    }
    function prayerDateLabel(key, withYear) {
        return new Date(key + 'T12:00:00+07:00').toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: withYear ? 'numeric' : undefined, timeZone: 'Asia/Jakarta'
        });
    }

    function readPrayerSettings() {
        const saved = readJSON('prayerSettings', {});
        const s = Object.assign({}, PRAYER_DEFAULTS, saved);
        s.on = Object.assign({}, PRAYER_DEFAULTS.on, saved.on || {});
        s.before = [0, 5, 10, 15, 30].includes(Number(s.before)) ? Number(s.before) : 0;
        const v = Number(s.volume);
        s.volume = v >= 0 && v <= 100 ? v : 80;
        return s;
    }

    function savePrayerSettings() { writeJSON('prayerSettings', prayerSettings); }

    function normalizeDay(raw) {
        const day = {};
        for (const p of PRAYERS) {
            if (!validTime(raw[p.key])) return null;
            day[p.key] = raw[p.key];
        }
        ['imsak', 'terbit', 'dhuha'].forEach(k => { day[k] = validTime(raw[k]) ? raw[k] : ''; });
        day.src = raw.src;
        return day;
    }

    function fetchJson(url) {
        const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), 12000) : null;
        return fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .finally(() => { if (timer) clearTimeout(timer); });
    }

    // Sumber utama: jadwal resmi Kemenag RI lewat MyQuran (Kota Jakarta)
    async function fetchMyQuran(y, m) {
        const json = await fetchJson(`https://api.myquran.com/v2/sholat/jadwal/${PRAYER_CITY_ID}/${y}/${pad2(m)}`);
        const list = json && json.data && json.data.jadwal;
        if (!Array.isArray(list) || !list.length) throw new Error('Data kosong');
        const out = {};
        list.forEach(r => {
            const day = normalizeDay({
                imsak: r.imsak, subuh: r.subuh, terbit: r.terbit, dhuha: r.dhuha,
                dzuhur: r.dzuhur, ashar: r.ashar, maghrib: r.maghrib, isya: r.isya, src: 'myquran'
            });
            if (day && /^\d{4}-\d{2}-\d{2}$/.test(r.date)) out[r.date] = day;
        });
        if (!Object.keys(out).length) throw new Error('Data tidak valid');
        return out;
    }

    // Cadangan: Aladhan, metode 20 (Kemenag RI), koordinat Semper Barat
    async function fetchAladhan(y, m) {
        const json = await fetchJson(`https://api.aladhan.com/v1/calendar/${y}/${m}?latitude=${PRAYER_LAT}` +
            `&longitude=${PRAYER_LNG}&method=20&timezonestring=Asia/Jakarta`);
        if (!json || !Array.isArray(json.data) || !json.data.length) throw new Error('Data kosong');
        const hm = s => String(s).slice(0, 5);
        const out = {};
        json.data.forEach(d => {
            const [dd, mm, yy] = d.date.gregorian.date.split('-');
            const t = d.timings;
            const terbit = hm(t.Sunrise);
            const day = normalizeDay({
                imsak: hm(t.Imsak), subuh: hm(t.Fajr), terbit,
                dhuha: validTime(terbit) ? addMinutes(terbit, 27) : '',
                dzuhur: hm(t.Dhuhr), ashar: hm(t.Asr), maghrib: hm(t.Maghrib), isya: hm(t.Isha), src: 'aladhan'
            });
            if (day) out[`${yy}-${mm}-${dd}`] = day;
        });
        if (!Object.keys(out).length) throw new Error('Data tidak valid');
        return out;
    }

    async function ensurePrayerMonth(y, m, force) {
        const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const lastKey = `${y}-${pad2(m)}-${pad2(lastDay)}`;
        const have = prayerTimes[lastKey];
        const sixHours = 6 * 3600000;
        const retryMain = have && have.src !== 'myquran' &&
            Date.now() - (Number(localStorage.getItem('prayerRetryAt')) || 0) > sixHours;
        if (have && !force && !retryMain) return true;

        for (const fetcher of [fetchMyQuran, fetchAladhan]) {
            try {
                const data = await fetcher(y, m);
                Object.assign(prayerTimes, data);
                if (fetcher === fetchAladhan) {
                    try { localStorage.setItem('prayerRetryAt', String(Date.now())); } catch (e) {}
                }
                return true;
            } catch (e) {
                console.warn('Jadwal solat gagal:', fetcher.name, e);
            }
        }
        return !!have;
    }

    async function loadPrayerTimes(force) {
        if (prayerLoading) return false;
        prayerLoading = true;
        prayerState = 'loading';
        renderPrayerAll();

        const now = Date.now();
        const [y, m] = wibKey(now).split('-').map(Number);
        const ny = m === 12 ? y + 1 : y;
        const nm = m === 12 ? 1 : m + 1;
        const ok = await ensurePrayerMonth(y, m, force);
        await ensurePrayerMonth(ny, nm, force);

        const oldest = shiftKey(wibKey(now), -7);
        Object.keys(prayerTimes).forEach(k => { if (k < oldest) delete prayerTimes[k]; });
        try { localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify(prayerTimes)); } catch (e) {}

        prayerState = ok && prayerTimes[wibKey(now)] ? 'ok' : 'fail';
        prayerLoading = false;
        renderPrayerAll();
        return prayerState === 'ok';
    }

    function nextPrayer(now) {
        const today = wibKey(now);
        for (let off = 0; off <= 1; off++) {
            const dateKey = shiftKey(today, off);
            const day = prayerTimes[dateKey];
            if (!day) continue;
            for (const p of PRAYERS) {
                const at = prayerEpoch(dateKey, day[p.key]);
                if (at > now) return { key: p.key, name: p.name, dateKey, time: day[p.key], at };
            }
        }
        return null;
    }

    function makePrayerEvent(dateKey, prayerKey) {
        const day = prayerTimes[dateKey];
        const p = PRAYERS.find(x => x.key === prayerKey);
        if (!day || !p) return null;
        const at = new Date(prayerEpoch(dateKey, day[prayerKey]));
        const jumat = prayerKey === 'dzuhur' && isFridayKey(dateKey);
        return {
            id: `solat-${dateKey}-${prayerKey}`,
            kind: 'prayer',
            title: `馃晫 Waktu ${p.name}${jumat ? ' (Jumat)' : ''}`,
            startTime: at.toISOString(),
            endTime: at.toISOString(),
            description: `Saatnya menunaikan solat ${p.name}.`,
            subtitle: `${prayerDateLabel(dateKey)} 鈥� ${fmtHM(day[prayerKey])} WIB 鈥� ${PRAYER_PLACE}`,
            color: '#0f9d7a',
            alarm: true,
            alarmBefore: 0
        };
    }

    function makePrayerEventById(id) {
        // id: solat-YYYY-MM-DD-nama
        return makePrayerEvent(id.slice(6, 16), id.slice(17));
    }

    function checkPrayerAlarms(now, fired) {
        if (!prayerSettings.master) return false;
        const dateKey = wibKey(now);
        const day = prayerTimes[dateKey];
        if (!day) return false;
        let changed = false;
        PRAYERS.forEach(p => {
            if (!prayerSettings.on[p.key]) return;
            const at = prayerEpoch(dateKey, day[p.key]) - prayerSettings.before * 60000;
            const fk = `solat-${dateKey}-${p.key}@${at}`;
            if (now >= at && now - at <= ALARM_CATCHUP_MS && !fired[fk]) {
                fired[fk] = now;
                changed = true;
                const ev = makePrayerEvent(dateKey, p.key);
                if (ev) triggerAlarm(ev);
            }
        });
        return changed;
    }

    // Saat pengaturan diubah, alarm yang waktunya sudah lewat tidak boleh langsung berbunyi
    function markPrayerPastFired() {
        const now = Date.now();
        const dateKey = wibKey(now);
        const day = prayerTimes[dateKey];
        if (!day) return;
        const fired = getFired();
        PRAYERS.forEach(p => {
            const at = prayerEpoch(dateKey, day[p.key]) - prayerSettings.before * 60000;
            if (at <= now) fired[`solat-${dateKey}-${p.key}@${at}`] = now;
        });
        writeJSON('alarmFired', fired);
    }

    // Nada bawaan solat: arpeggio lembut yang lebih pelan dari alarm acara
    function playPrayerChimeOnce(volume) {
        const ctx = getAudioCtx();
        if (!ctx) return;
        [523.25, 659.25, 783.99, 659.25, 523.25, 392].forEach((freq, i) => {
            const t = ctx.currentTime + i * 0.55;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.01) * 0.5, t + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 1.25);
        });
    }

    function showPrayerStatus(message, isError) {
        const el = document.getElementById('prayer-status');
        if (!el) return;
        el.textContent = message;
        el.classList.toggle('error', !!isError);
        clearTimeout(showPrayerStatus._t);
        showPrayerStatus._t = setTimeout(() => { el.textContent = ''; }, 7000);
    }

    // --- Tampilan ---
    function prayerSig(np) { return (np ? np.dateKey + np.key : 'none') + prayerState + (prayerViewDate || ''); }

    function renderPrayerCountdown(np, now) {
        const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
        set('prayer-card-count', np ? fmtCountdown(np.at - now) : '');
        set('prayer-hero-count', np ? '鈴� ' + fmtCountdown(np.at - now) : '');
    }

    function renderPrayerAll() {
        const now = Date.now();
        const np = nextPrayer(now);
        prayerLastSig = prayerSig(np);
        const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

        let label;
        if (np) {
            const besok = np.dateKey !== wibKey(now);
            const jumat = np.key === 'dzuhur' && isFridayKey(np.dateKey);
            label = `Menuju ${np.name}${jumat ? ' (Jumat)' : ''}${besok ? ' besok' : ''}`;
        } else if (prayerState === 'loading') {
            label = 'Memuat jadwal鈥�';
        } else {
            label = 'Jadwal belum tersedia';
        }
        set('prayer-card-label', label);
        set('prayer-hero-label', label);
        set('prayer-card-time', np ? fmtHM(np.time) : '--.--');
        set('prayer-hero-time', np ? fmtHM(np.time) : '--.--');
        renderPrayerCountdown(np, now);
        renderPrayerModal(np, now);
    }

    function renderPrayerModal(np, now) {
        const list = document.getElementById('prayer-list');
        if (!list) return;
        const todayKey = wibKey(now);
        const viewKey = prayerViewDate || todayKey;
        const day = prayerTimes[viewKey];

        const dateEl = document.getElementById('prayer-date');
        if (dateEl) dateEl.textContent = prayerDateLabel(viewKey, true) + (viewKey === todayKey ? ' 鈥� Hari ini' : '');
        const prev = document.getElementById('prayer-nav-prev');
        const next = document.getElementById('prayer-nav-next');
        if (prev) prev.disabled = !prayerTimes[shiftKey(viewKey, -1)];
        if (next) next.disabled = !prayerTimes[shiftKey(viewKey, 1)];
        const todayBtn = document.getElementById('prayer-nav-today');
        if (todayBtn) todayBtn.hidden = viewKey === todayKey;

        list.classList.toggle('muted', !prayerSettings.master);

        if (!day) {
            list.innerHTML = '<li class="prayer-empty">' + (prayerState === 'loading'
                ? 'Memuat jadwal solat鈥�'
                : 'Jadwal belum bisa dimuat. Periksa koneksi internet lalu tekan "Perbarui jadwal".') + '</li>';
        } else {
            list.innerHTML = PRAYERS.map(p => {
                const at = prayerEpoch(viewKey, day[p.key]);
                const passed = viewKey < todayKey || (viewKey === todayKey && at <= now);
                const isNext = !!np && np.dateKey === viewKey && np.key === p.key;
                const jumat = p.key === 'dzuhur' && isFridayKey(viewKey);
                return `<li class="prayer-row${isNext ? ' next' : ''}${passed ? ' passed' : ''}">` +
                    `<span class="prayer-icon">${p.icon}</span>` +
                    `<span class="prayer-name">${p.name}${jumat ? '<small>Jumat</small>' : ''}</span>` +
                    `<span class="prayer-time">${fmtHM(day[p.key])}</span>` +
                    `<input type="checkbox" class="switch" data-prayer="${p.key}" aria-label="Alarm ${p.name}"` +
                    `${prayerSettings.on[p.key] ? ' checked' : ''}></li>`;
            }).join('');
        }

        const info = document.getElementById('prayer-info');
        if (info) {
            info.innerHTML = day
                ? [['Imsak', day.imsak], ['Terbit', day.terbit], ['Dhuha', day.dhuha]]
                    .filter(x => x[1]).map(x => `<span class="prayer-chip"><b>${x[0]}</b>${fmtHM(x[1])}</span>`).join('')
                : '';
        }

        const src = document.getElementById('prayer-source');
        if (src) {
            if (!day) src.textContent = '';
            else if (day.src === 'myquran') src.textContent = 'Sumber: jadwal resmi Kemenag RI (Kota Jakarta) lewat MyQuran. Semua waktu dalam WIB.';
            else src.textContent = 'Sumber cadangan: Aladhan (metode Kemenag RI, koordinat ' + PRAYER_PLACE +
                '). Hasil hitungan, bisa selisih 1鈥�4 menit dari jadwal resmi. Semua waktu dalam WIB.';
        }
    }

    function syncPrayerSettingsUI() {
        const $ = id => document.getElementById(id);
        if ($('prayer-master')) $('prayer-master').checked = !!prayerSettings.master;
        if ($('prayer-sound-on')) $('prayer-sound-on').checked = !!prayerSettings.sound;
        if ($('prayer-notif-on')) $('prayer-notif-on').checked = !!prayerSettings.notif;
        if ($('prayer-before')) $('prayer-before').value = String(prayerSettings.before);
        if ($('prayer-volume')) $('prayer-volume').value = String(prayerSettings.volume);
    }

    function prayerTick() {
        const now = Date.now();
        const np = nextPrayer(now);
        if (prayerSig(np) !== prayerLastSig) renderPrayerAll();
        else renderPrayerCountdown(np, now);
    }

    function initPrayer() {
        const $ = id => document.getElementById(id);
        const modal = $('prayer-modal');
        if (!modal || !$('prayer-card')) return;

        const askNotif = () => {
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().then(updateNotifButton).catch(() => {});
            }
        };
        const close = () => { modal.style.display = 'none'; };

        $('prayer-detail-btn').addEventListener('click', () => {
            prayerViewDate = null;
            renderPrayerAll();
            modal.style.display = 'flex';
        });
        $('prayer-close').addEventListener('click', close);
        modal.addEventListener('click', e => { if (e.target === modal) close(); });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && modal.style.display === 'flex' && rtModal.style.display !== 'flex') close();
        });

        // Pengaturan
        syncPrayerSettingsUI();
        $('prayer-master').addEventListener('change', e => {
            prayerSettings.master = e.target.checked;
            savePrayerSettings();
            markPrayerPastFired();
            if (prayerSettings.master) askNotif();
            renderPrayerAll();
        });
        $('prayer-sound-on').addEventListener('change', e => {
            prayerSettings.sound = e.target.checked;
            savePrayerSettings();
        });
        $('prayer-notif-on').addEventListener('change', e => {
            prayerSettings.notif = e.target.checked;
            savePrayerSettings();
            if (prayerSettings.notif) askNotif();
        });
        $('prayer-before').addEventListener('change', e => {
            prayerSettings.before = Number(e.target.value) || 0;
            savePrayerSettings();
            markPrayerPastFired();
        });
        $('prayer-volume').addEventListener('input', e => {
            prayerSettings.volume = Number(e.target.value);
            savePrayerSettings();
            if (ringer && ringer.audio && ringer.kind === 'prayer') ringer.audio.volume = prayerSettings.volume / 100;
        });

        // Saklar per waktu solat
        $('prayer-list').addEventListener('change', e => {
            const box = e.target.closest('input[data-prayer]');
            if (!box) return;
            prayerSettings.on[box.dataset.prayer] = box.checked;
            savePrayerSettings();
            markPrayerPastFired();
            if (box.checked) askNotif();
        });

        // Pindah hari
        $('prayer-nav-prev').addEventListener('click', () => {
            prayerViewDate = shiftKey(prayerViewDate || wibKey(Date.now()), -1);
            renderPrayerAll();
        });
        $('prayer-nav-next').addEventListener('click', () => {
            prayerViewDate = shiftKey(prayerViewDate || wibKey(Date.now()), 1);
            renderPrayerAll();
        });
        $('prayer-nav-today').addEventListener('click', () => {
            prayerViewDate = null;
            renderPrayerAll();
        });

        // Nada solat (terpisah dari nada alarm acara)
        const fileInput = $('prayer-file');
        $('prayer-pick-btn').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            handleSoundFile(fileInput.files[0], 'prayerSound');
            fileInput.value = '';
        });
        $('prayer-edit-btn').addEventListener('click', () => editSavedRingtone('prayerSound'));
        $('prayer-test-btn').addEventListener('click', () => {
            if (ringer && ringer.preview && ringer.kind === 'prayer') stopRinging();
            else if (!ringer) startRinging(true, 'prayer');
        });
        $('prayer-reset-btn').addEventListener('click', async () => {
            try { await idbRequest('readwrite', store => store.delete('prayerSound')); } catch (e) {}
            await loadCustomSound();
            showPrayerStatus('Kembali memakai nada bawaan solat.');
        });

        $('prayer-refresh').addEventListener('click', async () => {
            showPrayerStatus('Memperbarui jadwal鈥�');
            const ok = await loadPrayerTimes(true);
            showPrayerStatus(ok ? '鉁� Jadwal solat diperbarui.' : 'Gagal memuat jadwal. Periksa koneksi internet.', !ok);
        });

        renderPrayerAll();
        loadPrayerTimes(false);
        setInterval(prayerTick, 1000);
        setInterval(() => loadPrayerTimes(false), 6 * 3600000);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) loadPrayerTimes(false); });
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
        if (ev.kind === 'prayer') return diff > 0 ? `${diff} menit lagi menuju waktu solat` : 'Waktu solat telah tiba';
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
        alarmTimeEl.textContent = ev.kind === 'prayer'
            ? ev.subtitle
            : start.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) +
                ' 鈥� ' + formatTime(start) + ' - ' + formatTime(end);
        alarmDescEl.textContent = ev.description || '';
        alarmDescEl.hidden = !ev.description;
        updateAlarmQueueLabel();

        alarmOverlay.hidden = false;
        document.title = '馃敂 ' + ev.title;
        startRinging(false, ev.kind);
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
        if (ev.kind === 'prayer' && !prayerSettings.notif) return;
        const start = new Date(ev.startTime);
        const options = {
            body: ev.kind === 'prayer'
                ? describeStart(ev) + ' 鈥� ' + ev.subtitle
                : describeStart(ev) + ' 鈥� ' + formatTime(start),
            tag: 'alarm-' + ev.id,
            requireInteraction: true,
            vibrate: [300, 150, 300, 150, 600]
        };
        try {
            const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
            if (reg) {
                await reg.showNotification('馃敂 ' + ev.title, options);
                return;
            }
        } catch (e) { /* lanjut ke cara biasa */ }
        try { new Notification('馃敂 ' + ev.title, options); } catch (e) {}
    }

    function updateNotifButton() {
        if (!notifBtn) return;
        if (!('Notification' in window)) {
            notifBtn.hidden = true;
            return;
        }
        const perm = Notification.permission;
        notifBtn.disabled = perm !== 'default';
        notifBtn.textContent = perm === 'granted' ? '鉁� Notifikasi aktif'
            : perm === 'denied' ? '馃毇 Notifikasi diblokir'
            : '馃敂 Aktifkan notifikasi';
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

    function handleSoundFile(file, target) {
        if (!file) return;
        if (!isAudioFile(file)) {
            showAlarmStatus('File harus berupa audio (mp3, wav, ogg, m4a).', true);
            return;
        }
        if (file.size > ALARM_MAX_FILE_MB * 1024 * 1024) {
            showAlarmStatus(`Ukuran file maksimal ${ALARM_MAX_FILE_MB} MB.`, true);
            return;
        }
        openRingtoneEditor(file, file.name, file.type, 0, null, target);
    }

    async function editSavedRingtone(target) {
        const key = target || 'alarmSound';
        let rec = null;
        try { rec = await idbRequest('readonly', store => store.get(key)); } catch (e) {}
        if (!rec || !rec.blob) {
            const msg = 'Belum ada lagu tersimpan. Tekan "Pilih lagu" dulu.';
            if (key === 'prayerSound') showPrayerStatus(msg, true); else showAlarmStatus(msg, true);
            return;
        }
        openRingtoneEditor(rec.blob, rec.name, rec.type, rec.start || 0, rec.end || Infinity, key);
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

    async function openRingtoneEditor(blob, name, type, start, end, target) {
        closeRingtoneEditor();
        const url = URL.createObjectURL(blob);
        const token = {};
        rt = { token, target: target || 'alarmSound', blob, name, type: type || blob.type || 'audio/mpeg', url, duration: 0, start: 0, end: 0, peaks: null, audio: null, lastTime: 0 };

        rtFile.textContent = name;
        rtWaveMsg.textContent = 'Memuat lagu鈥�';
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
        if (rtTestBtn) rtTestBtn.textContent = '鈻� Tes potongan';
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
        rtTestBtn.textContent = '鈴� Stop tes';

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
            const target = rt.target;
            await idbRequest('readwrite', store => store.put(record, target));
            await loadCustomSound();
            closeRingtoneEditor();
            const done = '鉁� Nada dering disimpan. Tekan "Coba" untuk mendengar hasilnya.';
            if (target === 'prayerSound') showPrayerStatus(done); else showAlarmStatus(done);
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
                if (ringer && ringer.audio && ringer.kind !== 'prayer') ringer.audio.volume = alarmVolume / 100;
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

        const noteBadge = createNoteBadge(date);
        if (noteBadge) {
            dayCell.appendChild(noteBadge);
            dayCell.classList.add('has-notes');
        }

        if (hasA(date)) dayCell.appendChild(createABadge(date));

        const piketDini = getPiketDini(date);
        if (piketDini) {
            const pb = document.createElement('span');
            pb.className = 'piket-badge';
            pb.textContent = '馃寵';
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
            const weekNotes = noteCount(dateKey(dayDate));
            if (weekNotes) {
                const chip = document.createElement('span');
                chip.className = 'week-note-chip';
                chip.textContent = '馃摑 ' + weekNotes;
                chip.title = weekNotes + ' catatan';
                dayHeader.appendChild(chip);
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
            pill.textContent = '馃搷 Hari Ini';
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
            hl.textContent = '馃帉 ' + holidayName;
            dayHeader.appendChild(hl);
        }
        dayContainer.appendChild(dayHeader);
        dayContainer.appendChild(createDayNotesSection(currentDate));

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
                    <span>${escapeHtml(event.title)}${event.alarm ? ' 馃敂' : ''}</span>
                    <span style="color: ${event.color}">鈼�</span>
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
            return `${fmt(startDate)} 鈥� ${formatTime(startDate)} - ${formatTime(endDate)}`;
        }
        return `${fmt(startDate)} ${formatTime(startDate)} - ${fmt(endDate)} ${formatTime(endDate)}`;
    }

});
