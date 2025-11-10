const addNoteBtn = document.getElementById('addNoteBtn');
const newNote = document.getElementById('newNote');
const notesContainer = document.getElementById('notesContainer');
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const sortSelect = document.getElementById('sortSelect');
const noteError = document.getElementById('noteError');
let editingNoteId = null;
let allNotes = []; // Array of note objects: { id, text, createdAt, updatedAt, pinned }
let sortMode = 'pinned_newest';

window.addEventListener('load', () => {
    migrateIfNeeded();
    allNotes = loadNotes();
    renderNotes();
});

// Function to display notes (used for initial load and filtering)
function displayNotes(notesToDisplay) {
    notesContainer.innerHTML = '';
    notesToDisplay.forEach((note) => {
        createNoteElement(note);
    });
}

// Function to handle saving/updating notes
function saveOrUpdateNote() {
    const noteText = newNote.value;
    if (noteText.trim() === '') return;
    // Prevent duplicates on add or update (compare by text, ignore same id on edit)
    if (editingNoteId !== null) {
        if (isDuplicateNote(noteText, editingNoteId)) {
            setNoteError('A note with the same content already exists.');
            return;
        }
        updateNoteInLocalStorage(noteText, editingNoteId);
    } else {
        if (isDuplicateNote(noteText)) {
            setNoteError('A note with the same content already exists.');
            return;
        }
        saveNoteToLocalStorage(noteText);
        allNotes = loadNotes();
        renderNotes();
        newNote.value = '';
        clearNoteError();
    }
}

addNoteBtn.addEventListener('click', saveOrUpdateNote);

// Add Enter key functionality to save/update notes
newNote.addEventListener('keydown', (e) => {
    // Ctrl+Enter saves/updates, Enter alone inserts newline
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveOrUpdateNote();
    }
});

// Validate on input (debounced)
newNote.addEventListener('input', () => {
    validateNoteLive();
});

function createNoteElement(note) {
    const noteDiv = document.createElement('div');
    noteDiv.classList.add('note');

    const leftWrap = document.createElement('div');
    leftWrap.classList.add('note-left');

    if (note.pinned) {
        const badge = document.createElement('span');
        badge.classList.add('pin-badge');
        badge.textContent = '📌';
        leftWrap.appendChild(badge);
    }

    const noteText = document.createElement('pre');
    noteText.textContent = note.text;
    leftWrap.appendChild(noteText);

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editNote(note));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
        noteDiv.remove();
        deleteNoteFromLocalStorage(note.id);
    });

    const pinBtn = document.createElement('button');
    pinBtn.textContent = note.pinned ? 'Unpin' : 'Pin';
    pinBtn.addEventListener('click', () => {
        togglePin(note.id);
    });

    noteDiv.appendChild(leftWrap);
    noteDiv.appendChild(editBtn);
    noteDiv.appendChild(deleteBtn);
    noteDiv.appendChild(pinBtn);
    notesContainer.appendChild(noteDiv);
}

function saveNoteToLocalStorage(text) {
    const notes = loadNotes();
    const now = Date.now();
    const newNoteObj = {
        id: generateId(),
        text: text,
        createdAt: now,
        updatedAt: now,
        pinned: false
    };
    notes.push(newNoteObj);
    saveNotes(notes);
}

function updateNoteInLocalStorage(newText, id) {
    const notes = loadNotes();
    const idx = notes.findIndex(n => n.id === id);
    if (idx !== -1) {
        notes[idx] = {
            ...notes[idx],
            text: newText,
            updatedAt: Date.now()
        };
        saveNotes(notes);
        allNotes = notes;
        renderNotes();
    }
    editingNoteId = null;
    resetInput();
}

function deleteNoteFromLocalStorage(id) {
    const notes = loadNotes();
    const updatedNotes = notes.filter(n => n.id !== id);
    saveNotes(updatedNotes);
    allNotes = updatedNotes;
    renderNotes();
}

function editNote(note) {
    newNote.value = note.text;
    editingNoteId = note.id;
    addNoteBtn.textContent = 'Update Note';
}

// ID generation
function generateId() {
    if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    // Fallback simple UUID v4-ish
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function resetInput() {
    newNote.value = '';
    addNoteBtn.textContent = 'Add Note';
    clearNoteError();
}

// Duplicate handling
function normalizeText(text) {
    return (text || '').trim().toLowerCase();
}

function isDuplicateNote(candidateText, ignoreId = null) {
    const notes = loadNotes();
    const normalizedCandidate = normalizeText(candidateText);
    return notes.some((n) => {
        if (ignoreId !== null && n.id === ignoreId) return false;
        return normalizeText(n.text) === normalizedCandidate;
    });
}

// Inline error helpers
function setNoteError(message) {
    if (noteError) noteError.textContent = message || '';
    newNote.classList.add('input-error');
    addNoteBtn.disabled = true;
}

function clearNoteError() {
    if (noteError) noteError.textContent = '';
    newNote.classList.remove('input-error');
    addNoteBtn.disabled = false;
}

// Debounce helper
function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Live validation as user types
const validateNoteLive = debounce(() => {
    const value = newNote.value;
    const isEmpty = value.trim() === '';
    if (isEmpty) {
        clearNoteError();
        addNoteBtn.disabled = true; // prevent adding empty
        return;
    }
    const duplicate = editingNoteId !== null
        ? isDuplicateNote(value, editingNoteId)
        : isDuplicateNote(value);
    if (duplicate) {
        setNoteError('Duplicate note detected.');
    } else {
        clearNoteError();
    }
}, 250);

// Storage helpers and migration
function loadNotes() {
    return JSON.parse(localStorage.getItem('notes')) || [];
}

function saveNotes(notes) {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function migrateIfNeeded() {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    if (notes.length === 0) return;
    // If first element is a string, migrate entire array to object schema
    if (typeof notes[0] === 'string') {
        const now = Date.now();
        const migrated = notes.map(text => ({
            id: generateId(),
            text: text,
            createdAt: now,
            updatedAt: now,
            pinned: false
        }));
        saveNotes(migrated);
    }
}

function togglePin(id) {
    const notes = loadNotes();
    const idx = notes.findIndex(n => n.id === id);
    if (idx !== -1) {
        notes[idx] = { ...notes[idx], pinned: !notes[idx].pinned, updatedAt: Date.now() };
        saveNotes(notes);
        allNotes = notes;
        renderNotes();
    }
}

// Search + sort + render pipeline
function renderNotes() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    let working = allNotes.slice();
    if (searchTerm !== '') {
        working = working.filter(n => (n.text || '').toLowerCase().includes(searchTerm));
    }
    const sorted = sortNotes(working, sortMode);
    displayNotes(sorted);
}

function sortNotes(notes, mode) {
    const byUpdatedDesc = (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0);
    const byUpdatedAsc = (a, b) => (a.updatedAt || 0) - (b.updatedAt || 0);
    const byTextAsc = (a, b) => normalizeText(a.text).localeCompare(normalizeText(b.text));
    const byTextDesc = (a, b) => normalizeText(b.text).localeCompare(normalizeText(a.text));

    if (mode === 'pinned_newest') {
        const pinned = notes.filter(n => n.pinned);
        const unpinned = notes.filter(n => !n.pinned);
        pinned.sort(byUpdatedDesc);
        unpinned.sort(byUpdatedDesc);
        return [...pinned, ...unpinned];
    }
    const copy = notes.slice();
    if (mode === 'newest') return copy.sort(byUpdatedDesc);
    if (mode === 'oldest') return copy.sort(byUpdatedAsc);
    if (mode === 'az') return copy.sort(byTextAsc);
    if (mode === 'za') return copy.sort(byTextDesc);
    return copy;
}

searchInput.addEventListener('input', renderNotes);
searchBtn.addEventListener('click', renderNotes);
if (sortSelect) {
    sortSelect.addEventListener('change', () => {
        sortMode = sortSelect.value;
        renderNotes();
    });
}

// Also trigger search on Enter key in search input
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        renderNotes();
    }
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeToggle.textContent = document.body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
});