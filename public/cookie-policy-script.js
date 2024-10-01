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