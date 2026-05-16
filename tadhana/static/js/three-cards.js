document.addEventListener('DOMContentLoaded', function() {
  Tadhana.createDeckApp({
    requiredCards: 3,
    positions: [
      { position: 'Past', key: 'past', labelClass: 'ppf-label-past', dotClass: 'ppf-dot-past' },
      { position: 'Present', key: 'present', labelClass: 'ppf-label-present', dotClass: 'ppf-dot-present' },
      { position: 'Future', key: 'future', labelClass: 'ppf-label-future', dotClass: 'ppf-dot-future' }
    ]
  }).mount('#threeCardsApp');
});
