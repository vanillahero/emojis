document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('emoji-grid');
  const searchInput = document.getElementById('search');
  const sizeSelect = document.getElementById('size-select');
  const toast = document.getElementById('toast');
  let emojis = [];
  const SYSTEM_FONT_STACK = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  let toastTimeout;
  let hoveredEmoji = null;

  function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        return Promise.resolve();
      } else {
        return Promise.reject(new Error("execCommand failed"));
      }
    } catch (err) {
      document.body.removeChild(textArea);
      return Promise.reject(err);
    }
  }
  fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data')
    .then(response => response.json())
    .then(data => {
      emojis = Object.values(data.emojis).map(e => ({
        id: e.id,
        native: e.skins[0].native,
        keywords: e.keywords
      }));
      displayEmojis(emojis);
    })
    .catch(error => {
      console.error('Error fetching emoji data:', error);
      grid.innerHTML = '<p style="color: #ff8a80;">Could not load emojis. Check connection.</p>';
    });

  function displayEmojis(emojiList) {
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    emojiList.forEach(emoji => {
      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'emoji';
      emojiSpan.textContent = emoji.native;
      emojiSpan.addEventListener('mouseenter', () => {
        hoveredEmoji = emoji;
        const size = sizeSelect.value;
        emojiSpan.title = `Left-click: Copy text\nRight-click: Download ${size}x${size} square PNG sprite\nAlt+X: Copy favicon HTML snippet`;
      });
      emojiSpan.addEventListener('mouseleave', () => {
        hoveredEmoji = null;
      });
      emojiSpan.addEventListener('click', () => {
        copyTextToClipboard(emoji.native).then(() => {
          showToast('Emoji copied!');
        }).catch(err => {
          console.error("Failed to copy:", err);
          showToast('Copy failed. Security restrictions.');
        });
      });
      emojiSpan.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        downloadSprite(emoji.native, emoji.id);
      });
      fragment.appendChild(emojiSpan);
    });
    grid.appendChild(fragment);
  }
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filteredEmojis = emojis.filter(emoji =>
      emoji.id.includes(query) || emoji.keywords.some(kw => kw.includes(query))
    );
    displayEmojis(filteredEmojis);
  });

  function drawEmojiToCanvas(emojiChar, size) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);
    const fontSize = Math.floor(size * 0.85);
    ctx.font = `${fontSize}px ${SYSTEM_FONT_STACK}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const centerX = size / 2;
    const centerY = size / 2;
    const verticalAdjustment = size * 0.05;
    ctx.fillText(emojiChar, centerX, centerY + verticalAdjustment);
    return canvas;
  }

  function downloadSprite(emojiChar, filename) {
    const targetSize = parseInt(sizeSelect.value);
    const canvas = drawEmojiToCanvas(emojiChar, targetSize);
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${filename}_${targetSize}x${targetSize}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Saved ${targetSize}x${targetSize} square PNG! 💾`);
  }

  function copyFaviconHtmlSnippet(emojiChar) {
    const encodedEmoji = encodeURIComponent(emojiChar);
    const snippet = `<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text x=%2250%22 y=%2275%22 font-size=%2280%22 text-anchor=%22middle%22>${encodedEmoji}</text></svg>">`;
    copyTextToClipboard(snippet)
      .then(() => {
        showToast(`Favicon HTML snippet copied! ${emojiChar} ✨`);
      })
      .catch(err => {
        console.error("Failed to copy favicon snippet:", err);
        showToast('Failed to copy favicon snippet.');
      });
  }


  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'x') {
      e.preventDefault();
      if (hoveredEmoji) {
        copyFaviconHtmlSnippet(hoveredEmoji.native);
      } else {
        showToast('Hover over an emoji first to copy the favicon snippet!');
      }
    }
  });

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2000);
  }
});