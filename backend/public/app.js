(function() {
  'use strict';

  var isSearchMode = false;

  // Entry submission
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
      var res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: text })
      });

      var data = await res.json();

      if (!res.ok) {
        responseContent.textContent = 'Error: ' + (data.error || res.statusText);
      } else {
        var concept = data.concept;
        if (concept) {
          responseContent.innerHTML =
            '<strong>' + escapeHtml(concept.summary || concept.title || 'Concepto procesado') + '</strong>' +
            ' <span class="badge badge-state" data-state="' + escapeHtml(concept.state) + '">' + escapeHtml(concept.state) + '</span>' +
            ' <span class="badge badge-type">' + escapeHtml(concept.concept_type || concept.type || '') + '</span>' +
            '<br><span style="color:#555">Peso: ' + (concept.weight || 1) + '</span>';
        } else {
          responseContent.textContent = 'Entrada registrada.';
        }
      }

      responseBox.classList.add('visible');
      textarea.value = '';
      loadConcepts();
    } catch (err) {
      responseContent.textContent = 'Error de conexi\u00f3n: ' + err.message;
      responseBox.classList.add('visible');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enviar';
    }
  }

  // Load all concepts
  async function loadConcepts() {
    var list = document.getElementById('conceptsList');
    var searchInfo = document.getElementById('searchInfo');
    searchInfo.style.display = 'none';
    isSearchMode = false;

    try {
      var res = await fetch('/api/concepts');
      var data = await res.json();
      var concepts = Array.isArray(data) ? data : data.concepts || [];

      if (concepts.length === 0) {
        list.innerHTML = '<div class="empty-state">No hay conceptos a\u00fan. Env\u00eda tu primera entrada.</div>';
        return;
      }

      list.innerHTML = concepts.map(function(c) {
        return renderConceptCard(c);
      }).join('');
    } catch (err) {
      list.innerHTML = '<div class="empty-state">Error al cargar conceptos.</div>';
    }
  }

  // Semantic search
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
      var res = await fetch('/api/concepts/search', {
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
      list.innerHTML = '<div class="empty-state">Error de conexi\u00f3n: ' + escapeHtml(err.message) + '</div>';
    }
  }

  // Clear search and reload
  function clearSearch() {
    document.getElementById('searchInput').value = '';
    loadConcepts();
  }

  // Render a concept card
  function renderConceptCard(c, showSimilarity) {
    var similarityBadge = '';
    if (showSimilarity && c.similarity !== undefined) {
      similarityBadge = '<span class="similarity-score">' + (c.similarity * 100).toFixed(1) + '%</span>';
    }
    return '<div class="concept-card">' +
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

  // Escape HTML to prevent XSS
  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Initialize
  function init() {
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

    // Load initial concepts
    loadConcepts();

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }

  // Expose functions globally for onclick handlers
  window.submitEntry = submitEntry;
  window.searchConcepts = searchConcepts;
  window.clearSearch = clearSearch;

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
