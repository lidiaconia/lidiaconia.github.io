// Recursos gratis: pinta las tarjetas desde recursos.json (hub, portada y "Más recursos"),
// filtra por tipo, ordena por fecha y gestiona los botones de copiar prompt.

// Contador de visitas y clics con GoatCounter (sin cookies). Vacío = desactivado.
var GOATCOUNTER = 'lidiaconia';

(function () {
    if (!GOATCOUNTER) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.dataset.goatcounter = 'https://' + GOATCOUNTER + '.goatcounter.com/count';
    document.head.appendChild(s);

    // Nombre del recurso según la página: /recursos/fuego/ → "fuego"; /recursos/ → "recursos"; portada → "inicio"
    var m = location.pathname.match(/^\/recursos\/([^/]+)\//);
    var pagina = m ? m[1] : /^\/recursos\/?$/.test(location.pathname) ? 'recursos' : 'inicio';

    var contar = function (accion, titulo) {
        if (!window.goatcounter || !window.goatcounter.count) return;
        window.goatcounter.count({ path: pagina + '/' + accion, title: titulo || accion, event: true });
    };

    document.addEventListener('click', function (e) {
        var a = e.target.closest('a, button');
        if (!a) return;
        var href = a.getAttribute('href') || '';
        if (a.classList.contains('rec-copy')) {
            var n = [].indexOf.call(document.querySelectorAll('.rec-copy'), a) + 1;
            var caja = a.closest('details, figure');
            var nombre = caja && caja.querySelector('.ttl, figcaption strong');
            contar('copiar-' + n, 'Copiar prompt ' + n + (nombre ? ': ' + nombre.textContent.trim() : ''));
        } else if (a.hasAttribute('download') || /\.pdf(\?|$)/.test(href)) {
            contar('pdf', 'Descargar PDF');
        } else if (/sjv\.io|pixverse/.test(href)) {
            contar('pixverse', 'Probar PixVerse');
        } else if (/elevenlabs/.test(href)) {
            contar('elevenlabs', 'Probar ElevenLabs');
        } else if (/#waitlist$/.test(href)) {
            contar('lista-espera', 'Ir a la lista de espera');
        } else if (a.classList.contains('rec-video-play')) {
            contar('video', 'Reproducir el vídeo');
        } else if (a.closest('.rec-card')) {
            contar('tarjeta-' + a.closest('.rec-card').id, 'Tarjeta: ' + a.closest('.rec-card').querySelector('h3').textContent.trim());
        }
    });

    document.querySelectorAll('video').forEach(function (v) {
        v.addEventListener('play', function () { contar('video', 'Reproducir el vídeo'); }, { once: true });
    });
    var form = document.getElementById('waitlistForm');
    if (form) form.addEventListener('submit', function () { contar('formulario', 'Enviar el formulario de la lista de espera'); });
})();

(function () {
    var TIPOS = {
        tutorial: { nombre: 'Tutorial', icono: 'fa-file-pdf' },
        prompt: { nombre: 'Prompts', icono: 'fa-terminal' }
    };

    var esc = function (s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    };

    // Un recurso con fecha futura no sale en los listados hasta ese día (salvo con ?preview)
    var preview = /[?&]preview/.test(location.search);
    var publicado = function (r) {
        return preview || Date.now() >= new Date(r.fecha + 'T00:00:00').getTime();
    };

    var fechaTxt = function (f) {
        return new Date(f + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    var tarjeta = function (r) {
        var t = TIPOS[r.tipo] || TIPOS.tutorial;
        var tags = [t.nombre].concat(r.etiquetas || []).map(function (e, i) {
            return '<span class="rec-tag' + (i === 0 ? ' rec-tag-tipo' : '') + '">' + esc(e) + '</span>';
        }).join('');
        // El botón lleva siempre a la página del recurso (ahí está la descarga y la lista de espera)
        var boton = '<a class="btn rec-main" href="' + esc(r.url) + '"><i class="fa-solid ' + t.icono + '"></i> ' +
            esc(r.boton || (r.tipo === 'tutorial' ? 'Ver el tutorial' : 'Ver los prompts')) + '</a>';
        return '<article class="rec-card" id="' + esc(r.id) + '" data-tipo="' + esc(r.tipo) + '">' +
            '<a class="rec-thumb" href="' + esc(r.url) + '"><img src="' + esc(r.imagen) + '" alt="' + esc(r.titulo) + '" width="800" height="1000" loading="lazy">' +
            '<span class="rec-badge"><i class="fa-solid ' + t.icono + '"></i> ' + t.nombre + '</span></a>' +
            '<div class="rec-body">' +
            '<time class="rec-date" datetime="' + esc(r.fecha) + '">' + fechaTxt(r.fecha) + '</time>' +
            '<h3><a href="' + esc(r.url) + '">' + esc(r.titulo) + '</a></h3>' +
            '<div class="rec-tags">' + tags + '</div>' +
            '<p class="rec-desc">' + esc(r.descripcion) + '</p>' +
            boton +
            '<a class="rec-wl" href="#waitlist"><span>&iquest;Quieres aprenderlo paso a paso?</span> <strong>Lista de espera &rarr;</strong></a>' +
            '</div></article>';
    };

    var grids = document.querySelectorAll('[data-recursos]');
    if (grids.length) {
        // no-cache: el navegador pregunta siempre si hay versión nueva, así un recurso recién publicado sale al momento
        fetch('/recursos.json', { cache: 'no-cache' }).then(function (res) { return res.json(); }).then(function (lista) {
            lista = lista.filter(publicado).sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
            grids.forEach(function (grid) { pintar(grid, lista); });
        }).catch(function () {
            grids.forEach(function (grid) { grid.innerHTML = '<p class="rec-empty"><a href="/recursos/">Ver los recursos gratis &rarr;</a></p>'; });
        });
    }

    function pintar(grid, lista) {
        var excluir = grid.dataset.excluir;
        var max = parseInt(grid.dataset.recursos, 10) || 0;
        var filtros = document.querySelector('.rec-filtros');
        var orden = document.querySelector('.rec-orden');
        var tipo = 'todos';

        var render = function () {
            var items = lista.filter(function (r) { return r.id !== excluir && (tipo === 'todos' || r.tipo === tipo); });
            if (orden && orden.value === 'antiguos') items = items.slice().reverse();
            if (max) items = items.slice(0, max);
            grid.innerHTML = items.length ? items.map(tarjeta).join('') : '<p class="rec-empty">Pronto habr&aacute; m&aacute;s. &iexcl;Vuelve en unos d&iacute;as!</p>';
        };

        // Los filtros y el orden solo existen en el hub
        if (!max && filtros) {
            filtros.addEventListener('click', function (e) {
                var b = e.target.closest('button');
                if (!b) return;
                tipo = b.dataset.tipo;
                filtros.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
                render();
            });
        }
        if (!max && orden) orden.addEventListener('change', render);
        render();

        // Llegada con ancla a una tarjeta del hub (/recursos/#disfraz)
        var target = !max && location.hash && document.getElementById(location.hash.slice(1));
        if (target && grid.contains(target)) {
            target.classList.add('rec-destacada');
            target.scrollIntoView();
        }
    }

    // Llegada con ancla a un prompt concreto (/recursos/gta/#p7): lo abre
    var abrirPrompt = function () {
        var prompt = location.hash && document.querySelector('details.rec-prompt' + location.hash.replace(/[^#\w-]/g, ''));
        if (prompt) { prompt.open = true; prompt.scrollIntoView(); }
    };
    abrirPrompt();
    window.addEventListener('hashchange', abrirPrompt);

    // Vídeo de YouTube: se carga al pulsar y, al acabar, nuestra tarjeta tapa las sugerencias de YouTube
    var ytCola = [];
    var cargarYT = function (cb) {
        if (window.YT && window.YT.Player) return cb();
        ytCola.push(cb);
        if (ytCola.length > 1) return;
        window.onYouTubeIframeAPIReady = function () { ytCola.forEach(function (f) { f(); }); };
        var s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
    };
    document.querySelectorAll('.rec-video').forEach(function (box) {
        var btn = box.querySelector('.rec-video-play');
        var fin = box.querySelector('.rec-video-end');
        var player;
        btn.addEventListener('click', function () {
            var hueco = document.createElement('div');
            btn.replaceWith(hueco);
            cargarYT(function () {
                player = new YT.Player(hueco, {
                    videoId: btn.dataset.yt,
                    host: 'https://www.youtube-nocookie.com',
                    playerVars: { autoplay: 1, rel: 0, playsinline: 1, modestbranding: 1 },
                    events: {
                        onReady: function (e) { e.target.playVideo(); },
                        onStateChange: function (e) { if (e.data === YT.PlayerState.ENDED) fin.hidden = false; }
                    }
                });
            });
        });
        box.querySelector('.rec-video-replay').addEventListener('click', function () {
            fin.hidden = true;
            player.seekTo(0);
            player.playVideo();
        });
    });

    document.querySelectorAll('.rec-copy').forEach(function (b) {
        b.addEventListener('click', function () {
            var txt = b.parentNode.querySelector('pre').textContent;
            var done = function () {
                var s = b.querySelector('span'), txtBoton = s.dataset.txt || (s.dataset.txt = s.textContent);
                s.textContent = '¡Copiado!';
                setTimeout(function () { s.textContent = txtBoton; }, 1800);
            };
            // Respaldo para navegadores que bloquean el portapapeles (p. ej. el de Instagram o TikTok)
            var viejo = function () { var t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); done(); };
            if (navigator.clipboard) { navigator.clipboard.writeText(txt).then(done, viejo); }
            else { viejo(); }
        });
    });
})();
