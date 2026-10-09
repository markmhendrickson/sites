// The visible prompt and copied prompt are the same; resolve this page's URL
// before the shared copy enhancer reads its text. No account access is attempted.
for(const code of document.querySelectorAll('[data-evaluation-prompt]')){
 code.textContent=code.textContent.replace('Visit this website',`Visit ${location.href.split('#')[0]}`);
}
