const COOKIE_NAME = "dicegame_userdata";
const ADMIN_USER = "sonsi";
const ADMIN_PASS = "asahara.sh.6";

let currentUser = null;

// Cookieの読み書き関数
function setCookie(name, value, days=365) {
  const expires = new Date(Date.now() + days*24*60*60*1000).toUTCString();
  document.cookie = name + "=" + encodeURIComponent(JSON.stringify(value)) + ";expires=" + expires + ";path=/";
}

function getCookie(name) {
  const c = document.cookie.split("; ").find(row => row.startsWith(name + "="));
  if (!c) return null;
  try {
    return JSON.parse(decodeURIComponent(c.split("=")[1]));
  } catch {
    return null;
  }
}

// 新規ユーザー作成
function createUser(username, password) {
  let users = getCookie(COOKIE_NAME) || {};
  if(users[username]) return false; // 既にある
  users[username] = {
    password,
    chips: 0,
    rank: "なし",
    userId: Math.random().toString(36).slice(2,10),
    lastWork: 0,
    totalBet: 0
  };
  setCookie(COOKIE_NAME, users);
  return true;
}

// ログイン処理
function loginUser(username, password) {
  const users = getCookie(COOKIE_NAME) || {};
  if (!users[username]) return false;
  if(users[username].password !== password) return false;
  currentUser = {...users[username]};
  currentUser.username = username;
  return true;
}

// ユーザーデータ更新
function updateUserData() {
  if (!currentUser) return;
  const users = getCookie(COOKIE_NAME) || {};
  users[currentUser.username] = currentUser;
  setCookie(COOKIE_NAME, users);
}

// UI表示切替
function showLogin(show) {
  document.getElementById("login-container").style.display = show ? "block" : "none";
  document.getElementById("register-container").style.display = "none";
  document.getElementById("game-container").style.display = show ? "none" : "block";
}

function showRegister(show) {
  document.getElementById("register-container").style.display = show ? "block" : "none";
  document.getElementById("login-container").style.display = show ? "none" : "block";
}

function showGame() {
  document.getElementById("login-container").style.display = "none";
  document.getElementById("register-container").style.display = "none";
  document.getElementById("game-container").style.display = "block";
  updateProfileUI();
  updateRankingUI();
}

// プロフィール表示更新
function updateProfileUI() {
  document.getElementById("profile-username").textContent = currentUser.username;
  document.getElementById("profile-chips").textContent = currentUser.chips.toLocaleString();
  document.getElementById("profile-rank").textContent = currentUser.rank;
  document.getElementById("profile-id").textContent = currentUser.userId;
}

// Workボタン処理
function work() {
  const now = Date.now();
  if(now - currentUser.lastWork < 60*60*1000){
    const remain = Math.ceil((60*60*1000 - (now - currentUser.lastWork))/60000);
    document.getElementById("work-msg").textContent = `再Workは${remain}分後に可能です。`;
    return;
  }
  const gain = Math.floor(200 + Math.random()*(5000-200));
  currentUser.chips += gain;
  currentUser.lastWork = now;
  updateUserData();
  updateProfileUI();
  document.getElementById("work-msg").textContent = `Work成功！${gain}円のチップを獲得しました。`;
  updateRankingUI();
}

// ダイスゲームのロジック
// 1.0102～9900の倍率を選択し、その倍率の範囲内の出目(1.00～10000)なら勝ち
// 出目は1.00～10000の小数点2桁まで
function playDice(betMultiplier, betAmount) {
  if (betAmount > currentUser.chips) {
    return {success:false, msg:"チップが足りません。"};
  }
  if (betMultiplier < 1.0102 || betMultiplier > 9900) {
    return {success:false, msg:"倍率は1.0102～9900の範囲で設定してください。"};
  }
  if (betAmount <= 0) {
    return {success:false, msg:"掛け金は1以上で指定してください。"};
  }

  // 出目1.00～10000の乱数（小数2桁）
  const roll = Math.random() * (10000 - 1) + 1;
  const rollRounded = Math.round(roll*100)/100;

  // 勝利範囲は 1.00～(10000 / betMultiplier)
  const threshold = 10000 / betMultiplier;
  let win = (rollRounded <= threshold);

  // チップ計算
  if(win){
    const profit = betAmount * (betMultiplier - 1);
    currentUser.chips += profit;
    currentUser.totalBet += betAmount;
  } else {
    currentUser.chips -= betAmount;
    currentUser.totalBet += betAmount;
  }

  updateUserData();
  updateRankIfNeeded();
  updateProfileUI();
  updateRankingUI();

  return {
    success:true,
    win,
    roll: rollRounded,
    threshold,
    betAmount,
    betMultiplier
  };
}

// ランク判定と昇格ボーナス
function updateRankIfNeeded() {
  const thresholds = [
    {name:"なし", min:0, bonus:0},
    {name:"ブロンズ", min:100000, bonus:4000},
    {name:"シルバー", min:1000000, bonus:10000},
    {name:"ゴールド", min:5000000, bonus:50000},
    {name:"プラチナ1", min:10000000, bonus:100000},
    {name:"プラチナ2", min:20000000, bonus:200000},
    {name:"プラチナ3", min:30000000, bonus:300000},
    {name:"プラチナ4", min:50000000, bonus:500000},
    {name:"プラチナ5", min:70000000, bonus:700000},
    {name:"ダイヤモンド1", min:100000000, bonus:1000000},
    {name:"ダイヤモンド2", min:200000000, bonus:2000000},
    {name:"ダイヤモンド3", min:300000000, bonus:3000000},
    {name:"ダイヤモンド4", min:400000000, bonus:4000000},
    {name:"ダイヤモンド5", min:500000000, bonus:5000000},
  ];

  let currentRankIndex = thresholds.findIndex(t => t.name === currentUser.rank);
  if(currentRankIndex === -1) currentRankIndex = 0;

  for(let i=thresholds.length-1; i>=0; i--){
    if(currentUser.totalBet >= thresholds[i].min){
      if(i > currentRankIndex){
        // 昇格ボーナス付与
        const bonus = thresholds[i].bonus;
        currentUser.chips += bonus;
        alert(`${thresholds[i].name}に昇格！ボーナス${bonus.toLocaleString()}円を獲得しました！`);
      }
      currentUser.rank = thresholds[i].name;
      break;
    }
  }
  updateUserData();
}

// UIのランキング更新
function updateRankingUI() {
  const users = getCookie(COOKIE_NAME) || {};
  const rankingList = Object.values(users)
    .sort((a,b) => b.chips - a.chips)
    .slice(0, 10);

  const ul = document.getElementById("ranking-list");
  ul.innerHTML = "";
  rankingList.forEach((u, i) => {
    const li = document.createElement("li");
    li.textContent = `${i+1}. ${u.userId} (${u.chips.toLocaleString()}円, ランク: ${u.rank})`;
    ul.appendChild(li);
  });
}

// 最高ベットボタン処理
function maxBet() {
  if (!currentUser) return;
  const maxBetAmount = currentUser.chips;
  document.getElementById("bet-amount").value = maxBetAmount > 0 ? maxBetAmount : 1;
}

// チップ送金処理
function sendChips(toUserId, amount) {
  if(amount <= 0) {
    return {success:false, msg:"送金額は1以上を指定してください。"};
  }
  if(amount > currentUser.chips) {
    return {success:false, msg:"送金額が保有チップを超えています。"};
  }
  const users = getCookie(COOKIE_NAME) || {};
  const toUser = Object.values(users).find(u => u.userId === toUserId);
  if(!toUser) {
    return {success:false, msg:"送金先ユーザーIDが見つかりません。"};
  }
  // 送金元マイナス
  currentUser.chips -= amount;
  // 送金先プラス
  toUser.chips += amount;

  // usersを書き戻し
  users[currentUser.username] = currentUser;
  const toUsername = Object.keys(users).find(k => users[k].userId === toUserId);
  users[toUsername] = toUser;

  setCookie(COOKIE_NAME, users);
  updateProfileUI();
  updateRankingUI();
  return {success:true, msg:`${toUserId}に${amount.toLocaleString()}円送金しました。`};
}

// 管理者権限チェック
function isAdmin() {
  return currentUser && currentUser.username === ADMIN_USER;
}

// イベント設定
document.addEventListener("DOMContentLoaded", () => {
  // ログインフォーム
  document.getElementById("login-form").onsubmit = e => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    if(loginUser(username, password)){
      showGame();
      if(isAdmin()){
        document.getElementById("admin-modal").style.display = "flex";
      }
    } else {
      alert("ユーザー名かパスワードが違います");
    }
  };

  // 新規作成フォーム切り替え
  document.getElementById("show-register").onclick = e => {
    e.preventDefault();
    showRegister(true);
  };
  document.getElementById("show-login").onclick = e => {
    e.preventDefault();
    showRegister(false);
  };

  // 新規作成処理
  document.getElementById("register-form").onsubmit = e => {
    e.preventDefault();
    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value;
    if(createUser(username, password)){
      alert("アカウント作成しました。ログインしてください。");
      showRegister(false);
    } else {
      alert("すでに同じユーザー名があります。");
    }
  };

  // ログアウト
  document.getElementById("logout-btn").onclick = () => {
    currentUser = null;
    showLogin(true);
  };

  // Workボタン
  document.getElementById("work-btn").onclick = () => {
    work();
  };

  // ベットボタン
  document.getElementById("bet-btn").onclick = () => {
    const multiplier = parseFloat(document.getElementById("bet-multiplier").value);
    const amount = parseInt(document.getElementById("bet-amount").value);
    const resultElem = document.getElementById("dice-result");

    // ダイス回転アニメーション表示
    resultElem.innerHTML = `<div id="dice-rolling">🎲</div>`;

    setTimeout(() => {
      const res = playDice(multiplier, amount);
      if(!res.success){
        resultElem.textContent = res.msg;
        return;
      }
      if(res.win){
        resultElem.textContent = `出目:${res.roll.toFixed(2)} 勝利！${(res.betAmount*(res.betMultiplier-1)).toLocaleString()}円獲得！`;
      } else {
        resultElem.textContent = `出目:${res.roll.toFixed(2)} 敗北。${res.betAmount.toLocaleString()}円失いました。`;
      }
    }, 1500);
  };

  // 最高ベットボタン
  document.getElementById("max-bet-btn").onclick = () => {
    maxBet();
  };

  // チップ送金ボタン
  document.getElementById("send-btn").onclick = () => {
    const toId = document.getElementById("send-to-id").value.trim();
    const amount = parseInt(document.getElementById("send-amount").value);
    const msgElem = document.getElementById("send-msg");
    const res = sendChips(toId, amount);
    msgElem.textContent = res.msg;
  };

  // 管理者モーダル閉じる
  document.getElementById("admin-close-btn").onclick = () => {
    document.getElementById("admin-modal").style.display = "none";
  };

  showLogin(true);
});
