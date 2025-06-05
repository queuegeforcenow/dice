import {
  getCurrentUser,
  updateCurrentUser,
  getUserList,
  saveUserList
} from './utils.js';

const user = getCurrentUser();
if (!user) {
  alert("ログインしてください");
  window.location.href = "index.html";
}

document.getElementById("profileName").textContent = user.username;
document.getElementById("profileRank").textContent = user.rank || "なし";
document.getElementById("profileChips").textContent = user.chips;
document.getElementById("profileID").textContent = user.id;

// チップ送金処理
document.getElementById("sendChipForm").addEventListener("submit", e => {
  e.preventDefault();
  const toID = document.getElementById("sendToID").value.trim();
  const amount = parseInt(document.getElementById("sendAmount").value);

  if (toID === user.id) {
    alert("自分には送れません");
    return;
  }
  if (amount <= 0 || amount > user.chips) {
    alert("送金額が不正です");
    return;
  }

  const users = getUserList();
  const recipient = users.find(u => u.id === toID);

  if (!recipient) {
    alert("送金先が見つかりません");
    return;
  }

  user.chips -= amount;
  recipient.chips += amount;

  saveUserList(users);
  updateCurrentUser(user);

  alert(`送金成功！${recipient.username}に${amount}チップ送りました。`);
  document.getElementById("profileChips").textContent = user.chips;
  document.getElementById("sendChipForm").reset();
});
