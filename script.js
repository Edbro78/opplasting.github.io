// Hent JSON data
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        displayData(data);
    } catch (error) {
        console.error('Feil ved lasting av data:', error);
    }
}

// Vis data på siden
function displayData(data) {
    const contentDiv = document.getElementById('content');
    if (contentDiv && data) {
        contentDiv.innerHTML = JSON.stringify(data, null, 2);
    }
}

// Last data når siden er klar
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

