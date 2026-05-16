(function() {
  var Tadhana = window.Tadhana = window.Tadhana || {};
  Tadhana.historyKey = 'tadhana-history';

  Tadhana.currentUserId = function() {
    return localStorage.getItem('user_id');
  };

  Tadhana.requireLogin = function() {
    if (!Tadhana.currentUserId()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  };

  Tadhana.findCard = function(name) {
    return (window.TAROT_CARDS || []).find(function(card) { return card.name === name; });
  };

  Tadhana.hydrateEntry = function(entry) {
    if (!entry) return entry;
    if (entry.cardName && !entry.cardImg) {
      var card = Tadhana.findCard(entry.cardName);
      if (card) entry.cardImg = card.img;
    }
    if (entry.spread) {
      entry.spread = entry.spread.map(function(item) {
        if (!item.img) {
          var card = Tadhana.findCard(item.name);
          if (card) item.img = card.img;
        }
        return item;
      });
    }
    return entry;
  };

  Tadhana.compactEntry = function(entry) {
    var copy = Object.assign({}, entry);
    delete copy.cardImg;
    if (copy.spread) {
      copy.spread = copy.spread.map(function(item) {
        var slim = Object.assign({}, item);
        delete slim.img;
        return slim;
      });
    }
    return copy;
  };

  Tadhana.toast = function(message) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(Tadhana.toastTimer);
    Tadhana.toastTimer = setTimeout(function() { el.classList.remove('show'); }, 3000);
  };

  Tadhana.today = function() {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  Tadhana.getPersonalReading = function(card) {
    return card.personal || card.reading || card.present || 'Your personal reading will appear here.';
  };

  Tadhana.loadHistory = function() {
    try {
      return JSON.parse(localStorage.getItem(Tadhana.historyKey) || '[]').map(Tadhana.hydrateEntry);
    } catch (error) {
      return [];
    }
  };

  Tadhana.saveHistory = function(items) {
    localStorage.setItem(Tadhana.historyKey, JSON.stringify(items.slice(0, 30).map(Tadhana.compactEntry)));
  };

  Tadhana.entryFromServerReading = function(row) {
    var entry = null;
    try {
      entry = JSON.parse(row.notes || '{}');
    } catch (error) {
      entry = null;
    }
    if (!entry || !entry.mode) {
      entry = {
        mode: row.spread_type === 'three' ? 'three' : 'single',
        date: row.reading_date ? new Date(row.reading_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : Tadhana.today(),
        cardName: row.question || 'Saved Reading',
        cardSub: row.spread_type || 'Reading',
        personal: row.notes || ''
      };
    }
    entry.__reading_id = row.reading_id;
    if (!entry.date && row.reading_date) {
      entry.date = new Date(row.reading_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return Tadhana.hydrateEntry(entry);
  };

  Tadhana.loadHistoryFromServer = async function() {
    var userId = Tadhana.currentUserId();
    if (!userId) return Tadhana.loadHistory();
    try {
      var res = await fetch('/api/readings/' + userId);
      var rows = await res.json();
      if (!Array.isArray(rows)) return Tadhana.loadHistory();
      var entries = rows.map(Tadhana.entryFromServerReading);
      Tadhana.saveHistory(entries);
      return entries;
    } catch (error) {
      return Tadhana.loadHistory();
    }
  };

  Tadhana.saveEntryToServer = async function(entry) {
    var userId = Tadhana.currentUserId();
    if (!userId) return;
    var payload = {
      user_id: userId,
      question: entry.mode === 'three' ? '3 Card Reading' : entry.cardName,
      spread_type: entry.mode === 'three' ? 'three' : 'personal',
      tags: entry.mode === 'three' ? 'Past, Present, Future' : 'Personal Reading',
      notes: JSON.stringify(Tadhana.compactEntry(entry))
    };
    try {
      await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.warn('Reading saved locally only.', error);
    }
  };

  Tadhana.addHistory = function(entry) {
    var items = Tadhana.loadHistory();
    items.unshift(entry);
    Tadhana.saveHistory(items);
    Tadhana.saveEntryToServer(entry);
  };

  Tadhana.deleteHistory = function(index) {
    var items = Tadhana.loadHistory();
    items.splice(index, 1);
    Tadhana.saveHistory(items);
    return items;
  };

  Tadhana.initStars = function() {
    var layer = document.getElementById('stars');
    if (!layer) return;
    layer.innerHTML = '';
    for (var i = 0; i < 130; i++) {
      var star = document.createElement('span');
      star.className = 'star';
      var size = Math.random() * 2.2 + 0.8;
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.left = (Math.random() * 100) + '%';
      star.style.top = (Math.random() * 100) + '%';
      star.style.setProperty('--d', (2 + Math.random() * 4) + 's');
      star.style.setProperty('--dl', (Math.random() * 3) + 's');
      star.style.setProperty('--lo', Math.random() * 0.2);
      star.style.setProperty('--hi', 0.45 + Math.random() * 0.45);
      layer.appendChild(star);
    }
  };

  Tadhana.buildAboutFan = function() {
    var fan = document.getElementById('aboutFan');
    if (!fan || !window.TAROT_CARDS) return;
    fan.innerHTML = '';
    var rotations = [-12, -6, 0, 6, 12];
    window.TAROT_CARDS.slice().sort(function() { return Math.random() - 0.5; }).slice(0, 5).forEach(function(card, i) {
      var div = document.createElement('div');
      var rot = rotations[i];
      div.className = 'about-fan-card';
      div.style.transform = 'rotate(' + rot + 'deg)';
      div.innerHTML = '<img src="' + card.img + '" alt="' + card.name + '" />';
      div.onmouseenter = function() { div.style.transform = 'rotate(0deg) translateY(-10px) scale(1.06)'; };
      div.onmouseleave = function() { div.style.transform = 'rotate(' + rot + 'deg)'; };
      fan.appendChild(div);
    });
  };

  Tadhana.createDeckApp = function(config) {
    var requiredCards = config.requiredCards || 1;
    var positions = config.positions || [];

    return Vue.createApp({
      data: function() {
        return {
          CARD_BACK: window.CARD_BACK,
          CARD_W: 110,
          CARD_H: 185,
          deck: Array.from({ length: 5 }, function(_, i) {
            return { uid: 'card-' + i, x: 0, y: 0, rot: 0, z: i, dur: 0 };
          }),
          selectedSlots: [],
          selectedCardIndices: [],
          isShuffling: false,
          isSplitting: false,
          revealed: false,
          activeCard: null,
          personalText: '',
          activeSpread: []
        };
      },
      mounted: function() {
        this.$nextTick(() => this.fanOut(0));
        window.addEventListener('resize', this.handleResize);
      },
      beforeUnmount: function() {
        window.removeEventListener('resize', this.handleResize);
      },
      methods: {
        sleep: function(ms) {
          return new Promise(function(resolve) { setTimeout(resolve, ms); });
        },
        stageHeight: function() {
          return (this.$refs.stage && this.$refs.stage.offsetHeight) || 260;
        },
        stageWidth: function() {
          return (this.$refs.stage && this.$refs.stage.offsetWidth) || 620;
        },
        centerPoint: function() {
          return {
            x: this.stageWidth() / 2 - this.CARD_W / 2,
            y: this.stageHeight() / 2 - this.CARD_H / 2
          };
        },
        getSlots: function() {
          var n = this.deck.length;
          var stageW = this.stageWidth();
          var spacing = Math.min(126, (stageW - this.CARD_W) / Math.max(n - 1, 1));
          var totalW = spacing * (n - 1) + this.CARD_W;
          var startX = (stageW - totalW) / 2;
          var baseY = (this.stageHeight() - this.CARD_H) / 2;
          return this.deck.map(function(_, i) {
            return { x: startX + i * spacing, y: baseY + Math.abs(i - 2) * 6, rot: (i - (n - 1) / 2) * 7 };
          });
        },
        applyCard: function(card, x, y, rot, z, dur) {
          card.x = x;
          card.y = y;
          card.rot = rot;
          card.z = z;
          card.dur = dur || 0;
        },
        fanOut: async function(dur) {
          var slots = this.getSlots();
          this.deck.forEach((card, i) => this.applyCard(card, slots[i].x, slots[i].y, slots[i].rot, i, dur === undefined ? 480 : dur));
          await this.sleep(dur === undefined ? 520 : dur + 40);
        },
        stackUp: async function() {
          var center = this.centerPoint();
          this.deck.forEach((card, i) => this.applyCard(card, center.x, center.y, (i - 2) * 1.5, i, 380));
          await this.sleep(430);
        },
        cardStyle: function(card) {
          var ease = 'cubic-bezier(0.4,0,0.2,1)';
          return {
            left: card.x + 'px',
            top: card.y + 'px',
            zIndex: card.z,
            transform: 'rotate(' + card.rot + 'deg) translateZ(0)',
            transition: card.dur ? 'left ' + card.dur + 'ms ' + ease + ', top ' + card.dur + 'ms ' + ease + ', transform ' + card.dur + 'ms ' + ease : 'none'
          };
        },
        handleResize: function() {
          if (!this.isShuffling && !this.isSplitting) this.fanOut(0);
        },
        clearSelection: function() {
          this.selectedSlots = [];
          this.selectedCardIndices = [];
          this.revealed = false;
        },
        isSelected: function(i) {
          return this.selectedSlots.indexOf(i) !== -1;
        },
        pickCardIndex: function() {
          var available = window.TAROT_CARDS.map(function(_, i) { return i; }).filter((i) => this.selectedCardIndices.indexOf(i) === -1);
          if (!available.length) available = window.TAROT_CARDS.map(function(_, i) { return i; });
          return available[Math.floor(Math.random() * available.length)];
        },
        selectCard: function(i) {
          if (this.isShuffling || this.isSplitting) return;
          var existing = this.selectedSlots.indexOf(i);
          if (existing !== -1) {
            this.selectedSlots.splice(existing, 1);
            this.selectedCardIndices.splice(existing, 1);
            return;
          }
          if (this.selectedSlots.length >= requiredCards) {
            Tadhana.toast(requiredCards === 1 ? 'You already selected one card' : 'You already selected three cards');
            return;
          }
          this.selectedSlots.push(i);
          this.selectedCardIndices.push(this.pickCardIndex());
          if (requiredCards === 1) {
            Tadhana.toast('Card selected - click Reveal to open your reading');
          } else {
            var left = requiredCards - this.selectedSlots.length;
            Tadhana.toast(left === 0 ? 'Three cards selected - click Reveal' : 'Choose ' + left + ' more card' + (left === 1 ? '' : 's'));
          }
        },
        shuffleDeck: async function() {
          if (this.isShuffling || this.isSplitting) return;
          this.isShuffling = true;
          this.clearSelection();
          this.activeCard = null;
          this.activeSpread = [];
          await this.stackUp();
          await this.sleep(120);
          var center = this.centerPoint();
          var half = Math.ceil(this.deck.length / 2);
          var left = this.deck.slice(0, half);
          var right = this.deck.slice(half);
          left.forEach((card, i) => this.applyCard(card, center.x - 130, center.y - i * 2, -8 + i * 1.5, i, 380));
          right.forEach((card, i) => this.applyCard(card, center.x + 130, center.y - i * 2, 8 - i * 1.5, i, 380));
          await this.sleep(430);
          var order = [];
          var l = 0;
          var r = 0;
          while (l < left.length || r < right.length) {
            if (l < left.length && (r >= right.length || Math.random() < 0.5)) order.push(left[l++]);
            else order.push(right[r++]);
          }
          for (var i = 0; i < order.length; i++) {
            this.applyCard(order[i], center.x, center.y, (i - 2) * 1.2, i + 10, 180);
            await this.sleep(100);
          }
          this.deck = order;
          await this.sleep(280);
          await this.fanOut(480);
          this.isShuffling = false;
          Tadhana.toast('Deck shuffled');
        },
        buildSpread: function() {
          return positions.map((pos, i) => {
            var card = window.TAROT_CARDS[this.selectedCardIndices[i]];
            return {
              position: pos.position,
              key: pos.key,
              labelClass: pos.labelClass,
              dotClass: pos.dotClass,
              name: card.name,
              sub: card.sub,
              img: card.img,
              text: card[pos.key]
            };
          });
        },
        revealReading: function() {
          if (this.isShuffling || this.isSplitting) return;
          if (this.selectedSlots.length < requiredCards) {
            if (requiredCards === 1) {
              this.selectedSlots = [2];
              this.selectedCardIndices = [this.pickCardIndex()];
            } else {
              Tadhana.toast('Please select three cards first');
              return;
            }
          }
          this.isSplitting = true;
          setTimeout(() => {
            var today = Tadhana.today();
            if (requiredCards === 1) {
              var card = window.TAROT_CARDS[this.selectedCardIndices[0]];
              this.activeCard = card;
              this.personalText = Tadhana.getPersonalReading(card);
              this.activeSpread = [];
              Tadhana.addHistory({ mode: 'single', date: today, cardName: card.name, cardSub: card.sub, cardImg: card.img, personal: this.personalText, past: card.past, present: card.present, future: card.future });
            } else {
              var spread = this.buildSpread();
              this.activeSpread = spread;
              this.activeCard = null;
              Tadhana.addHistory({ mode: 'three', date: today, cardName: '3 Card Reading', cardSub: 'Past - Present - Future', cardImg: spread[0].img, spread: spread });
            }
            this.revealed = true;
            this.isSplitting = false;
            Tadhana.toast('Your reading has been revealed');
          }, 820);
        }
      }
    });
  };

  document.addEventListener('DOMContentLoaded', function() {
    Tadhana.initStars();
    Tadhana.requireLogin();
  });
})();
