let currentMode = 'local';

document.addEventListener('DOMContentLoaded', () => {
  restoreGroqKey();
  bindModeTabEvents();
  bindGroqKeyEvent();
  loadOllamaModels();
});

// ── 설정 복원 ──────────────────────────────────────────
function restoreGroqKey() {
  const saved = localStorage.getItem('groq_key') || '';
  document.getElementById('groq-key').value = saved;
  if (saved) loadGroqModels();
}

// ── 모드 탭 ────────────────────────────────────────────
function bindModeTabEvents() {
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMode = tab.dataset.mode;
      updateSettingsVisibility();
    });
  });
}

function updateSettingsVisibility() {
  const showOllama = currentMode !== 'internet';
  const showGroq = currentMode !== 'local';
  document.getElementById('setting-ollama').classList.toggle('hidden', !showOllama);
  document.getElementById('setting-groq').classList.toggle('hidden', !showGroq);
  document.getElementById('setting-groq-model').classList.toggle('hidden', !showGroq);
}

// ── Groq API 키 ────────────────────────────────────────
function bindGroqKeyEvent() {
  document.getElementById('groq-key').addEventListener('change', () => {
    const key = document.getElementById('groq-key').value.trim();
    localStorage.setItem('groq_key', key);
    loadGroqModels();
  });
}

// ── 모델 목록 로드 ─────────────────────────────────────
function loadOllamaModels() {
  fetch('/models/ollama')
    .then(r => r.json())
    .then(({ models }) => {
      const select = document.getElementById('ollama-model');
      select.innerHTML = models.length
        ? models.map(m => `<option value="${m}">${m}</option>`).join('')
        : '<option value="">설치된 모델 없음</option>';
    })
    .catch(() => {
      document.getElementById('ollama-model').innerHTML = '<option value="">Ollama 연결 실패</option>';
    });
}

function loadGroqModels() {
  const key = document.getElementById('groq-key').value.trim();
  if (!key) return;
  const select = document.getElementById('groq-model');
  select.innerHTML = '<option value="">불러오는 중...</option>';
  fetch(`/models/groq?api_key=${encodeURIComponent(key)}`)
    .then(r => r.json())
    .then(({ models }) => {
      if (!models.length) {
        select.innerHTML = '<option value="">모델 없음 (키 확인)</option>';
        return;
      }
      select.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
      const preferred = models.find(m => m.includes('70b')) || models[0];
      select.value = preferred;
    })
    .catch(() => { select.innerHTML = '<option value="">불러오기 실패</option>'; });
}

// ── 요약 ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('submit-btn').addEventListener('click', summarize);
});

async function summarize() {
  const text = document.getElementById('meeting-text').value.trim();
  if (!text) { alert('회의록 내용을 입력해주세요.'); return; }

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = '분석 중...';

  const ollamaModel = document.getElementById('ollama-model').value;
  const groqModel = document.getElementById('groq-model').value;
  const resultsEl = document.getElementById('results');

  if (currentMode === 'compare') {
    resultsEl.innerHTML = buildResultBox('box-ollama', '🖥️ Ollama (로컬)', 'local', ollamaModel) +
                          buildResultBox('box-groq', '☁️ Groq (클라우드)', 'cloud', groqModel);
  } else {
    const label = currentMode === 'local' ? '🖥️ Ollama (로컬)' : '☁️ Groq (클라우드)';
    const badgeClass = currentMode === 'local' ? 'local' : 'cloud';
    const modelName = currentMode === 'local' ? ollamaModel : groqModel;
    resultsEl.innerHTML = buildResultBox('box-single', label, badgeClass, modelName);
  }

  bindCopyButtons();

  const startTime = Date.now();
  try {
    const res = await fetch('/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        mode: currentMode,
        groq_key: document.getElementById('groq-key').value,
        ollama_model: ollamaModel,
        groq_model: groqModel,
      }),
    });
    const data = await res.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (currentMode === 'compare') {
      renderResult('box-ollama', data.ollama, data.ollama_error, elapsed);
      renderResult('box-groq', data.groq, data.groq_error, elapsed);
    } else {
      const content = currentMode === 'local' ? data.ollama : data.groq;
      const error = currentMode === 'local' ? data.ollama_error : data.groq_error;
      renderResult('box-single', content, error, elapsed);
    }
  } catch {
    document.querySelector('.result-content').textContent = '서버 오류가 발생했습니다.';
  }

  btn.disabled = false;
  btn.textContent = '요약하기';
}

// ── 결과 렌더링 ────────────────────────────────────────
function buildResultBox(id, title, badgeClass, modelName) {
  return `
    <div class="result-box" id="${id}">
      <div class="result-header">
        <h3>${title}</h3>
        <div class="result-header-right">
          <span class="badge ${badgeClass}">${modelName}</span>
          <button class="btn-copy hidden" data-target="${id}">복사</button>
        </div>
      </div>
      <div class="result-content loading">분석 중...</div>
    </div>`;
}

function renderResult(boxId, content, error, elapsed) {
  const box = document.getElementById(boxId);
  const contentEl = box.querySelector('.result-content');
  const copyBtn = box.querySelector('.btn-copy');

  if (error) {
    contentEl.innerHTML = `<span class="error-msg">${error}</span>`;
  } else if (content) {
    contentEl.innerHTML = formatMarkdown(content);
    box.insertAdjacentHTML('beforeend', `<div class="timer">⏱️ ${elapsed}초</div>`);
    copyBtn.classList.remove('hidden');  // 결과 나왔을 때만 복사 버튼 표시
  }
}

// ── 복사 ───────────────────────────────────────────────
function bindCopyButtons() {
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const box = document.getElementById(btn.dataset.target);
      const text = box.querySelector('.result-content').innerText;
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = '복사됨 ✓';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '복사';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
  });
}

// ── 마크다운 포맷 ──────────────────────────────────────
function formatMarkdown(text) {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^- (.+)$/gm, '• $1<br>')
    .replace(/\n/g, '<br>');
}
