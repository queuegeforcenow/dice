(() => {
  'use strict';

  // ----- 定数 -----

  const STORAGE_USERS = "stake_users_v2";
  const STORAGE_LOGIN = "stake_login_v2";

  // ランク定義（掛け金累計とボーナス）
  const RANKS = [
    { name:"なし", min:0, bonus:0, class:"" },
    { name:"ブロンズ", min:100000, bonus:4000, class:"rank-bronze" },
    { name:"シルバー", min:1000000, bonus:10000, class:"rank-silver" },
    { name:"ゴールド", min:5000000, bonus:50000, class:"rank-gold" },
    { name:"プラチナ1", min:10000000, bonus:100000, class:"rank-platinum" },
    { name:"プラチナ2", min:20000000, bonus:200000, class:"rank-platinum" },
    { name:"プラチナ3", min:30000000, bonus:300000, class:"rank-platinum" },
    { name:"プラチナ4", min:50000000, bonus:500000, class:"rank-platinum" },
    { name:"プラチナ5", min:70000000, bonus:700000, class:"rank-platinum" },
    { name:"ダイヤモンド1", min:100000000, bonus:1000000, class:"rank-diamond" },
    { name:"ダイヤモンド2", min:200000000, bonus:2000000, class:"rank-diamond" },
    { name:"ダイヤモンド3", min:300000000, bonus:3000000, class:"rank-diamond" },
    { name:"ダイヤモンド4", min:400000000, bonus:4000000, class:"rank-diamond" },
    { name:"ダイヤモンド5", min:500000000, bonus:5000000, class:"rank-diamond" }
  ];

  // 管理者IDリスト（admin.jsonの代わり）
  const ADMIN_USERS = ["admin", "superuser"];

  // ----- DOM -----

  const pages = {
    login: document.getElementById("loginPage"),
    game: document.getElementById("gamePage"),
    profile: document.getElementById("profilePage"),
    ranking: document.getElementById("rankingPage"),
    admin: document.getElementById("adminPage"),
  };
  const navBar = document.getElementById("navBar");
  const navButtons = navBar.querySelectorAll("button[data-page]");
  const adminNavBtn = document.getElementById("adminNavBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // login page
  const loginUsername = document.getElementById("loginUsername");
  const loginPassword = document.getElementById("loginPassword");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const loginMsg = document.getElementById("loginMsg");

  // game page
  const gameUsername = document.getElementById("gameUsername");
  const gameChips = document.getElementById("gameChips");
  const workBtn = document.getElementById("workBtn");
  const workMsg = document.getElementById("workMsg");
  const betAmountInput = document.getElementById("betAmount");
  const maxBetBtn = document.getElementById("maxBetBtn");
  const rollDiceBtn = document.getElementById("rollDiceBtn");
  const diceResult = document.getElementById("diceResult");
  const gameMsg = document.getElementById("gameMsg");
  const diceCanvas = document.getElementById("diceCanvas");

  // profile page
  const profileUsername = document.getElementById("profileUsername");
  const profileUserId = document.getElementById("profileUserId");
  const profileChips = document.getElementById("profileChips");
  const profileRank = document.getElementById("profileRank");
  const sendToUserId = document.getElementById("sendToUserId");
  const sendAmount = document.getElementById("sendAmount");
  const sendChipBtn = document.getElementById("sendChipBtn");
  const sendMsg = document.getElementById("sendMsg");

  // ranking page
  const rankingTableBody = document.getElementById("rankingTableBody");

  // admin page
  const adminUserTableBody = document.getElementById("adminUserTableBody");
  const adminResetWorkBtn = document.getElementById("adminResetWorkBtn");

  // ----- ユーティリティ -----

  function simpleHash(str) {
    // 簡易ハッシュ(セキュリティは低いので本番向けではない)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString();
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_USERS) || "{}");
    } catch {
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  }

  function getUser(username) {
    return getUsers()[username];
  }

  function updateUser(user) {
    const users = getUsers();
    users[user.username] = user;
    saveUsers(users);
  }

  function setCurrentUser(username) {
    localStorage.setItem(STORAGE_LOGIN, username);
  }

  function getCurrentUser() {
    return localStorage.getItem(STORAGE_LOGIN);
  }

  function logout() {
    localStorage.removeItem(STORAGE_LOGIN);
    showPage("login");
    navBar.classList.add("hidden");
  }

  // ランク判定と付与ボーナス
  function getRank(totalBet) {
    let rank = RANKS[0];
    for (const r of RANKS) {
      if (totalBet >= r.min) rank = r;
    }
    return rank;
  }

  // ユーザー作成
  function createUser(username, password) {
    const users = getUsers();
    if (users[username]) return false;
    users[username] = {
      username,
      password: simpleHash(password),
      chips: 10000,
      lastWork: 0,
      totalBet: 0,
      id: Math.random().toString(36).slice(2, 10),
    };
    saveUsers(users);
    return true;
  }

  // ----- ページ制御 -----

  function showPage(pageName) {
    for (const p in pages) {
      pages[p].classList.toggle("hidden", p !== pageName);
    }
    if (pageName !== "login") {
      navBar.classList.remove("hidden");
      // 管理者ボタンの表示
      const user = getUser(getCurrentUser());
      if (user && ADMIN_USERS.includes(user.username)) {
        adminNavBtn.classList.remove("hidden");
      } else {
        adminNavBtn.classList.add("hidden");
      }
    } else {
      navBar.classList.add("hidden");
    }
  }

  // ----- ログイン・登録処理 -----

  loginBtn.onclick = () => {
    loginMsg.textContent = "";
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    if (!username.match(/^[a-zA-Z0-9]+$/)) {
      loginMsg.textContent = "ユーザー名は半角英数字のみです。";
      return;
    }
    if (!password) {
      loginMsg.textContent = "パスワードを入力してください。";
      return;
    }
    const user = getUser(username);
    if (!user) {
      loginMsg.textContent = "ユーザーが存在しません。";
      return;
    }
    if (user.password !== simpleHash(password)) {
      loginMsg.textContent = "パスワードが違います。";
      return;
    }
    setCurrentUser(username);
    loginUsername.value = "";
    loginPassword.value = "";
    loginMsg.textContent = "";
    showPage("game");
    renderGamePage();
  };

  registerBtn.onclick = () => {
    loginMsg.textContent = "";
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    if (!username.match(/^[a-zA-Z0-9]+$/)) {
      loginMsg.textContent = "ユーザー名は半角英数字のみです。";
      return;
    }
    if (password.length < 4) {
      loginMsg.textContent = "パスワードは4文字以上にしてください。";
      return;
    }
    if (createUser(username, password)) {
      loginMsg.textContent = "登録成功！ログインしてください。";
    } else {
      loginMsg.textContent = "ユーザー名が既に使われています。";
    }
  };

  logoutBtn.onclick = () => {
    logout();
  };

  // ナビゲーション切り替え
  navButtons.forEach(btn => {
    btn.onclick = () => {
      showPage(btn.getAttribute("data-page"));
      if (btn.getAttribute("data-page") === "game") {
        renderGamePage();
      } else if (btn.getAttribute("data-page") === "profile") {
        renderProfilePage();
      } else if (btn.getAttribute("data-page") === "ranking") {
        renderRankingPage();
      } else if (btn.getAttribute("data-page") === "admin") {
        renderAdminPage();
      }
    };
  });

  // ----- ゲーム画面 -----

  const WORK_COOLDOWN = 3600 * 1000; // 1時間

  workBtn.onclick = () => {
    const user = getUser(getCurrentUser());
    const now = Date.now();
    if (now - user.lastWork < WORK_COOLDOWN) {
      const waitMin = Math.ceil((WORK_COOLDOWN - (now - user.lastWork)) / 60000);
      workMsg.textContent = `まだ${waitMin}分待ってください。`;
      workMsg.className = "error";
      return;
    }
    user.chips += 1000;
    user.lastWork = now;
    updateUser(user);
    renderGamePage();
    workMsg.textContent = "Work成功！チップを1000獲得しました。";
    workMsg.className = "success";
  };

  maxBetBtn.onclick = () => {
    const user = getUser(getCurrentUser());
    let maxBet = user.chips;
    if (maxBet > 10000000) maxBet = 10000000;
    betAmountInput.value = maxBet;
  };

  const diceCtx = diceCanvas.getContext("2d");
  const diceSize = 200;

  function drawDice(num) {
    diceCtx.clearRect(0, 0, diceSize, diceSize);

    diceCtx.fillStyle = "#222";
    diceCtx.strokeStyle = "#0f0";
    diceCtx.lineWidth = 5;
    diceCtx.fillRect(10, 10, diceSize - 20, diceSize - 20);
    diceCtx.strokeRect(10, 10, diceSize - 20, diceSize - 20);

    diceCtx.fillStyle = "#0f0";
    const dotRadius = 12;
    const positions = [
      [], // 0 dummy
      [[100, 100]],
      [[60, 60], [140, 140]],
      [[60, 60], [100, 100], [140, 140]],
      [[60, 60], [60, 140], [140, 60], [140, 140]],
      [[60, 60], [60, 140], [100, 100], [140, 60], [140, 140]],
      [[60, 60], [60, 140], [100, 70], [100, 130], [140, 60], [140, 140]]
    ];

    positions[num].forEach(([x, y]) => {
      diceCtx.beginPath();
      diceCtx.arc(x, y, dotRadius, 0, Math.PI * 2);
      diceCtx.fill();
    });
  }

  rollDiceBtn.onclick = () => {
    const user = getUser(getCurrentUser());
    let bet = Number(betAmountInput.value);

    gameMsg.textContent = "";
    diceResult.textContent = "";

    if (!bet || bet < 200 || bet > 10000000) {
      gameMsg.textContent = "掛け金は200〜10,000,000の間で入力してください。";
      gameMsg.className = "error";
      return;
    }
    if (bet > user.chips) {
      gameMsg.textContent = "所持チップ以上の掛け金はかけられません。";
      gameMsg.className = "error";
      return;
    }

    // ダイス2回ロール
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const sum = dice1 + dice2;

    drawDice(dice1);
    setTimeout(() => drawDice(dice2), 500);

    setTimeout(() => {
      diceResult.textContent = `出目は${dice1} + ${dice2} = ${sum} でした。`;
      // 勝利条件: 7以上なら勝ち（例）
      if (sum >= 7) {
        // 配当2倍
        const winAmount = bet * 2;
        user.chips += winAmount;
        gameMsg.textContent = `勝ち！${winAmount}円獲得しました。`;
        gameMsg.className = "success";
      } else {
        user.chips -= bet;
        gameMsg.textContent = `負け... ${bet}円失いました。`;
        gameMsg.className = "error";
      }
      user.totalBet += bet;
      updateUser(user);
      renderGamePage();
    }, 1000);
  };

  function renderGamePage() {
    const user = getUser(getCurrentUser());
    gameUsername.textContent = user.username;
    gameChips.textContent = user.chips.toLocaleString();
    workMsg.textContent = "";
    gameMsg.textContent = "";
    diceResult.textContent = "";
    betAmountInput.value = 1000;
    drawDice(1);
  }

  // ----- プロフィールページ -----

  sendChipBtn.onclick = () => {
    sendMsg.textContent = "";
    const fromUser = getUser(getCurrentUser());
    const toUserId = sendToUserId.value.trim();
    const amount = Number(sendAmount.value);

    if (!toUserId) {
      sendMsg.textContent = "送金先ユーザーIDを入力してください。";
      return;
    }
    if (!amount || amount < 1) {
      sendMsg.textContent = "送金額は1円以上で入力してください。";
      return;
    }
    if (amount > fromUser.chips) {
      sendMsg.textContent = "所持チップが足りません。";
      return;
    }
    // 送金先ユーザー検索
    const users = getUsers();
    let toUser = null;
    for (const key in users) {
      if (users[key].id === toUserId) {
        toUser = users[key];
        break;
      }
    }
    if (!toUser) {
      sendMsg.textContent = "送金先ユーザーIDが見つかりません。";
      return;
    }
    if (toUser.username === fromUser.username) {
      sendMsg.textContent = "自分自身に送金できません。";
      return;
    }
    fromUser.chips -= amount;
    toUser.chips += amount;
    updateUser(fromUser);
    updateUser(toUser);
    sendMsg.textContent = `送金成功！${toUser.username}さんに${amount}円送りました。`;
    sendMsg.className = "success";
    renderProfilePage();
  };

  function renderProfilePage() {
    const user = getUser(getCurrentUser());
    profileUsername.textContent = user.username;
    profileUserId.textContent = user.id;
    profileChips.textContent = user.chips.toLocaleString();
    const rank = getRank(user.totalBet);
    profileRank.textContent = rank.name;
    profileRank.className = rank.class;
    sendMsg.textContent = "";
    sendChipBtn.disabled = false;
  }

  // ----- ランキングページ -----

  function renderRankingPage() {
    const users = Object.values(getUsers());
    users.sort((a, b) => b.chips - a.chips);
    rankingTableBody.innerHTML = "";
    users.slice(0, 30).forEach((user, i) => {
      const rank = getRank(user.totalBet);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${user.username}</td>
        <td>${user.chips.toLocaleString()}</td>
        <td class="${rank.class}">${rank.name}</td>
      `;
      rankingTableBody.appendChild(tr);
    });
  }

  // ----- 管理者ページ -----

  function renderAdminPage() {
    const user = getUser(getCurrentUser());
    if (!user || !ADMIN_USERS.includes(user.username)) {
      alert("管理者以外はアクセスできません。");
      showPage("game");
      return;
    }
    const users = Object.values(getUsers());
    adminUserTableBody.innerHTML = "";
    users.forEach(u => {
      const rank = getRank(u.totalBet);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.username}</td>
        <td>${u.chips.toLocaleString()}</td>
        <td class="${rank.class}">${rank.name}</td>
        <td>${u.totalBet.toLocaleString()}</td>
      `;
      adminUserTableBody.appendChild(tr);
    });
  }

  adminResetWorkBtn.onclick = () => {
    if (!confirm("全ユーザーのWork時間をリセットしますか？")) return;
    const users = getUsers();
    for (const u in users) {
      users[u].lastWork = 0;
    }
    saveUsers(users);
    alert("リセットしました。");
  };

  // ----- 初期処理 -----

  // 初回起動時、adminユーザー追加（存在しなければ）
  function ensureAdminUser() {
    const users = getUsers();
    let changed = false;
    ADMIN_USERS.forEach(admin => {
      if (!users[admin]) {
        users[admin] = {
          username: admin,
          password: simpleHash("admin123"), // 初期パスワード
          chips: 100000000,
          lastWork: 0,
          totalBet: 0,
          id: Math.random().toString(36).slice(2, 10),
        };
        changed = true;
      }
    });
    if (changed) saveUsers(users);
  }

  ensureAdminUser();

  if (getCurrentUser()) {
    showPage("game");
    renderGamePage();
  } else {
    showPage("login");
  }

})();
