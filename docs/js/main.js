/**
 * Grafia CMS — Main Script
 * Interatividade: navegação mobile, copy-to-clipboard, scroll suave
 */

document.addEventListener('DOMContentLoaded', function () {

    // === Mobile Nav Toggle ===
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');
    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            nav.classList.toggle('open');
            const expanded = nav.classList.contains('open');
            toggle.setAttribute('aria-expanded', expanded);
        });
        // Fechar ao clicar em link
        nav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // === Copy to Clipboard ===
    document.querySelectorAll('.copy-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var codeBlock = this.closest('.install-code') || this.closest('pre');
            var text = codeBlock ? codeBlock.textContent : '';
            // Limpar prompt e comentários
            text = text.replace(/^\$\s*/gm, '').replace(/#.*$/gm, '').trim();
            navigator.clipboard.writeText(text).then(function () {
                var orig = btn.textContent;
                btn.textContent = 'Copiado!';
                btn.style.background = '#16a34a';
                btn.style.color = '#fff';
                setTimeout(function () {
                    btn.textContent = orig;
                    btn.style.background = '';
                    btn.style.color = '';
                }, 2000);
            });
        });
    });

    // === Scroll Animations ===
    var animateElements = document.querySelectorAll('.animate-on-scroll');
    if ('IntersectionObserver' in window && animateElements.length) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        animateElements.forEach(function (el) { observer.observe(el); });
    }

    // === Active Nav Link ===
    var currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav a').forEach(function (link) {
        var href = link.getAttribute('href').split('/').pop();
        if (href === currentPath) {
            link.classList.add('active');
        }
    });

    // === Redoc (API Docs) ===
    if (document.getElementById('redoc-container')) {
        var script = document.createElement('script');
        script.src = 'https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js';
        script.onload = function () {
            Redoc.init(
                'openapi.yaml',
                {
                    scrollYOffset: 64,
                    hideDownloadButton: false,
                    expandResponses: '200,201',
                    theme: {
                        colors: { primary: { main: '#c41a1a' } },
                        sidebar: { backgroundColor: '#fafafa' },
                        rightPanel: { backgroundColor: '#1a1a1a' }
                    }
                },
                document.getElementById('redoc-container')
            );
        };
        document.body.appendChild(script);
    }

    // === Year no Footer ===
    var yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

});
