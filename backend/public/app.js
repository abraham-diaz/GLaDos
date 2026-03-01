(function() {
  'use strict';

  var TOKEN_KEY = 'glados_token';
  var isSearchMode = false;
  var allConcepts = [];

  // ==================== Auth ====================

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
    document.getElementById('loginUser').focus();
  }

  function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    loadConcepts();
  }

  async function checkAuth() {
    var token = getToken();
    if (!token) {
      showLogin();
      return;
    }

    try {
      var res = await fetch('/api/auth/verify', {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (res.ok) {
        showApp();
      } else {
        clearToken();
        showLogin();
      }
    } catch (err) {
      // Network error - try to show app anyway (offline mode)
      showApp();
    }
  }

  async function doLogin() {
    var userInput = document.getElementById('loginUser');
    var passInput = document.getElementById('loginPass');
    var errorDiv = document.getElementById('loginError');
    var btn = document.getElementById('loginBtn');

    var username = userInput.value.trim();
    var password = passInput.value;

    if (!username || !password) {
      errorDiv.textContent = 'Introduce usuario y contrase\u00f1a';
      errorDiv.classList.add('visible');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Entrando...';
    errorDiv.classList.remove('visible');

    try {
      var res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
      });

      var data = await res.json();

      if (!res.ok) {
        errorDiv.textContent = data.error || 'Error de autenticaci\u00f3n';
        errorDiv.classList.add('visible');
        return;
      }

      setToken(data.token);
      passInput.value = '';
      showApp();
    } catch (err) {
      errorDiv.textContent = 'Error de conexi\u00f3n';
      errorDiv.classList.add('visible');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  }

  // Authenticated fetch wrapper
  async function authFetch(url, options) {
    options = options || {};
    options.headers = options.headers || {};

    var token = getToken();
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }

    var res = await fetch(url, options);

    // Handle 401 - token expired
    if (res.status === 401) {
      clearToken();
      showLogin();
      throw new Error('Session expired');
    }

    return res;
  }

  // ==================== Entry ====================

  async function submitEntry() {
    var textarea = document.getElementById('entryText');
    var btn = document.getElementById('submitBtn');
    var responseBox = document.getElementById('response');
    var responseContent = document.getElementById('responseContent');
    var text = textarea.value.trim();

    if (!text) return;

    btn.disabled = true;
    btn.textContent = 'Procesando...';
    responseBox.classList.remove('visible');

    try {
      var res = await authFetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: text })
      });

      var data = await res.json();

      if (!res.ok) {
        responseContent.textContent = 'Error: ' + (data.error || res.statusText);
      } else {
        var concept = data.context || data.concept;
        if (concept) {
          var displayType = concept.entryType || concept.concept_type || concept.type || '';
          responseContent.innerHTML =
            '<strong>' + escapeHtml(concept.summary || concept.title || 'Concepto procesado') + '</strong>' +
            ' <span class="badge badge-state" data-state="' + escapeHtml(concept.state) + '">' + escapeHtml(concept.state) + '</span>' +
            ' <span class="badge badge-type">' + escapeHtml(displayType) + '</span>' +
            '<br><span style="color:#555">Peso: ' + (concept.weight || 1) + '</span>';
        } else {
          responseContent.textContent = 'Entrada registrada.';
        }
      }

      responseBox.classList.add('visible');
      textarea.value = '';
      loadConcepts();
    } catch (err) {
      if (err.message !== 'Session expired') {
        responseContent.textContent = 'Error de conexi\u00f3n: ' + err.message;
        responseBox.classList.add('visible');
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enviar';
    }
  }

  // ==================== Concepts ====================

  async function loadConcepts() {
    var list = document.getElementById('conceptsList');
    var searchInfo = document.getElementById('searchInfo');
    searchInfo.style.display = 'none';
    isSearchMode = false;

    try {
      var res = await authFetch('/api/concepts');
      var data = await res.json();
      var concepts = Array.isArray(data) ? data : data.concepts || [];
      allConcepts = concepts;

      applyFilters();
    } catch (err) {
      if (err.message !== 'Session expired') {
        list.innerHTML = '<div class="empty-state">Error al cargar conceptos.</div>';
      }
    }
  }

  function applyFilters() {
    var list = document.getElementById('conceptsList');
    var stateFilter = document.getElementById('filterState').value;
    var typeFilter = document.getElementById('filterType').value;

    var filtered = allConcepts;

    if (stateFilter) {
      filtered = filtered.filter(function(c) { return c.state === stateFilter; });
    }
    if (typeFilter) {
      filtered = filtered.filter(function(c) { return (c.type || c.concept_type) === typeFilter; });
    }

    if (filtered.length === 0) {
      list.innerHTML = '<div class="empty-state">' +
        (allConcepts.length === 0 ? 'No hay conceptos a\u00fan. Env\u00eda tu primera entrada.' : 'No hay conceptos con esos filtros.') +
        '</div>';
      return;
    }

    list.innerHTML = filtered.map(function(c) {
      return renderConceptCard(c);
    }).join('');
  }

  async function searchConcepts() {
    var input = document.getElementById('searchInput');
    var list = document.getElementById('conceptsList');
    var searchInfo = document.getElementById('searchInfo');
    var query = input.value.trim();

    if (!query) {
      loadConcepts();
      return;
    }

    list.innerHTML = '<div class="loading">Buscando...</div>';
    isSearchMode = true;

    try {
      var res = await authFetch('/api/concepts/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query, limit: 10 })
      });
      var data = await res.json();

      if (!res.ok) {
        list.innerHTML = '<div class="empty-state">Error: ' + escapeHtml(data.error || res.statusText) + '</div>';
        return;
      }

      var concepts = data.concepts || [];
      searchInfo.innerHTML = 'Resultados para: <strong>"' + escapeHtml(query) + '"</strong> (' + concepts.length + ')';
      searchInfo.style.display = 'flex';

      if (concepts.length === 0) {
        list.innerHTML = '<div class="empty-state">No se encontraron conceptos similares.</div>';
        return;
      }

      list.innerHTML = concepts.map(function(c) {
        return renderConceptCard(c, true);
      }).join('');
    } catch (err) {
      if (err.message !== 'Session expired') {
        list.innerHTML = '<div class="empty-state">Error de conexi\u00f3n: ' + escapeHtml(err.message) + '</div>';
      }
    }
  }

  function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterState').value = '';
    document.getElementById('filterType').value = '';
    loadConcepts();
  }

  function renderConceptCard(c, showSimilarity) {
    var similarityBadge = '';
    if (showSimilarity && c.similarity !== undefined) {
      similarityBadge = '<span class="similarity-score">' + (c.similarity * 100).toFixed(1) + '%</span>';
    }
    return '<div class="concept-card" onclick="openConceptModal(\'' + c.id + '\')">' +
      '<div class="concept-header">' +
        '<span class="concept-title">' + escapeHtml(c.summary || c.title || 'Sin t\u00edtulo') + '</span>' +
        similarityBadge +
        '<span class="badge badge-state" data-state="' + escapeHtml(c.state || '') + '">' + escapeHtml(c.state || '') + '</span>' +
        '<span class="badge badge-type">' + escapeHtml(c.concept_type || c.type || '') + '</span>' +
      '</div>' +
      (c.keywords ? '<div class="concept-summary">' + escapeHtml(c.keywords) + '</div>' : '') +
      '<div class="concept-weight">Peso: ' + (c.weight || 1) + '</div>' +
    '</div>';
  }

  // ==================== Modal ====================

  async function openConceptModal(conceptId) {
    var modal = document.getElementById('conceptModal');
    var titleEl = document.getElementById('modalTitle');
    var badgesEl = document.getElementById('modalBadges');
    var summaryEl = document.getElementById('modalSummary');
    var chartEl = document.getElementById('modalChart');
    var entriesEl = document.getElementById('modalEntries');

    // Show modal with loading state
    titleEl.textContent = 'Cargando...';
    badgesEl.innerHTML = '';
    summaryEl.textContent = '';
    chartEl.innerHTML = '';
    entriesEl.innerHTML = '<div class="loading">Cargando entries...</div>';
    modal.classList.remove('hidden');

    try {
      var res = await authFetch('/api/concepts/' + conceptId);
      if (!res.ok) {
        titleEl.textContent = 'Error al cargar concepto';
        entriesEl.innerHTML = '';
        return;
      }
      var data = await res.json();
      var concept = data.concept;
      var entries = data.entries || [];

      titleEl.textContent = concept.summary || concept.title || 'Sin t\u00edtulo';
      badgesEl.innerHTML =
        '<span class="badge badge-state" data-state="' + escapeHtml(concept.state) + '">' + escapeHtml(concept.state) + '</span>' +
        '<span class="badge badge-type">' + escapeHtml(concept.type || '') + '</span>' +
        '<span class="concept-weight">Peso: ' + concept.weight + '</span>';

      summaryEl.textContent = concept.summary || 'Sin resumen disponible.';

      // Render weight chart
      renderWeightChart(chartEl, entries, concept.created_at);

      // Render entries
      if (entries.length === 0) {
        entriesEl.innerHTML = '<div class="empty-state">No hay entries vinculadas.</div>';
      } else {
        entriesEl.innerHTML = entries.map(function(e) {
          return '<div class="modal-entry">' +
            '<div class="modal-entry-text">' + escapeHtml(e.raw_text) + '</div>' +
            '<div class="modal-entry-meta">' +
              '<span>' + formatDate(e.created_at) + '</span>' +
              '<span>Similitud: ' + (e.similarity * 100).toFixed(1) + '%</span>' +
            '</div>' +
          '</div>';
        }).join('');
      }
    } catch (err) {
      if (err.message !== 'Session expired') {
        titleEl.textContent = 'Error de conexi\u00f3n';
        entriesEl.innerHTML = '';
      }
    }
  }

  function closeConceptModal() {
    document.getElementById('conceptModal').classList.add('hidden');
  }

  function handleModalOverlayClick(event) {
    if (event.target === event.currentTarget) {
      closeConceptModal();
    }
  }

  function renderWeightChart(container, entries, conceptCreatedAt) {
    if (!entries || entries.length <= 1) {
      container.innerHTML = '<div class="weight-chart-empty">Sin historial de evoluci\u00f3n suficiente.</div>';
      return;
    }

    // Sort entries by created_at ASC
    var sorted = entries.slice().sort(function(a, b) {
      return new Date(a.created_at) - new Date(b.created_at);
    });

    // Build cumulative weight points
    var points = [];
    for (var i = 0; i < sorted.length; i++) {
      points.push({ date: new Date(sorted[i].created_at), weight: i + 1 });
    }

    var svgWidth = 600;
    var svgHeight = 150;
    var padLeft = 40;
    var padRight = 15;
    var padTop = 15;
    var padBottom = 25;
    var chartW = svgWidth - padLeft - padRight;
    var chartH = svgHeight - padTop - padBottom;

    var minDate = points[0].date.getTime();
    var maxDate = points[points.length - 1].date.getTime();
    var dateRange = maxDate - minDate || 1;
    var maxWeight = points[points.length - 1].weight;

    function x(date) {
      return padLeft + ((date.getTime() - minDate) / dateRange) * chartW;
    }

    function y(w) {
      return padTop + chartH - (w / maxWeight) * chartH;
    }

    // Build step line path
    var pathParts = ['M ' + x(points[0].date) + ' ' + y(points[0].weight)];
    for (var j = 1; j < points.length; j++) {
      // Horizontal then vertical (step)
      pathParts.push('L ' + x(points[j].date) + ' ' + y(points[j - 1].weight));
      pathParts.push('L ' + x(points[j].date) + ' ' + y(points[j].weight));
    }

    var circles = points.map(function(p) {
      return '<circle cx="' + x(p.date) + '" cy="' + y(p.weight) + '" r="3" fill="#f60"/>';
    }).join('');

    var svg = '<svg viewBox="0 0 ' + svgWidth + ' ' + svgHeight + '" style="width:100%;height:auto;display:block;">' +
      '<line x1="' + padLeft + '" y1="' + (padTop + chartH) + '" x2="' + (padLeft + chartW) + '" y2="' + (padTop + chartH) + '" stroke="#333" stroke-width="1"/>' +
      '<line x1="' + padLeft + '" y1="' + padTop + '" x2="' + padLeft + '" y2="' + (padTop + chartH) + '" stroke="#333" stroke-width="1"/>' +
      '<text x="' + (padLeft - 5) + '" y="' + (padTop + chartH + 3) + '" fill="#555" font-size="10" text-anchor="end" font-family="Courier New">1</text>' +
      '<text x="' + (padLeft - 5) + '" y="' + (padTop + 5) + '" fill="#555" font-size="10" text-anchor="end" font-family="Courier New">' + maxWeight + '</text>' +
      '<path d="' + pathParts.join(' ') + '" fill="none" stroke="#f60" stroke-width="2"/>' +
      circles +
    '</svg>';

    container.innerHTML = svg;
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr);
    var day = d.getDate();
    var months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    var month = months[d.getMonth()];
    var year = d.getFullYear();
    var hours = String(d.getHours()).padStart(2, '0');
    var mins = String(d.getMinutes()).padStart(2, '0');
    return day + ' ' + month + ' ' + year + ' ' + hours + ':' + mins;
  }

  // ==================== Utils ====================

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==================== Init ====================

  function init() {
    // Login: Enter to submit
    document.getElementById('loginPass').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        doLogin();
      }
    });

    document.getElementById('loginUser').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        document.getElementById('loginPass').focus();
      }
    });

    // Entry textarea: Ctrl+Enter to submit
    document.getElementById('entryText').addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'Enter') {
        submitEntry();
      }
    });

    // Search input: Enter to search
    document.getElementById('searchInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        searchConcepts();
      }
    });

    // Escape to close modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeConceptModal();
      }
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }

    // Check authentication
    checkAuth();
  }

  // Expose functions globally for onclick handlers
  window.doLogin = doLogin;
  window.submitEntry = submitEntry;
  window.searchConcepts = searchConcepts;
  window.clearSearch = clearSearch;
  window.applyFilters = applyFilters;
  window.openConceptModal = openConceptModal;
  window.closeConceptModal = closeConceptModal;
  window.handleModalOverlayClick = handleModalOverlayClick;

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
