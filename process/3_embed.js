let OPENAI_API_KEY;

document.addEventListener('DOMContentLoaded', async () => {
    const selectedBlocks = JSON.parse(localStorage.getItem('selectedBlocks'));
    if (!selectedBlocks || !Array.isArray(selectedBlocks)) {
        window.location.href = '/';
    } else {
        await fetchEnvVariables();
        if (!OPENAI_API_KEY) {
            alert("Error: OPENAI_API_KEY not found. You can fix this by pasting your key in the repo .env.");
        } else {
            processEmbeddings();
        }
    }
});

async function fetchEnvVariables() {
    // Check if OPENAI_API_KEY is in localStorage
    let openaiKey = localStorage.getItem('OPENAI_API_KEY');
    if (openaiKey) {
        OPENAI_API_KEY = openaiKey.replace(/'/g, ''); // Remove single quotes
        console.log('OPENAI_API_KEY loaded from localStorage');
    } else {
        // Fetch from .env file if not found in localStorage
        try {
            const response = await fetch('.env');
            if (response.ok) {
                const envText = await response.text();
                const openaiKeyMatch = envText.match(/^OPENAI_API_KEY=(.*)$/m);
                if (openaiKeyMatch) {
                    OPENAI_API_KEY = openaiKeyMatch[1].replace(/'/g, '');
                    console.log('OPENAI_API_KEY loaded from .env file');
                }
            } else {
                console.log('.env file not found');
            }
        } catch (error) {
            console.error('Error fetching .env file:', error);
        }
    }
}

async function generateEmbedding(text) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            input: text,
            model: "text-embedding-3-small",
            dimensions: 512
        })
    });

    if (!response.ok) {
        throw new Error('Failed to generate embedding');
    }

    const data = await response.json();
    return data.data[0].embedding;
}

async function processEmbeddings() {

    const selectedBlocks = JSON.parse(localStorage.getItem('selectedBlocks')) || [];

    for (let block of selectedBlocks) {
        if (!block.embed_512d) { // Check if element already embedded
            console.log(`Embedding %c${block.title}%c`, 'font-weight: bold', 'font-weight: normal');
            block.embed_512d = await generateEmbedding(block.description);
        } else {
            console.log(`Already embedded %c${block.title}%c`, 'font-weight: bold', 'font-weight: normal');
        }

        // then create final properties for metadata
        const currentTime = new Date().toISOString();
        block.user = 'ondra';
        block.upload_time = currentTime;
    }

    localStorage.setItem('selectedBlocks', JSON.stringify(selectedBlocks));
    console.log(selectedBlocks);
    downloadJSON(selectedBlocks, 'selectedBlocks.json');
}

function downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a new button element
    const button = document.createElement('button');
    button.textContent = 'Download JSON';
    button.style.display = 'block';
    button.onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        button.textContent = 'Job Completed!';
        button.style.backgroundColor = "green";
    };

    // Append the button to the body or a specific container
    document.body.appendChild(button);
}