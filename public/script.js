i18next
    .use(i18nextHttpBackend)
    .use(i18nextBrowserLanguageDetector)
    .init({
        fallbackLng: 'es',
        backend: {
            loadPath: '/locales/{{lng}}.json' // Path to your JSON translation files
        }
    }, function (err, t) {
        if (err) {
            console.error('Error initializing i18next:', err);
            return;
        }
        // Translate content
        updateContent();
    });

function updateContent() {
    $('[data-i18n]').each(function () {
        var key = $(this).data('i18n');
        var translation = i18next.t(key);
        $(this).text(translation);
    });
}

// Switch language on button click
$('#switch-language').on('click', function () {
    var currentLang = i18next.language;
    var newLang = currentLang === 'es' ? 'en-US' : 'es'; // Toggle between 'es' and 'en'
    i18next.changeLanguage(newLang, function (err, t) {
        if (err) return console.error(err);
        updateContent();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username'); 
  
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
        const response = await fetch(`/scrape?username=${encodeURIComponent(username)}`, { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ urls })
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok:  ${response.status} ${response.statusText}');
        }
  
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'images.zip'; 
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
  