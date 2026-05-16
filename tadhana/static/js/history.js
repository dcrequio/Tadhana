document.addEventListener('DOMContentLoaded', function() {
  var grid = document.getElementById('historyGrid');
  var detail = document.getElementById('historyDetail');
  var search = document.getElementById('historySearch');
  var cachedItems = [];

  function textForEntry(entry) {
    if (!entry) return '';
    var parts = [entry.date, entry.cardName, entry.cardSub, entry.personal, entry.past, entry.present, entry.future];
    if (entry.spread) {
      entry.spread.forEach(function(item) {
        parts.push(item.position, item.name, item.text);
      });
    }
    return parts.filter(Boolean).join(' ').toLowerCase();
  }

  function filteredItems() {
    var q = search ? search.value.trim().toLowerCase() : '';
    return cachedItems
      .map(function(item, index) { return { item: item, index: index }; })
      .filter(function(row) { return !q || textForEntry(row.item).indexOf(q) !== -1; });
  }

  function renderDetail(entry) {
    if (!detail || !entry) return;
    if (entry.mode === 'three' && entry.spread) {
      detail.innerHTML = '<div class="details-layout">' +
        '<div class="details-left"><div class="spread-revealed-grid">' +
        entry.spread.map(function(item) {
          return '<div class="spread-revealed-card"><div class="spread-position">' + item.position + '</div><div class="spread-revealed-img"><img src="' + item.img + '" alt="' + item.name + '"></div><div class="spread-card-name">' + item.name + '</div></div>';
        }).join('') +
        '</div></div><div class="details-right">' +
        entry.spread.map(function(item) {
          return '<div class="ppf-section"><div class="ppf-label ' + item.labelClass + '"><span class="ppf-dot ' + item.dotClass + '"></span>' + item.position + '</div><p class="ppf-text">' + item.text + '</p></div>';
        }).join('') +
        '</div></div>';
      return;
    }

    detail.innerHTML = '<div class="details-layout">' +
      '<div class="details-left"><div class="revealed-card-wrap"><div class="revealed-card-img"><img src="' + entry.cardImg + '" alt="' + entry.cardName + '"></div><div class="revealed-card-name">' + entry.cardName + '</div><div class="revealed-card-sub">' + entry.cardSub + '</div></div></div>' +
      '<div class="details-right"><div class="ppf-section"><div class="ppf-label ppf-label-present"><span class="ppf-dot ppf-dot-present"></span>Personal Reading</div><p class="ppf-text">' + entry.personal + '</p></div></div>' +
      '</div>';
  }

  function renderList() {
    var rows = filteredItems();
    if (!grid) return;
    if (!cachedItems.length) {
      grid.innerHTML = '<div class="history-card"><div class="history-card-body"><p class="about-feature-desc">No readings yet. Start a personal or three-card reading first.</p></div></div>';
      if (detail) detail.innerHTML = '';
      return;
    }
    if (!rows.length) {
      grid.innerHTML = '<div class="history-card"><div class="history-card-body"><p class="about-feature-desc">No readings matched your search.</p></div></div>';
      if (detail) detail.innerHTML = '';
      return;
    }

    grid.innerHTML = rows.map(function(row) {
      var item = row.item;
      var tags = item.mode === 'three' && item.spread
        ? item.spread.map(function(card) { return '<span class="history-card-tag">' + card.position + ': ' + card.name + '</span>'; }).join('')
        : '<span class="history-card-tag">' + item.cardName + '</span>';
      return '<div class="history-card">' +
        '<div class="history-card-header"><span class="history-date">' + item.date + '</span><button class="btn-delete" data-delete="' + row.index + '" title="Delete">x</button></div>' +
        '<div class="history-card-body"><div class="history-divider"></div><div class="history-cards-grid">' + tags + '</div>' +
        '<button class="btn-more-details" data-view="' + row.index + '">More Details</button></div>' +
        '</div>';
    }).join('');
    renderDetail(rows[0].item);
  }

  async function render() {
    cachedItems = await Tadhana.loadHistoryFromServer();
    renderList();
  }

  grid.addEventListener('click', function(event) {
    var view = event.target.getAttribute('data-view');
    var del = event.target.getAttribute('data-delete');
    if (view !== null) renderDetail(cachedItems[Number(view)]);
    if (del !== null) {
      var entry = cachedItems[Number(del)];
      if (entry && entry.__reading_id) {
        fetch('/api/readings/' + entry.__reading_id, { method: 'DELETE' }).catch(function() {});
      }
      Tadhana.deleteHistory(Number(del));
      Tadhana.toast('Reading removed');
      render();
    }
  });

  if (search) {
    search.addEventListener('input', renderList);
  }

  render();
});
