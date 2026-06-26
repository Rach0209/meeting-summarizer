let currentMode = 'local';

document.addEventListener('DOMContentLoaded', async () => {
  restoreGroqKey();
  bindModeTabEvents();
  bindGroqKeyEvent();
  loadOllamaModels();
  await loadCustomPrompts();
  initPromptUI();
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
  document.getElementById('model-help-btn').addEventListener('click', () => {
    document.getElementById('model-modal').classList.remove('hidden');
  });
  document.getElementById('modal-close-btn').addEventListener('click', () => {
    document.getElementById('model-modal').classList.add('hidden');
  });
  document.getElementById('model-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });
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
    const prompt = getCurrentPrompt();
    const res = await fetch('/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        mode: currentMode,
        groq_key: document.getElementById('groq-key').value,
        ollama_model: ollamaModel,
        groq_model: groqModel,
        system_prompt: prompt.system,
        user_prompt: prompt.user,
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

async function loadPromptsPath() {
  const res = await fetch('/api/settings');
  const settings = await res.json();
  if (settings.prompts_path) {
    document.getElementById('prompts-path').value = settings.prompts_path;
  }
}

// ── 프롬프트 템플릿 ────────────────────────────────────
function initPromptUI() {
  renderPromptSelect();
  renderPromptList();

  document.getElementById('prompt-manage-btn').addEventListener('click', () => {
    renderPromptList();
    document.getElementById('prompt-modal').classList.remove('hidden');
    showPromptForm(false);
  });
  document.getElementById('prompt-modal-close').addEventListener('click', () => {
    document.getElementById('prompt-modal').classList.add('hidden');
  });
  document.getElementById('prompt-modal').addEventListener('click', (e) => {
    if (e.target !== e.currentTarget) return;
    const formVisible = document.getElementById('prompt-form').style.display !== 'none';
    const hasInput = document.getElementById('prompt-name').value ||
                     document.getElementById('prompt-system').value ||
                     document.getElementById('prompt-user').value;
    if (formVisible && hasInput) {
      if (!confirm('작성 중인 내용이 있어요. 닫을까요?')) return;
    }
    e.currentTarget.classList.add('hidden');
  });
  document.getElementById('prompt-add-btn').addEventListener('click', () => {
    clearPromptForm();
    showPromptForm(true);
  });

  // 저장 위치 설정
  loadPromptsPath();
  document.getElementById('browse-btn').addEventListener('click', async () => {
    const res = await fetch('/api/browse');
    const { path } = await res.json();
    if (path) document.getElementById('prompts-path').value = path;
  });
  document.getElementById('path-save-btn').addEventListener('click', async () => {
    const path = document.getElementById('prompts-path').value.trim();
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompts_path: path }),
    });
    await loadCustomPrompts();
    renderPromptList();
    renderPromptSelect();
    alert('저장 위치가 변경됐어요. 새 위치에서 템플릿을 불러왔습니다.');
  });
  document.getElementById('prompt-form-cancel').addEventListener('click', () => showPromptForm(false));
  document.getElementById('prompt-form-save').addEventListener('click', savePromptForm);
}

function renderPromptSelect() {
  const select = document.getElementById('prompt-select');
  const current = select.value;
  select.innerHTML = getAllPrompts()
    .map(p => `<option value="${p.id}">${p.name}</option>`)
    .join('');
  if (current) select.value = current;
}

function renderPromptList() {
  const list = document.getElementById('prompt-list');
  list.innerHTML = getAllPrompts().map(p => {
    const isBuiltIn = BUILT_IN_PROMPTS.some(b => b.id === p.id);
    return `
      <div class="prompt-list-item ${isBuiltIn ? 'built-in' : ''}">
        <span class="item-name" data-id="${p.id}">${p.name}</span>
        ${isBuiltIn ? '' : `<button class="btn-delete" data-id="${p.id}">✕</button>`}
      </div>`;
  }).join('');

  list.querySelectorAll('.item-name').forEach(el => {
    el.addEventListener('click', () => {
      const p = getPromptById(el.dataset.id);
      if (!p) return;
      const isBuiltIn = BUILT_IN_PROMPTS.some(b => b.id === p.id);
      if (isBuiltIn) return;
      document.getElementById('prompt-edit-id').value = p.id;
      document.getElementById('prompt-name').value = p.name;
      document.getElementById('prompt-system').value = p.system;
      document.getElementById('prompt-user').value = p.user;
      document.getElementById('prompt-form-title').textContent = '템플릿 수정';
      showPromptForm(true);
    });
  });

  list.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('삭제할까요?')) return;
      await deleteCustomPrompt(btn.dataset.id);
      renderPromptList();
      renderPromptSelect();
    });
  });
}

function showPromptForm(show) {
  document.getElementById('prompt-form').style.display = show ? 'flex' : 'none';
  document.getElementById('prompt-add-btn').style.display = show ? 'none' : 'block';
}

function clearPromptForm() {
  document.getElementById('prompt-edit-id').value = '';
  document.getElementById('prompt-name').value = '';
  document.getElementById('prompt-system').value = '';
  document.getElementById('prompt-user').value = '';
  document.getElementById('prompt-form-title').textContent = '새 템플릿 추가';
}

async function savePromptForm() {
  const name = document.getElementById('prompt-name').value.trim();
  const system = document.getElementById('prompt-system').value.trim();
  const user = document.getElementById('prompt-user').value.trim();
  if (!name || !system || !user) { alert('모든 항목을 입력해주세요.'); return; }
  if (!user.includes('{text}')) { alert('유저 프롬프트에 {text} 가 포함되어야 합니다.'); return; }

  const id = document.getElementById('prompt-edit-id').value || `custom_${Date.now()}`;
  await saveCustomPrompt({ id, name, system, user });
  renderPromptList();
  renderPromptSelect();
  showPromptForm(false);
  clearPromptForm();
}

function getCurrentPrompt() {
  const id = document.getElementById('prompt-select').value;
  return getPromptById(id) || BUILT_IN_PROMPTS[0];
}

// ── 마크다운 포맷 ──────────────────────────────────────
function formatMarkdown(text) {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^- (.+)$/gm, '• $1<br>')
    .replace(/\n/g, '<br>');
}
