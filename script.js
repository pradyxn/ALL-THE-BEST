// --- Utility Functions ---
function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

// --- Audio Player Logic ---
const audio = document.getElementById('background-music');
const audioToggleButton = document.getElementById('audio-toggle-button');
let isMuted = false;

audio.volume = 0.5; // Default volume

audioToggleButton.addEventListener('click', () => {
    // If audio is paused, try to play it first
    if (audio.paused) {
        audio.play().catch(e => console.log("Play on click blocked:", e));
    }

    // Then toggle mute state
    audio.muted = !audio.muted;
    if (audio.muted) {
        audioToggleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-x"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>';
    } else {
        audioToggleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M22.49 1.51a14 0 0 1 0 20.98"/></svg>';
    }
    isMuted = audio.muted; // Update the isMuted state
});

// Attempt to autoplay (might be blocked by browsers)
window.addEventListener('load', () => {
    audio.play().catch(e => console.log("Autoplay blocked:", e));
});


// --- Clover Logic ---
const cloversContainer = document.getElementById('clovers-container');
const heroSection = document.getElementById('hero-section');
const finalModalOverlay = document.getElementById('final-modal-overlay');

const cloverStates = [];
const cloverSize = 60; // px, matches CSS
const numClovers = 8;
let clickedCloversCount = 0;

// Adjusted for medium falling and horizontal drift
const getRandomFallingVelocity = () => getRandom(0.8, 1.5); // Medium speed between 0.8 and 1.5
const getRandomHorizontalDrift = () => getRandom(-0.5, 0.5); // Medium horizontal drift between -0.5 and 0.5

// Padding around the hero section for the clover bounding box
const cloverAreaPadding = 150; // pixels

function getCloverBounds() {
    const heroRect = heroSection.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const minX = heroRect.left - cloverAreaPadding;
    const maxX = heroRect.right + cloverAreaPadding;
    const minY = heroRect.top - cloverAreaPadding;
    const maxY = heroRect.bottom + cloverAreaPadding;

    // Clamp bounds to viewport
    return {
        minX: Math.max(0, minX),
        maxX: Math.min(viewportWidth, maxX),
        minY: Math.max(0, minY),
        maxY: Math.min(viewportHeight, maxY)
    };
}

function initializeClovers() {
    cloverStates.length = 0; // Clear existing clovers
    const bounds = getCloverBounds();

    // Ensure bounds are valid before initializing clovers
    if (bounds.maxX <= bounds.minX || bounds.maxY <= bounds.minY) {
        console.warn("Clover bounds are invalid, retrying initialization...");
        setTimeout(initializeClovers, 100); // Retry after a short delay
        return;
    }

    for (let i = 0; i < numClovers; i++) {
        cloverStates.push({
            id: i,
            // Initialize within the calculated bounds
            x: getRandom(bounds.minX, bounds.maxX - cloverSize),
            y: getRandom(bounds.minY, bounds.maxY - cloverSize),
            vx: getRandomHorizontalDrift(),
            vy: getRandomFallingVelocity(),
            isClicked: false,
            element: null // Will store the DOM element
        });
    }
    renderClovers();
}

function renderClovers() {
    cloversContainer.innerHTML = ''; // Clear container
    cloverStates.forEach(clover => {
        const button = document.createElement('button');
        button.className = `clover-button ${clover.isClicked ? 'clicked' : ''} ${clover.id === 7 ? 'special' : ''}`;
        button.style.left = `${clover.x}px`;
        button.style.top = `${clover.y}px`;
        button.innerHTML = '🍀';
        button.setAttribute('aria-label', clover.id === 7 ? 'Special Clover' : `Clover ${clover.id + 1}`);
        button.onclick = () => handleCloverClick(clover.id);
        cloversContainer.appendChild(button);
        clover.element = button; // Store reference to the DOM element
    });
}

function animateClovers() {
    const bounds = getCloverBounds();

    cloverStates.forEach(clover => {
        if (clover.isClicked) return;

        let newX = clover.x + clover.vx;
        let newY = clover.y + clover.vy;
        let newVx = clover.vx;
        let newVy = clover.vy;

        // Horizontal collision with bounds
        if (newX + cloverSize > bounds.maxX || newX < bounds.minX) {
            newVx *= -1; // Reverse horizontal velocity
            // Clamp to stay within bounds
            newX = Math.max(bounds.minX, Math.min(newX, bounds.maxX - cloverSize));
        }

        // Vertical collision with bounds
        if (newY + cloverSize > bounds.maxY || newY < bounds.minY) {
            newVy *= -1; // Reverse vertical velocity
            // Clamp to stay within bounds
            newY = Math.max(bounds.minY, Math.min(newY, bounds.maxY - cloverSize));
        }

        clover.x = newX;
        clover.y = newY;
        clover.vx = newVx;
        clover.vy = newVy;

        if (clover.element) {
            clover.element.style.left = `${clover.x}px`;
            clover.element.style.top = `${clover.y}px`;
        }
    });

    requestAnimationFrame(animateClovers);
}

function handleCloverClick(id) {
    const clover = cloverStates.find(c => c.id === id);
    if (clover && !clover.isClicked) {
        clover.isClicked = true;
        clover.element.classList.add('clicked'); // Hide the clicked clover
        clickedCloversCount++;

        // Placeholder for clover click sound
        // new Audio('/sounds/sparkle.mp3').play(); // Uncomment and provide actual sound file

        triggerConfettiEffect('per-click'); // Trigger per-click confetti
        openFinalModal(); // Open the modal on every click

        if (clickedCloversCount === numClovers) {
            triggerConfettiEffect('final'); // Trigger final confetti
        }
    }
}

function openFinalModal() {
    finalModalOverlay.classList.add('open');
}

finalModalOverlay.addEventListener('click', (event) => {
    // Close if clicked outside the content
    if (event.target === finalModalOverlay) {
        finalModalOverlay.classList.remove('open');
    }
});


// --- Confetti Effect Logic ---
const confettiContainer = document.getElementById('confetti-container');
const defaultConfettiEmojis = ['💖', '✨', '🍀', '🌸', '🌷', '🩷', '🎉', '🎊'];

function triggerConfettiEffect(type) {
    let particleCount, particleDuration, emojis;

    if (type === 'initial') {
        particleCount = 40;
        particleDuration = 8;
        emojis = ['💖', '✨', '🌸', '🌷', '🩷', '🎉', '🎊'];
    } else if (type === 'per-click') {
        particleCount = 100; // Lots of particles for per-click
        particleDuration = 3;
        emojis = ['💖', '✨', '🌸', '🌷', '🩷', '🎉', '🎊'];
    } else if (type === 'final') {
        particleCount = 250; // Even MORE particles for final
        particleDuration = 6;
        emojis = ['💖', '✨', '🍀', '🌸', '🌷', '🩷', '🎉', '🎊', '🥹'];
    }

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('span');
        particle.className = 'confetti-particle';
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        particle.textContent = emoji;
        if (emoji === '🍀') particle.classList.add('clover'); // Add specific class for clover color

        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.animationDuration = `${particleDuration + getRandom(0, 2)}s`;
        particle.style.animationDelay = `${getRandom(0, 0.5)}s`; // Shorter delay for burst

        confettiContainer.appendChild(particle);

        // Remove particle after its animation to prevent DOM bloat
        setTimeout(() => {
            particle.remove();
        }, (particleDuration + 2) * 1000); // Add buffer
    }
}

// Continuous initial confetti/hearts/flowers
let initialConfettiInterval;
function startInitialConfetti() {
    triggerConfettiEffect('initial');
    initialConfettiInterval = setInterval(() => {
        triggerConfettiEffect('initial');
    }, 8000);
}


// --- Cursor Trail Logic ---
const cursorTrailContainer = document.getElementById('cursor-trail-container');
const trailEmojis = ['💗', '✨', '🌹', '🩷', '🌷'];

document.addEventListener('mousemove', (e) => {
    const particle = document.createElement('span');
    particle.className = 'cursor-trail-particle';
    particle.textContent = trailEmojis[Math.floor(Math.random() * trailEmojis.length)];
    particle.style.left = `${e.clientX}px`;
    particle.style.top = `${e.clientY}px`;
    cursorTrailContainer.appendChild(particle);

    // Remove particle after animation
    setTimeout(() => {
        particle.remove();
    }, 1000); // Matches fade-out-up animation duration
});


// --- Background Heart Particles Logic ---
const heartParticlesContainer = document.getElementById('heart-particles-container');
const bgHeartEmojis = ['💖', '💕', '💞', '💓', '💗'];

function createHeartParticle() {
    const particle = document.createElement('div');
    particle.className = 'heart-particle';
    particle.textContent = bgHeartEmojis[Math.floor(Math.random() * bgHeartEmojis.length)];
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.fontSize = `${getRandom(10, 20)}px`;
    particle.style.animationDuration = `${getRandom(5, 15)}s`;
    particle.style.animationDelay = `${getRandom(0, 5)}s`;
    particle.style.setProperty('--float-x-offset', `${getRandom(-50, 50)}px`); // Random horizontal drift

    heartParticlesContainer.appendChild(particle);

    // Remove particle after its animation duration
    setTimeout(() => {
        particle.remove();
    }, (parseFloat(particle.style.animationDuration) * 1000) + 100);
}

let heartParticleInterval;
function startHeartParticles() {
    heartParticleInterval = setInterval(createHeartParticle, 1000); // Create a new particle every second
}


// --- Initialization on Load ---
window.addEventListener('load', () => {
    // Give a small delay to ensure all elements are rendered and have dimensions
    setTimeout(() => {
        initializeClovers();
        animateClovers(); // Start clover animation
        startInitialConfetti(); // Start continuous confetti
        startHeartParticles(); // Start background heart particles
    }, 100); // 100ms delay
});

// Clean up intervals on unload (optional, for single-page apps)
window.addEventListener('beforeunload', () => {
    clearInterval(initialConfettiInterval);
    clearInterval(heartParticleInterval);
});
