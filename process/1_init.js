import { fetchArenaBlocks, renderArenaChannel, renderArenaFiltered } from './1_arena-comms.js';

let blocks = [];
let selectedBlocks = []
let channelTitle;

document.addEventListener('DOMContentLoaded', async () => {
    const savedBlocks = JSON.parse(localStorage.getItem('arenaBlocks'));
    if (savedBlocks) {
        blocks = savedBlocks;
        renderArenaChannel(blocks);
        console.log('Loaded saved blocks from local storage');
    } else {
        console.log('No saved blocks found in local storage');
    }
    try {
        const response = await fetch('.env');
        if (response.ok) {
            const envText = await response.text();
            const openaiKeyMatch = envText.match(/^OPENAI_API_KEY=(.*)$/m);
            if (openaiKeyMatch) {
                const openaiKey = openaiKeyMatch[1].replace(/'/g, '');
                document.getElementById('openaiKey').value = openaiKey;
                console.log('OPENAI_API_KEY set from .env file');
            }
        } else {
            console.log('.env file not found');
        }
    } catch (error) {
        console.error('Error fetching .env file:', error);
    }
});

const urlForm = document.getElementById('urlForm');
urlForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await fetchArenaContents();
    await setEnv();
});

async function fetchArenaContents() {
    const url = document.getElementById('arenaUrl').value;
    try {
        const response = await fetchArenaBlocks(url);
        blocks = response.blocks;
        channelTitle = response.channelTitle;
        localStorage.setItem('arenaBlocks', JSON.stringify({ channelTitle, blocks }));
        renderArenaChannel(blocks);
    } catch (error) {
        console.error('Error fetching Are.na blocks:', error);
        alert('Failed to fetch Are.na blocks. Please check the URL and try again.');
    }
}

async function setEnv() {
    const openaiKey = document.getElementById('openaiKey').value;
    const envFilePath = '.env';

    try {
        const response = await fetch(envFilePath);
        if (!response.ok) {
            // .env file does not exist, create it
            const envContent = `OPENAI_API_KEY='${openaiKey}'\n`;
            await fetch(envFilePath, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: envContent
            });
            console.log('.env file created and OPENAI_API_KEY set');
        } else {
            console.log('.env file already exists');
        }
    } catch (error) {
        console.error('Error checking or creating .env file:', error);
    }
}

const filterSelectButton = document.getElementById('filterSelect');
filterSelectButton.addEventListener('click', () => {
    selectedBlocks = renderArenaFiltered(blocks);
    localStorage.setItem('selectedBlocks', JSON.stringify(selectedBlocks));
    window.location.href = 'editor.html';
});