import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const DB_PREFIX = "demo";

const firebaseConfig = {
    apiKey: "AIzaSyCDiJFZu5sqJFZmOBUOKkAEkIQ3FaDfI50",
    authDomain: "rpg-jigjigboy.firebaseapp.com",
    databaseURL: "https://rpg-jigjigboy-default-rtdb.firebaseio.com",
    projectId: "rpg-jigjigboy",
    storageBucket: "rpg-jigjigboy.firebasestorage.app",
    messagingSenderId: "844654913902",
    appId: "1:844654913902:web:9bdf7d4cf3a26084cf797f",
    measurementId: "G-LSBGT1Q317"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

function normalizeDbPath(path = "") {
    return String(path || "").replace(/^\/+|\/+$/g, "");
}

function dbPath(path = "") {
    const cleanPath = normalizeDbPath(path);
    if (!DB_PREFIX) return cleanPath;
    if (!cleanPath) return DB_PREFIX;
    if (cleanPath === DB_PREFIX || cleanPath.startsWith(DB_PREFIX + "/")) return cleanPath;
    return `${DB_PREFIX}/${cleanPath}`;
}

function dbRef(path = "") {
    return ref(database, dbPath(path));
}

function prettyUsername(profile = {}) {
    return String(profile.username || profile.usernameKey || "").trim();
}

function setTextWhenFound(selector, value, timeoutMs = 10000) {
    const startedAt = Date.now();
    const timer = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
            el.textContent = value;
            clearInterval(timer);
        }
        if (Date.now() - startedAt > timeoutMs) clearInterval(timer);
    }, 200);
}

function setFichaUserFieldWhenFound(slotNum, username, timeoutMs = 10000) {
    const startedAt = Date.now();
    const timer = setInterval(() => {
        const input = document.getElementById(`slot${slotNum}-jogador`);
        if (input) {
            input.value = username;
            const wrapper = input.closest("div");
            const label = wrapper?.querySelector("label");
            if (label) label.textContent = "Usuário";
            clearInterval(timer);
        }
        if (Date.now() - startedAt > timeoutMs) clearInterval(timer);
    }, 200);
}

function setupHpAutoClamp(profile) {
    if (!profile || profile.role !== "player" || !profile.fichaId) return;

    const slotNum = 1;
    const fichaId = profile.fichaId;
    let lastWriteValue = null;
    let writing = false;

    const clampHp = async () => {
        if (writing) return;

        const hpAtualInput = document.getElementById(`slot${slotNum}-hp-atual`);
        const hpMaxSpan = document.getElementById(`slot${slotNum}-hp-efetivo`);
        if (!hpAtualInput || !hpMaxSpan) return;

        const hpAtual = Number(hpAtualInput.value);
        const hpMax = Number(hpMaxSpan.textContent);

        if (!Number.isFinite(hpAtual) || !Number.isFinite(hpMax) || hpMax <= 0) return;
        if (hpAtual <= hpMax) return;

        hpAtualInput.value = String(hpMax);
        if (lastWriteValue === hpMax) return;

        try {
            writing = true;
            lastWriteValue = hpMax;
            await update(dbRef(`fichas/${fichaId}`), { "hp-atual": hpMax });
        } catch (err) {
            console.warn("Não foi possível ajustar HP atual ao máximo efetivo.", err);
            lastWriteValue = null;
        } finally {
            writing = false;
        }
    };

    const startedAt = Date.now();
    const setupTimer = setInterval(() => {
        const hpAtualInput = document.getElementById(`slot${slotNum}-hp-atual`);
        const hpMaxSpan = document.getElementById(`slot${slotNum}-hp-efetivo`);

        if (hpAtualInput && hpMaxSpan) {
            hpAtualInput.addEventListener("input", clampHp);
            hpAtualInput.addEventListener("change", clampHp);

            const observer = new MutationObserver(clampHp);
            observer.observe(hpMaxSpan, { childList: true, characterData: true, subtree: true });

            clampHp();
            clearInterval(setupTimer);
        }

        if (Date.now() - startedAt > 10000) clearInterval(setupTimer);
    }, 250);
}

async function applyUserPolish(firebaseUser) {
    if (!firebaseUser) return;

    const snap = await get(dbRef(`authProfiles/${firebaseUser.uid}`));
    if (!snap.exists()) return;

    const profile = snap.val() || {};
    const username = prettyUsername(profile);
    if (!username) return;

    setTextWhenFound("#usuario-logado", username);

    if (profile.role === "player") {
        setFichaUserFieldWhenFound(1, username);
        setupHpAutoClamp(profile);
    }
}

onAuthStateChanged(auth, (firebaseUser) => {
    applyUserPolish(firebaseUser).catch(err => console.warn("Falha ao aplicar ajustes visuais do usuário.", err));
});
