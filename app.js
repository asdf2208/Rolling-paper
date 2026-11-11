// ============================================================
// 🔧 Supabase 설정 — 아래 두 줄을 본인의 값으로 바꿔주세요!
// ============================================================
const SUPABASE_URL = 'https://snycqtyytfzkxbnhgdzj.supabase.co';   // 예: https://abcdefg.supabase.co
const SUPABASE_KEY = 'sb_publishable_8nGVkkkcbfGEoIGFUREbxg_x8xpj2IG'; // 예: eyJhbGciOiJIUzI1NiIs...

// Supabase 클라이언트 (CDN 방식)
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// DOM 요소
// ============================================================
const memoForm = document.getElementById('memoForm');
const authorInput = document.getElementById('authorName');
const contentInput = document.getElementById('memoContent');
const charCount = document.getElementById('charCount');
const submitBtn = document.getElementById('submitBtn');
const memosGrid = document.getElementById('memosGrid');
const memoCountEl = document.getElementById('memoCount');
const loadingEl = document.getElementById('loading');
const emptyState = document.getElementById('emptyState');
const toast = document.getElementById('toast');

let selectedColor = '#FFF9C4';

// ============================================================
// 초기화
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    loadMemos();
    createFloatingHearts();
    setupColorPicker();
    setupCharCounter();
});

// ============================================================
// 떨어지는 하트 배경
// ============================================================
function createFloatingHearts() {
    const container = document.getElementById('heartsBg');
    const hearts = ['💕', '💗', '💖', '💝', '✨', '🌸', '🩷'];
    for (let i = 0; i < 15; i++) {
        const heart = document.createElement('div');
        heart.classList.add('floating-heart');
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.animationDuration = (8 + Math.random() * 12) + 's';
        heart.style.animationDelay = (Math.random() * 10) + 's';
        heart.style.fontSize = (14 + Math.random() * 16) + 'px';
        container.appendChild(heart);
    }
}

// ============================================================
// 색상 선택
// ============================================================
function setupColorPicker() {
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedColor = btn.dataset.color;
        });
    });
}

// ============================================================
// 글자 수 카운터
// ============================================================
function setupCharCounter() {
    contentInput.addEventListener('input', () => {
        charCount.textContent = contentInput.value.length;
    });
}

// ============================================================
// 메모 불러오기
// ============================================================
async function loadMemos() {
    loadingEl.style.display = 'block';
    emptyState.style.display = 'none';
    memosGrid.innerHTML = '';

    try {
        const { data, error } = await db
            .from('memos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        loadingEl.style.display = 'none';

        if (!data || data.length === 0) {
            emptyState.style.display = 'block';
            memoCountEl.textContent = '';
            return;
        }

        memoCountEl.textContent = `${data.length}개`;
        data.forEach(memo => renderMemo(memo));
    } catch (err) {
        loadingEl.style.display = 'none';
        console.error('메모 불러오기 실패:', err);
        showToast('메모를 불러오지 못했어요 😢', 'error');
    }
}

// ============================================================
// 메모 카드 렌더링
// ============================================================
function renderMemo(memo) {
    const card = document.createElement('div');
    card.classList.add('memo-card');
    card.style.backgroundColor = memo.color || '#FFF9C4';

    // 랜덤 회전 (-3도 ~ 3도)
    const rotate = (Math.random() * 6 - 3).toFixed(1);
    card.style.setProperty('--rotate', rotate + 'deg');

    const date = new Date(memo.created_at);
    const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

    card.innerHTML = `
        <div class="memo-content">${escapeHtml(memo.content)}</div>
        <div class="memo-footer">
            <span class="memo-author">- ${escapeHtml(memo.author)}</span>
            <span class="memo-date">${dateStr}</span>
        </div>
    `;

    memosGrid.appendChild(card);
}

// ============================================================
// 메모 저장
// ============================================================
memoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const author = authorInput.value.trim();
    const content = contentInput.value.trim();

    if (!author || !content) {
        showToast('이름과 메시지를 모두 입력해주세요!', 'error');
        return;
    }

    // 버튼 비활성화
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').style.display = 'none';
    submitBtn.querySelector('.btn-loading').style.display = 'inline';

    try {
        const { error } = await db
            .from('memos')
            .insert([{
                author: author,
                content: content,
                color: selectedColor
            }]);

        if (error) throw error;

        showToast('메모가 성공적으로 남겨졌어요! 💌', 'success');

        // 폼 초기화
        memoForm.reset();
        charCount.textContent = '0';
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        document.querySelector('.color-btn').classList.add('selected');
        selectedColor = '#FFF9C4';

        // 메모 새로고침
        await loadMemos();
    } catch (err) {
        console.error('메모 저장 실패:', err);
        showToast('메모 저장에 실패했어요 😢 다시 시도해주세요.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').style.display = 'inline';
        submitBtn.querySelector('.btn-loading').style.display = 'none';
    }
});

// ============================================================
// 토스트 메시지
// ============================================================
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================================
// XSS 방지용 HTML 이스케이프
// ============================================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

