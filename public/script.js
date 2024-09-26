document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username'); // Ensure this line exists
  
    if (!username) {
      alert('Username is missing from the URL parameters.');
      return;
    }
  
    document.getElementById('scraper-form').addEventListener('submit', function(event) {
      event.preventDefault();
      const urls = document.getElementById('urls').value.split('\n').map(url => url.trim()).filter(url => url);
      scrapeImages(urls);
    });
  
    async function scrapeImages(urls) {
      const cubito = document.getElementById('cubito');
      cubito.style.visibility = 'visible';
      try {
        const response = await fetch(`/scrape?username=${encodeURIComponent(username)}`, { // Add username to the fetch request URL
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ urls })
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
  
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'images.zip'; // Adjust the filename as needed
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
  
        // Hide the spinner after download
        cubito.style.visibility = 'hidden';
  
        // Show success message
        const results = document.getElementById('results');
        results.innerHTML = '<p>Images downloaded successfully. Check your downloads folder.</p>';
  
      } catch (error) {
        console.error('Error:', error);
  
        // Hide the spinner and show error message
        cubito.style.visibility = 'hidden';
        const results = document.getElementById('results');
        results.innerHTML = '<p>An error occurred. Please try again.</p>';
      }
    }
  });
  