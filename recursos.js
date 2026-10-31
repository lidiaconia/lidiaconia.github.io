// Recursos gratis: pinta las tarjetas desde recursos.json (hub, portada y "Más recursos"),
// filtra por tipo, ordena por fecha y gestiona los botones de copiar prompt.
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
        var boton = r.pdf
            ? '<a class="btn rec-main" href="' + esc(r.pdf) + '" download><i class="fa-solid fa-download"></i> Descargar PDF</a>'
            : '<a class="btn rec-main" href="' + esc(r.url) + '"><i class="fa-regular fa-copy"></i> ' + esc(r.boton || 'Copiar prompt') + '</a>';
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
        fetch('/recursos.json').then(function (res) { return res.json(); }).then(function (lista) {
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

    document.querySelectorAll('.rec-copy').forEach(function (b) {
        b.addEventListener('click', function () {
            var txt = b.parentNode.querySelector('pre').textContent;
            var done = function () {
                var s = b.querySelector('span'); s.textContent = '¡Copiado!';
                setTimeout(function () { s.textContent = 'Copiar prompt'; }, 1800);
            };
            if (navigator.clipboard) { navigator.clipboard.writeText(txt).then(done); }
            else { var t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); done(); }
        });
    });
})();
