document.addEventListener('DOMContentLoaded', function() {
  var grid = document.getElementById('historyGrid');
  var detail = document.getElementById('historyDetail');

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

  async function render() {
    var items = await Tadhana.loadHistoryFromServer();
    if (!grid) return;
    if (!items.length) {
      grid.innerHTML = '<div class="history-card"><div class="history-card-body"><p class="about-feature-desc">No readings yet. Start a personal or three-card reading first.</p></div></div>';
      if (detail) detail.innerHTML = '';
      return;
    }

    grid.innerHTML = items.map(function(item, i) {
      var tags = item.mode === 'three' && item.spread
        ? item.spread.map(function(card) { return '<span class="history-card-tag">' + card.position + ': ' + card.name + '</span>'; }).join('')
        : '<span class="history-card-tag">' + item.cardName + '</span>';
      return '<div class="history-card">' +
        '<div class="history-card-header"><span class="history-date">' + item.date + '</span><button class="btn-delete" data-delete="' + i + '" title="Delete">x</button></div>' +
        '<div class="history-card-body"><div class="history-divider"></div><div class="history-cards-grid">' + tags + '</div>' +
        '<button class="btn-deck btn-shuffle" data-view="' + i + '">View</button></div>' +
        '</div>';
    }).join('');
    renderDetail(items[0]);
  }

  grid.addEventListener('click', function(event) {
    var view = event.target.getAttribute('data-view');
    var del = event.target.getAttribute('data-delete');
    if (view !== null) renderDetail(Tadhana.loadHistory()[Number(view)]);
    if (del !== null) {
      var items = Tadhana.loadHistory();
      var entry = items[Number(del)];
      if (entry && entry.__reading_id) {
        fetch('/api/readings/' + entry.__reading_id, { method: 'DELETE' }).catch(function() {});
      }
      Tadhana.deleteHistory(Number(del));
      Tadhana.toast('Reading removed');
      render();
    }
  });

  render();
});
