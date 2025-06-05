import {
  getCurrentUser,
  updateCurrentUser,
  getUserList,
  saveUserList,
  checkRankUp,
  adminIDs
} from './utils.js';

const user = getCurrentUser();
if (!user) {
  alert("ログインしてください");
  window.location.href = "index.html";
}

document.getElementById("chipsDisplay").textContent = user.chips;
document.getElementById("betAmount").value = user.chips;
document.getElementById("maxBetBtn").addEventListener("click", () => {
  document.getElementById("betAmount").value = user.chips;
});

const workBtn = document.getElementById("workBtn");
const workMsg = document.getElementById("workMsg");

function updateWorkButton() {
  const now = Date.now();
  const diff = now - user.lastWork;
  if (diff < 3600000) {
    const mins = Math.ceil((3600000 - diff) / 60000);
    workBtn.disabled = true;
    workMsg.textContent = `あと ${mins} 分で再度Work可能`;
  } else {
    workBtn.disabled = false;
    workMsg.textContent = "";
  }
}
updateWorkButton();

workBtn.addEventListener("click", () => {
  const now = Date.now();
  if (now - user.lastWork < 3600000) return;

  const reward = Math.floor(Math.random() * (5000 - 200 + 1)) + 200;
  user.chips += reward;
  user.lastWork = now;
  updateCurrentUser(user);
  document.getElementById("chipsDisplay").textContent = user.chips;
  workMsg.textContent = `Work完了！ +${reward} チップ`;
  updateWorkButton();
});

// ダイスロール処理
document.getElementById("rollDiceBtn").addEventListener("click", () => {
  const bet = parseInt(document.getElementById("betAmount").value);
  const multi = parseFloat(document.getElementById("targetMultiplier").value);
  const resultText = document.getElementById("gameResult");

  if (bet <= 0 || multi < 1.0102 || multi > 9900) {
    resultText.textContent = "入力が不正です";
    return;
  }
  if (bet > user.chips) {
    resultText.textContent = "所持チップが足りません";
    return;
  }

  const winChance = 99 / multi;
  const roll = Math.random() * 100;

  let result = "";
  if (roll < winChance) {
    const payout = Math.floor(bet * multi);
    user.chips += payout - bet;
    result = `勝ち！ +${payout - bet}チップ`;
  } else {
    user.chips -= bet;
    result = `負け！ -${bet}チップ`;
  }

  user.totalBet += bet;
  checkRankUp(user);
  updateCurrentUser(user);
  document.getElementById("chipsDisplay").textContent = user.chips;
  resultText.textContent = result;
  animateDice(roll, winChance);
  updateRanking();
});

// アニメーション部分
function animateDice(roll, winChance) {
  const canvas = document.getElementById("diceCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 200, 200);
  ctx.beginPath();
  ctx.arc(100, 100, 60, 0, 2 * Math.PI);
  ctx.fillStyle = roll < winChance ? "lime" : "red";
  ctx.fill();
  ctx.font = "20px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Roll: " + roll.toFixed(2), 50, 105);
}

// ランキング表示
function updateRanking() {
  const users = getUserList();
  const sorted = [...users].sort((a, b) => b.chips - a.chips).slice(0, 10);
  const rankingList = document.getElementById("rankingList");
  rankingList.innerHTML = "";

  sorted.forEach((u, i) => {
    const li = document.createElement("li");
    li.textContent = `${u.username} - ${u.chips}チップ`;
    if (u.id === user.id) li.style.color = "yellow";
    rankingList.appendChild(li);
  });
}
updateRanking();

// 管理者リンク
if (adminIDs.includes(user.id)) {
  const link = document.createElement("a");
  link.href = "admin.html";
  link.textContent = " | 管理者ページ";
  document.getElementById("adminLinkContainer").appendChild(link);
}
