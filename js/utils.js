// Cookie操作関数
export function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days*24*60*60*1000));
  document.cookie = name + "=" + encodeURIComponent(value) + ";path=/;expires=" + d.toUTCString();
}

export function getCookie(name) {
  const cname = name + "=";
  const decoded = decodeURIComponent(document.cookie);
  const ca = decoded.split(';');
  for(let c of ca) {
    while(c.charAt(0) === ' ') c = c.substring(1);
    if(c.indexOf(cname) === 0) return c.substring(cname.length, c.length);
  }
  return "";
}

// ユーザーリストを取得（配列）
export function getUserList() {
  const data = getCookie("userList");
  if(!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// ユーザーリストを保存
export function saveUserList(list) {
  setCookie("userList", JSON.stringify(list), 30);
}

// 現在ログイン中ユーザーを取得
export function getCurrentUser() {
  const data = getCookie("currentUser");
  if(!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// 現在ログインユーザーを更新（cookieとuserList両方に）
export function updateCurrentUser(user) {
  setCookie("currentUser", JSON.stringify(user), 1);
  let users = getUserList();
  const idx = users.findIndex(u => u.id === user.id);
  if(idx >= 0) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  saveUserList(users);
}

// 管理者IDリスト
export const adminIDs = ["sonsi"];

// ランク定義
export const ranks = [
  {name:"なし", threshold:0, bonus:0},
  {name:"ブロンズ", threshold:100000, bonus:4000},
  {name:"シルバー", threshold:1000000, bonus:10000},
  {name:"ゴールド", threshold:5000000, bonus:50000},
  {name:"プラチナ1", threshold:10000000, bonus:100000},
  {name:"プラチナ2", threshold:20000000, bonus:200000},
  {name:"プラチナ3", threshold:30000000, bonus:300000},
  {name:"プラチナ4", threshold:50000000, bonus:500000},
  {name:"プラチナ5", threshold:70000000, bonus:700000},
  {name:"ダイヤモンド1", threshold:100000000, bonus:1000000},
  {name:"ダイヤモンド2", threshold:200000000, bonus:2000000},
  {name:"ダイヤモンド3", threshold:300000000, bonus:3000000},
  {name:"ダイヤモンド4", threshold:400000000, bonus:4000000},
  {name:"ダイヤモンド5", threshold:500000000, bonus:5000000},
];

// ランク判定・昇格ボーナス付与
export function checkRankUp(user) {
  // user.totalBetとuser.rankを比較して昇格判定
  for(let i = ranks.length - 1; i >= 0; i--) {
    if(user.totalBet >= ranks[i].threshold) {
      if(user.rank !== ranks[i].name) {
        user.rank = ranks[i].name;
        user.chips += ranks[i].bonus;
        alert(`おめでとうございます！${ranks[i].name}に昇格し、ボーナス${ranks[i].bonus}チップを獲得しました！`);
      }
      break;
    }
  }
  return user;
}
