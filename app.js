const addNoteBtn = document.getElementById('addNoteBtn');
const newNote = document.getElementById('newNote');
const notesContainer = document.getElementById('notesContainer');
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
let editingNoteIndex = null;
let allNotes = []; // Store all notes for filtering

window.addEventListener('load', () => {
    const savedNotes = JSON.parse(localStorage.getItem('notes')) || [];
    allNotes = savedNotes;
    displayNotes(allNotes);
});

// Function to display notes (used for initial load and filtering)
function displayNotes(notesToDisplay) {
    notesContainer.innerHTML = '';
    notesToDisplay.forEach((note, index) => {
        const originalIndex = allNotes.indexOf(note);
        createNoteElement(note, originalIndex !== -1 ? originalIndex : index);
    });
}

// Function to handle saving/updating notes
function saveOrUpdateNote() {
    const noteText = newNote.value;
    if (noteText.trim() === '') return;
    // Prevent duplicates on add or update
    if (editingNoteIndex !== null) {
        if (isDuplicateNote(noteText, editingNoteIndex)) {
            alert('A note with the same content already exists.');
            return;
        }
    } else {
        if (isDuplicateNote(noteText)) {
            alert('A note with the same content already exists.');
            return;
        }
    }
    if (editingNoteIndex !== null) {
        updateNoteInLocalStorage(noteText, editingNoteIndex);
    } else {
        saveNoteToLocalStorage(noteText);
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        allNotes = notes;
        const noteIndex = notes.length - 1; // Get the index of the newly added note
        // Apply current search filter if any
        filterNotes();
        newNote.value = '';
    }
}

addNoteBtn.addEventListener('click', saveOrUpdateNote);

// Add Enter key functionality to save/update notes
newNote.addEventListener('keydown', (e) => {
    // If Enter is pressed without Shift, save/update the note
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent default new line behavior
        saveOrUpdateNote();
    }
    // Shift+Enter will allow new lines in the textarea (default behavior)
});

function createNoteElement(text, index = null) {
    const noteDiv = document.createElement('div');
    noteDiv.classList.add('note');

    const noteText = document.createElement('pre');
    noteText.textContent = text;

    // If index is null, get it from localStorage
    const noteIndex = index !== null ? index : getNoteIndex(text);

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editNote(text, noteIndex));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
        noteDiv.remove();
        deleteNoteFromLocalStorage(text);
    });

    noteDiv.appendChild(noteText);
    noteDiv.appendChild(editBtn);
    noteDiv.appendChild(deleteBtn);
    notesContainer.appendChild(noteDiv);
}

function saveNoteToLocalStorage(note) {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    notes.push(note);
    localStorage.setItem('notes', JSON.stringify(notes));
}

function updateNoteInLocalStorage(newText, index) {
    const notes = JSON.parse(localStorage.getItem('notes'));
    notes[index] = newText;
    localStorage.setItem('notes', JSON.stringify(notes));
    allNotes = notes;

    // Apply current search filter if any
    filterNotes();
    editingNoteIndex = null;
    resetInput();
}

function deleteNoteFromLocalStorage(note) {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const updatedNotes = notes.filter(n => n !== note);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
    allNotes = updatedNotes;
    // Apply current search filter if any
    filterNotes();
}

function editNote(text, index) {
    newNote.value = text;
    editingNoteIndex = index;
    addNoteBtn.textContent = 'Update Note';
}

function getNoteIndex(text) {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    return notes.indexOf(text);
}

function resetInput() {
    newNote.value = '';
    addNoteBtn.textContent = 'Add Note';
}

// Duplicate handling
function normalizeText(text) {
    return (text || '').trim().toLowerCase();
}

function isDuplicateNote(candidateText, ignoreIndex = null) {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const normalizedCandidate = normalizeText(candidateText);
    return notes.some((existingText, idx) => {
        if (ignoreIndex !== null && idx === ignoreIndex) return false;
        return normalizeText(existingText) === normalizedCandidate;
    });
}

// Search functionality
function filterNotes() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm === '') {
        displayNotes(allNotes);
    } else {
        const filteredNotes = allNotes.filter(note => 
            note.toLowerCase().includes(searchTerm)
        );
        displayNotes(filteredNotes);
    }
}

searchInput.addEventListener('input', filterNotes);
searchBtn.addEventListener('click', filterNotes);

// Also trigger search on Enter key in search input
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        filterNotes();
    }
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeToggle.textContent = document.body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
});