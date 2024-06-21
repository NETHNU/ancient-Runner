
function showControls() {
    const controlsMenu = document.getElementById('controlsMenu');
    if (controlsMenu.classList.contains('show')) {
        controlsMenu.classList.remove('show');
        setTimeout(() => {
            controlsMenu.style.display = 'none';
        }, 500); 
    } else {
        controlsMenu.style.display = 'block';
        setTimeout(() => {
            controlsMenu.classList.add('show');
        }, 0); 
    }
}
function toggleOptionsMenu() {
    const optionsMenu = document.getElementById('optionsMenu');
    if (optionsMenu.classList.contains('show')) {
        optionsMenu.classList.remove('show');
        setTimeout(() => {
            optionsMenu.style.display = 'none';
        }, 500);
    } else {
        optionsMenu.style.display = 'block';
        setTimeout(() => {
            optionsMenu.classList.add('show');
        }, 0); 
    }
}

function setVolume(volume) {
    const video = document.getElementById('myVideo');
    video.volume = volume;


    const lobbyMusic = document.getElementById('lobbyMusic');
    lobbyMusic.volume = volume;

    localStorage.setItem('volume', volume);
}

const video = document.getElementById('myVideo');
video.addEventListener('loadedmetadata', function() {
    video.play();
});

document.addEventListener('DOMContentLoaded', function() {
    const storedVolume = localStorage.getItem('volume');
    if (storedVolume !== null) {
        setVolume(storedVolume);
    }
});

function playButtonSound() {
    const buttonSound = document.getElementById('buttonSound');
    buttonSound.currentTime = 0;
    buttonSound.play();
}

document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.controls-button, .play-button, .options-button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', playButtonSound);
    });
});