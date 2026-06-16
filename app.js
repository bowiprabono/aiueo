/* ============================================================
   AIUEO Text Converter — Application Logic
   ============================================================ */

// --- State ---
let isResultVisible = false;
let results = {
    aiueo: '',
    email: '',
    base64: ''
};
let currentTab = 'aiueo';

// --- Theme Toggle ---
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');

    body.classList.toggle('light-mode');

    if (body.classList.contains('light-mode')) {
        icon.textContent = '🌙';
        label.textContent = 'Dark';
    } else {
        icon.textContent = '☀️';
        label.textContent = 'Light';
    }
}

// --- Vowel Mapping ---
const VOWEL_TO_NUMBER = {
    'a': '1', 'A': '1',
    'i': '2', 'I': '2',
    'u': '3', 'U': '3',
    'e': '4', 'E': '4',
    'o': '5', 'O': '5'
};

/**
 * Convert a word using the AIUEO rules:
 *   1. Replace vowels with numbers (A=1, I=2, U=3, E=4, O=5) → first half
 *   2. Extract vowels only, uppercased → second half
 *   3. Combine: firstHalf^VOWELS|suffixNumber
 *
 * @param {string} word - The input word
 * @param {string} suffixNumber - The suffix number
 * @returns {string} The converted string
 */
function convert(word, suffixNumber) {
    // First half: replace vowels with their mapped numbers
    const firstHalf = word.replace(/[aeiou]/gi, (match) => VOWEL_TO_NUMBER[match]);

    // Second half: extract vowels only, uppercase
    const vowels = (word.match(/[aeiou]/gi) || []).join('').toUpperCase();

    return `${firstHalf}^${vowels}|${suffixNumber}`;
}

function convertEmailPattern(word, suffixNumber) {
    const vowels = (word.match(/[aeiou]/gi) || []).join('').toUpperCase();
    return `${word}@${vowels}!${suffixNumber}`;
}

function convertBase64Pattern(emailPatternString) {
    // btoa creates Base64 from string
    return btoa(emailPatternString);
}

/**
 * Generate a masked version of the result string.
 * Uses bullet characters to hide the actual value.
 */
function maskResult(text) {
    return '•'.repeat(text.length);
}

// --- Convert Button Handler ---
function convertText() {
    const wordInput = document.getElementById('wordInput');
    const numInput = document.getElementById('numInput');
    const word = wordInput.value.trim();
    const suffixNumber = numInput.value.trim();

    if (!word) {
        // Subtle shake animation on empty input
        wordInput.style.animation = 'none';
        wordInput.offsetHeight; // trigger reflow
        wordInput.style.animation = 'shake 0.4s ease';
        return;
    }

    if (!suffixNumber) {
        numInput.style.animation = 'none';
        numInput.offsetHeight;
        numInput.style.animation = 'shake 0.4s ease';
        return;
    }

    results.aiueo = convert(word, suffixNumber);
    results.email = convertEmailPattern(word, suffixNumber);
    results.base64 = convertBase64Pattern(results.email);

    updateResultDisplay();

    // Default to masked state
    isResultVisible = false;
    const resultMasked = document.getElementById('resultMasked');
    resultMasked.classList.remove('hidden');
    document.getElementById('eyeOpenIcon').style.display = 'none';
    document.getElementById('eyeClosedIcon').style.display = 'block';

    // Show result card with animation
    const resultCard = document.getElementById('resultCard');
    resultCard.style.display = 'none';
    resultCard.offsetHeight; // force reflow
    resultCard.style.display = 'block';

    // Reset copy button state
    resetCopyButton();
}

function updateResultDisplay() {
    const resultText = document.getElementById('resultText');
    const resultMasked = document.getElementById('resultMasked');
    
    const displayValue = results[currentTab];
    resultText.textContent = displayValue;
    resultMasked.textContent = maskResult(displayValue);
}

function switchTab(tabId) {
    currentTab = tabId;

    // Update active class on buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`tab-${tabId}`).classList.add('active');

    // Only update result if a conversion has happened
    if (results.aiueo) {
        updateResultDisplay();
        // Reset copy button because the text changed
        resetCopyButton();
    }
}

// --- Eye Toggle (Show / Hide Result) ---
function toggleVisibility() {
    const resultMasked = document.getElementById('resultMasked');
    const eyeOpen = document.getElementById('eyeOpenIcon');
    const eyeClosed = document.getElementById('eyeClosedIcon');

    isResultVisible = !isResultVisible;

    if (isResultVisible) {
        resultMasked.classList.add('hidden');
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
    } else {
        resultMasked.classList.remove('hidden');
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
    }
}

// --- Copy to Clipboard ---
function copyResult() {
    const currentResult = results[currentTab];
    if (!currentResult) return;

    const btn = document.getElementById('copyBtn');
    const label = document.getElementById('copyLabel');

    // Use the textarea fallback for local file:// access
    const textArea = document.createElement('textarea');
    textArea.value = currentResult;
    textArea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');

        // Success feedback
        btn.classList.add('copied');
        label.textContent = 'Copied!';

        setTimeout(() => {
            resetCopyButton();
        }, 2000);
    } catch (err) {
        // Try modern API as fallback
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(currentResult).then(() => {
                btn.classList.add('copied');
                label.textContent = 'Copied!';
                setTimeout(resetCopyButton, 2000);
            }).catch(() => {
                alert('Unable to copy. Please copy manually.');
            });
        } else {
            alert('Unable to copy. Please copy manually.');
        }
    }

    document.body.removeChild(textArea);
}

function resetCopyButton() {
    const btn = document.getElementById('copyBtn');
    const label = document.getElementById('copyLabel');
    btn.classList.remove('copied');
    label.textContent = 'Copy to Clipboard';
}

// --- Shake Animation (added dynamically) ---
(function injectShakeKeyframes() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
        }
    `;
    document.head.appendChild(style);
})();

// --- Keyboard Support: Enter to Convert ---
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('#wordInput, #numInput');
    inputs.forEach((input) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                convertText();
            }
        });
    });
});
