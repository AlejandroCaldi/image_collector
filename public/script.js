document.getElementById('scraper-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const urls = document.getElementById('urls').value.split('\n').map(url => url.trim()).filter(url => url);
    const downloadPath = document.getElementById('downloadPath').value;
    scrapeImages(urls, downloadPath);
});

async function scrapeImages(urls, downloadPath) {
    try {
        const response = await fetch('/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ urls, downloadPath })
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const result = await response.json();
        const results = document.getElementById('results');
        results.innerHTML = '';

        result.imageUrls.forEach(imageUrl => {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = '';
            link.textContent = `Downloaded ${imageUrl}`;
            link.target = '_blank';

            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';
            img.alt = 'Image';

            const div = document.createElement('div');
            div.appendChild(img);
            div.appendChild(link);

            results.appendChild(div);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}
