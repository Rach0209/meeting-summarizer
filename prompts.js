const BUILT_IN_PROMPTS = [
  {
    id: 'meeting',
    name: '📋 회의록 정리',
    system: '당신은 회의록 분석 전문가입니다. 주어진 내용을 명확하고 간결하게 정리해주세요. 한국어로 답변해주세요.',
    user: `다음 회의록을 한국어로 아래 형식에 맞게 정리해주세요:

## 핵심 요약
(3줄 이내로 핵심 내용 요약)

## 결정 사항
(회의에서 결정된 사항들을 목록으로)

## 액션 아이템
(담당자: 해야 할 일 형식으로)

---
{text}`,
  },
  {
    id: 'email',
    name: '✉️ 이메일 요약',
    system: '당신은 이메일 분석 전문가입니다. 이메일의 핵심을 간결하게 정리해주세요. 한국어로 답변해주세요.',
    user: `다음 이메일을 한국어로 아래 형식에 맞게 요약해주세요:

## 발신자 / 목적
(누가 무엇을 원하는지)

## 핵심 내용
(주요 내용 요약)

## 필요한 조치
(답장이나 처리가 필요한 사항)

---
{text}`,
  },
  {
    id: 'legal',
    name: '⚖️ 법률/계약서 검토',
    system: '당신은 법률 문서 분석 전문가입니다. 문서의 핵심 조항을 쉽게 정리해주세요. 한국어로 답변해주세요.',
    user: `다음 법률/계약 문서를 한국어로 아래 형식에 맞게 정리해주세요:

## 문서 개요
(문서의 목적과 당사자)

## 핵심 조항
(중요한 조건과 의무사항)

## 주의사항
(특별히 확인이 필요한 항목)

---
{text}`,
  },
  {
    id: 'tech',
    name: '💻 기술 문서 요약',
    system: '당신은 기술 문서 분석 전문가입니다. 복잡한 내용을 쉽게 정리해주세요. 한국어로 답변해주세요.',
    user: `다음 기술 문서를 한국어로 아래 형식에 맞게 요약해주세요:

## 개요
(무엇에 대한 문서인지)

## 핵심 내용
(주요 기능, 방법, 개념)

## 적용 방법 / 결론
(실제로 어떻게 활용할 수 있는지)

---
{text}`,
  },
];

let _customPrompts = [];

async function loadCustomPrompts() {
  const saved = localStorage.getItem('custom_prompts');
  _customPrompts = saved ? JSON.parse(saved) : [];
}

async function persistCustomPrompts() {
  localStorage.setItem('custom_prompts', JSON.stringify(_customPrompts));
}

function getAllPrompts() {
  return [...BUILT_IN_PROMPTS, ..._customPrompts];
}

function getPromptById(id) {
  return getAllPrompts().find(p => p.id === id);
}

async function saveCustomPrompt(prompt) {
  const idx = _customPrompts.findIndex(p => p.id === prompt.id);
  if (idx >= 0) _customPrompts[idx] = prompt;
  else _customPrompts.push(prompt);
  await persistCustomPrompts();
}

async function deleteCustomPrompt(id) {
  _customPrompts = _customPrompts.filter(p => p.id !== id);
  await persistCustomPrompts();
}

function exportCustomPrompts() {
  if (!_customPrompts.length) {
    alert('내보낼 커스텀 프롬프트가 없어요.');
    return;
  }
  const blob = new Blob([JSON.stringify(_customPrompts, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'custom_prompts.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function importCustomPrompts(file) {
  const text = await file.text();
  let imported;
  try {
    imported = JSON.parse(text);
  } catch {
    throw new Error('JSON 파싱 오류: 파일 형식을 확인해주세요.');
  }
  if (!Array.isArray(imported)) throw new Error('올바른 프롬프트 파일이 아닙니다.');
  const valid = imported.every(p => p.id && p.name && p.system && p.user);
  if (!valid) throw new Error('필수 항목(id, name, system, user)이 누락된 항목이 있어요.');

  // 기존과 합치되 id 중복 시 가져온 파일 기준으로 덮어씀
  const map = new Map(_customPrompts.map(p => [p.id, p]));
  imported.forEach(p => map.set(p.id, p));
  _customPrompts = [...map.values()];
  await persistCustomPrompts();
  return imported.length;
}
