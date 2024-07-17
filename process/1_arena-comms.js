export async function fetchArenaBlocks(url) {
    try {
        const channelSlug = getChannelSlug(url);
        const apiUrl = `https://api.are.na/v2/channels/${channelSlug}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const channelData = await response.json();
        const title = channelData.title;

        // Store the title in local storage
        localStorage.setItem('arenaChannelTitle', title);

        // Fetch channel contents
        const contentsResponse = await fetch(`${apiUrl}/contents`);
        if (!contentsResponse.ok) {
            throw new Error(`HTTP error! status: ${contentsResponse.status}`);
        }
        const contentsData = await contentsResponse.json();

        const blocks = contentsData.contents.map((block) => ({
            id: block.id,
            title: formatString(block.title),
            description: formatString(block.description),
            content: formatString(block.content),
            source: block.source && block.source.url,
            image_url: block.image && block.image.original.url,
            selected: false
        }));
        console.log("Processed blocks:", blocks);
        return {
            title,
            blocks
        }
    } catch (error) {
        console.error("Error in fetchArenaBlocks:", error);
        throw error;
    }
}

function getChannelSlug(url) {
    const parts = url.split("/");
    return parts[parts.length - 1];
}

export function renderArenaChannel(blocks, title) {
    const tableContainer = document.getElementById('tableContainer');
    let table = document.getElementById('blockTable');

    // Add title to the page
    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    tableContainer.insertBefore(titleElement, tableContainer.firstChild);

    table = document.createElement('table');
    table.id = 'blockTable';
    table.innerHTML = `
            <thead>
                <tr>
                    <th>Select</th>
                    <th>Img</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Source</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
    tableContainer.appendChild(table);

    const tableBody = table.querySelector('tbody');
    tableBody.innerHTML = '';

    blocks.forEach((block, index) => {
        const row = document.createElement('tr');

        row.innerHTML = `
        <td><input type="checkbox" class="block-select" data-index="${index}" ${block.selected ? 'checked' : ''}></td>
        <td><img src="${block.image_url || ''}" alt=""></td>
        <td class="title">${block.title || ''}</td>
        <td class="description">${block.description || ''}</td>
        <td class="source"><a href="${block.source || ''}">${block.source || ''}</a></td>
    `;
        tableBody.appendChild(row);
    });

    // Checkboxes toggle
    document.querySelectorAll('.block-select').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const index = this.getAttribute('data-index');
            blocks[index].selected = this.checked;
            localStorage.setItem('arenaBlocks', JSON.stringify(blocks));
        });
    });

    document.getElementById('actionButtons').style.display = 'block';
}

export function renderArenaFiltered(blocks) {
    const selectedBlocks = blocks.filter(block => block.selected);
    console.log(selectedBlocks);
    return selectedBlocks;
}

// Function to get the cached title
export function getCachedChannelTitle() {
    return localStorage.getItem('arenaChannelTitle');
}

function formatString(str) {
    return (str || '')
        // Replace newlines and tabs with a single space
        .replace(/[\n\r\t]/g, ' ')
        // Replace multiple spaces with a single space
        .replace(/\s+/g, ' ')
        // Trim leading and trailing whitespace
        .trim();
}