document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('channelName').textContent = ("Channel: " + localStorage.getItem('arenaChannelTitle')) || 'Channel Block Editor';

    const selectedBlocks = JSON.parse(localStorage.getItem('selectedBlocks')) || [];
    const container = document.getElementById('tableContainer');

    console.log(selectedBlocks)

    if (selectedBlocks.length === 0) {
        container.innerHTML = '<p>No blocks selected.</p>';
        return;
    }

    // Regenerate the table with the updated blocks array
    const tableContainer = document.getElementById('tableContainer');
    let table = document.getElementById('selectedBlocksTable');

    table = document.createElement('table');
    table.id = 'selectedBlocksTable';
    table.innerHTML = `
            <thead>
                <tr>
                    <th>Select</th>
                    <th>Img</th>
                    <th>Title</th>
                    <th id="descriptionHead">Description<div id="resizeHandle"></div></th>
                    <th>Block (.md) Content</th>
                    <th>Source</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
    tableContainer.appendChild(table);

    const tableBody = table.querySelector('tbody');
    tableBody.innerHTML = '';

    selectedBlocks.forEach((block, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="block-select" data-index="${index}" ${block.selected ? 'checked' : ''}></td>
            <td contenteditable="true">
                <img src="${block.image_url || ''}" alt=""">
            </td>
            <td contenteditable="true" class="title">${block.title || ''}</td>
            <td contenteditable="true" class="description">${block.description || ''}</td>
            <td contenteditable="true" class="content">
                ${block.content || ''}
            </td>
            <td contenteditable="true" class="source">
                <a src="${block.source || ''}">${block.source || ''}</a>
            </td>
        `;
        tableBody.appendChild(row);

        row.querySelectorAll('[contenteditable="true"]').forEach(cell => {
            cell.addEventListener('input', () => {
                updateLocalStorage(tableBody, selectedBlocks);
            });
        });

    });

    // Add event listeners to checkboxes
    document.querySelectorAll('.block-select').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const index = this.getAttribute('data-index');
            selectedBlocks[index].selected = this.checked;
            localStorage.setItem('selectedBlocks', JSON.stringify(selectedBlocks));
        });
    });

    addWordCountListeners();
    resizeDescriptionCol()
    setupEmbedButton('embedButton', 4000, tableBody, selectedBlocks);

});

function addWordCountListeners() {
    document.querySelectorAll('.description').forEach(description => {
        description.addEventListener('input', updateWordCount);
        updateWordCount.call(description); // initialize
    });
}

function updateWordCount() {
    const text = this.textContent || this.innerText;
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    this.setAttribute('data-word-count', wordCount);

    let backgroundColor;
    if (wordCount < 120) {
        backgroundColor = 'red';
    } else if (wordCount >= 120 && wordCount < 150) {
        backgroundColor = 'yellow';
    } else if (wordCount >= 150 && wordCount < 200) {
        backgroundColor = 'green';
    } else {
        backgroundColor = 'yellow';
    }
    this.setAttribute('data-background-color', backgroundColor);
}

function setupEmbedButton(buttonId, timeoutDuration, tableBody, selectedBlocks) {
    const embedButton = document.getElementById(buttonId);
    const progressBar = document.querySelector('#progressBar .progress');

    if (!embedButton || !progressBar) {
        console.error('Could not find required elements.');
        return;
    }

    let confirmEmbed = false;
    let timeoutId;
    let progress = 0;
    const duration = timeoutDuration || 3000; // Default timeout duration in milliseconds (if not provided)

    embedButton.addEventListener('click', async function (event) {
        event.preventDefault();

        if (!confirmEmbed) {
            embedButton.innerHTML = "Click again to confirm...";
            confirmEmbed = true;

            progressBar.style.width = '0';
            progress = 0;
            animateProgressBar();

            timeoutId = setTimeout(() => {
                embedButton.innerHTML = "Click to Embed";
                confirmEmbed = false;
                progressBar.style.width = '0';
                progress = 0;
            }, duration);
        } else {
            clearTimeout(timeoutId);
            embedButton.innerHTML = "Writing file to embed...";
            isUpdating = false;
            progressBar.style.width = '0';

            selectedBlocks = selectedBlocks.filter(block => block.selected);

            // Function to update localStorage and return a Promise
            const updateLocalStoragePromise = () => {
                return new Promise((resolve) => {
                    localStorage.setItem('selectedBlocks', JSON.stringify(selectedBlocks));
                    resolve();
                });
            };

            await updateLocalStoragePromise();

            console.log(selectedBlocks)
            confirmEmbed = false;
            window.location.href = 'embed.html';
        }
    });

    function animateProgressBar() {
        const startTime = Date.now();

        function updateProgress() {
            const elapsedTime = Date.now() - startTime;
            progress = (elapsedTime / duration) * 100;
            progressBar.style.width = progress + '%';

            if (progress < 100) {
                requestAnimationFrame(updateProgress);
            } else {
                progress = 0;
                progressBar.style.width = "0%";
            }
        }

        requestAnimationFrame(updateProgress);
    }
}

function resizeDescriptionCol() {
    const resizeHandle = document.getElementById('resizeHandle');
    const descriptionHeader = document.getElementById('descriptionHead');
    let startX, startWidth;

    if (!resizeHandle || !descriptionHeader) {
        console.error('Could not find required elements.');
        return;
    }

    resizeHandle.addEventListener('mousedown', startResize);
    resizeHandle.addEventListener('touchstart', startResize);

    function startResize(e) {
        e.preventDefault();
        startX = e.pageX || e.touches[0].pageX;
        startWidth = descriptionHeader.offsetWidth;
        document.documentElement.addEventListener('mousemove', onMouseMove);
        document.documentElement.addEventListener('mouseup', onMouseUp);
        document.documentElement.addEventListener('touchmove', onMouseMove);
        document.documentElement.addEventListener('touchend', onMouseUp);
    }

    function onMouseMove(e) {
        const pageX = e.pageX || e.touches[0].pageX;
        const newWidth = startWidth + (pageX - startX);
        console.log(`${(Math.round(newWidth))}px`)
        descriptionHeader.style.width = `${(Math.round(newWidth))}px`;
    }

    function onMouseUp() {
        document.documentElement.removeEventListener('mousemove', onMouseMove);
        document.documentElement.removeEventListener('mouseup', onMouseUp);
        document.documentElement.removeEventListener('touchmove', onMouseMove);
        document.documentElement.removeEventListener('touchend', onMouseUp);
    }
}

let isUpdating = false;
function updateLocalStorage(tableBody, selectedBlocks, delay = 2000) {
    return new Promise((resolve) => {
        if (isUpdating) return resolve();

        isUpdating = true;
        setTimeout(() => {
            const updatedBlocks = Array.from(tableBody.querySelectorAll('tr')).map((row, i) => ({
                ...selectedBlocks[i],
                title: row.querySelector('.title').textContent,
                description: row.querySelector('.description').textContent,
                content: row.querySelector('.content').textContent,
                source: row.querySelector('.source a').href,
            }));
            localStorage.setItem('selectedBlocks', JSON.stringify(updatedBlocks));
            console.log('updated log');
            isUpdating = false;
            resolve();
        }, delay);
    });
}