// --- Cookie操作 ---
function setCookie(name, value, days = 7) {
  const d = new Date();
  d.setTime(d.getTime() + days*24*60*60*1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
}
function getCookie(name) {
  const cookies = document.cookie.split('; ');
  for (const c of cookies) {
    if (c.startsWith(name + '=')) return decodeURIComponent(c.split('=')[1]);
  }
  return null;
}

// --- ユーザーID生成 ---
function generateUserId() {
  return 'xxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

// --- 要素取得 ---
const loginScreen = document.getElementById('login-screen');
const gameScreen = document.getElementById('game-screen');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const workBtn = document.getElementById('work-btn');
const rollBtn = document.getElementById('roll-btn');
const maxBetBtn = document.getElementById('max-bet-btn');
const dice = document.getElementById('dice');
const rollResult = document.getElementById('roll-result');
const targetInput = document.getElementById('target');
const betAmountInput = document.getElementById('bet-amount');
const balanceSpan = document.getElementById('balance');
const bankBalanceSpan = document.getElementById('bank-balance');
const displayUsername = document.getElementById('display-username');
const tipToInput = document.getElementById('tip-to');
const tipAmountInput = document.getElementById('tip-amount');
const sendTipBtn = document.getElementById('send-tip-btn');
const tipResult = document.getElementById('tip-result');
const leaderboardOl = document.getElementById('leaderboard');
const adminIndicator = document.getElementById('admin-indicator');
const loginError = document.getElementById('login-error');
const historyList = document.getElementById('history-list');

let user = null;
let isAdmin = false;
let adminIds = [];

// --- ユーザーデータの読み書き ---
function saveUsers(users) {
  setCookie('users', JSON.stringify(users), 7);
}
function loadUsers() {
  const usersStr = getCookie('users');
  if (usersStr) {
    try { return JSON.parse(usersStr); }
    catch { return {}; }
  }
  return {};
}
function saveUser(u) {
  let users = loadUsers();
  users[u.username] = u;
  saveUsers(users);
  setCookie('currentUser', u.username, 7);
}
function loadCurrentUser() {
  const username = getCookie('currentUser');
  if (!username) return null;
  const users = loadUsers();
  return users[username] || null;
}

// --- 履歴保存・取得 ---
function addHistory(text) {
  user.history = user.history || [];
  user.history.unshift(`${new Date().toLocaleString()} - ${text}`);
  if(user.history.length > 50) user.history.pop();
  saveUser(user);
  renderHistory();
}
function renderHistory() {
  historyList.innerHTML = '';
  if (!user.history || user.history.length === 0) {
    historyList.innerHTML = '<li>履歴がありません。</li>';
    return;
  }
  user.history.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    historyList.appendChild(li);
  });
}

// --- ランキング更新 ---
function updateLeaderboard() {
  const users = loadUsers();
  const list = Object.values(users).sort((a,b) => (b.balance || 0) - (a.balance || 0));
  leaderboardOl.innerHTML = '';
  list.slice(0, 10).forEach(u => {
    const li = document.createElement('li');
    li.textContent = `${u.username}: ¥${u.balance || 0}`;
    leaderboardOl.appendChild(li);
  });
}

// --- UI更新 ---
function updateUI() {
  displayUsername.textContent = user.username;
  balanceSpan.textContent = user.balance;
  bankBalanceSpan.textContent = user.bankBalance
