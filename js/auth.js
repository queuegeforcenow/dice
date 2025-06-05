import {getUserList, saveUserList, setCookie, getCookie, updateCurrentUser} from './utils.js';

// ログイン処理
if(document.getElementById("loginForm")){
  document.getElementById("loginForm").addEventListener("submit", e=>{
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const users = getUserList();
    const user = users.find(u=>u.username === username && u.password === password);
    const msg = document.getElementById("loginMsg");

    if(user){
      setCookie("currentUser", JSON.stringify(user), 1);
      msg.style.color = "lime";
      msg.textContent = "ログイン成功！ゲームページへ移動します...";
      setTimeout(()=>{window.location.href = "game.html";},1500);
    } else {
      msg.style.color = "red";
      msg.textContent = "ユーザー名か
