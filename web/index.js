//let serverURL = 'http://d-kitamura.sakura.ne.jp/lecture/ws-server';
let serverURL = 'ws://localhost:8080';
let socket = new WebSocket(serverURL);

let root = document.getElementById("root");
socket.onopen = () => {
  socket.send(JSON.stringify({
    req: 'user-list'
  }));
}

let userList = undefined;
function updateUserList(list) {
  userList = list;
  document.querySelector('.username-input').disabled = false;
}

socket.onmessage = (e) => {
  let msg = JSON.parse(e.data);
  if (msg.path === '/userlist') {
    updateUserList(msg.content);
  }
  else if (msg.path === '/joined') {
    // 遷移処理
  }
  else if (msg.path === '/error') {
    if (msg.errorCode === 'duplicated name')
      userList.push(msg.content);
  }
}

function tryJoin(username) {
  socket.send(JSON.stringify({
    name: username
  }));
}

function verifyUsername(username) {
  if (userList === undefined) return 'please wait for connecting server...';
  else if (userList.includes(username)) return 'duplicated user name';
  else if (username.length < 5) return 'username length must be longer than 4';
  else return 'good!';
}

function UsernameInput () {
  let root = document.createElement("div");
  
  let usernameInput = document.createElement("input");
  usernameInput.setAttribute("type", "text");
  usernameInput.addEventListener("input", (e) => {
    let msg = verifyUsername(e.target.value);
    if (msg === 'good!') document.querySelector('.join-button').disabled = false;
    document.querySelector('.username-status').textContent = msg;
  });
  usernameInput.classList.add("username-input");
  usernameInput.classList.add("join-forms");
  usernameInput.disabled = userList === undefined;

  let usernameInputUnderline = document.createElement("div");
  usernameInputUnderline.classList.add("username-input-underline");

  let usernameStatus = document.createElement("span");
  usernameStatus.classList.add("username-status");
  usernameStatus.textContent = 'please input your name';

  root.appendChild(usernameInput);
  root.appendChild(usernameInputUnderline);
  root.appendChild(usernameStatus);

  return root;
}

function JoinWindow () {
  let screen = document.createElement("div");
  screen.classList.add("join-screen");

  let joinButton = document.createElement("button");
  joinButton.textContent = "Join!";
  joinButton.classList.add("join-button");
  joinButton.classList.add("join-forms");
  joinButton.disabled = true;
  joinButton.addEventListener("click", () => {
    tryJoin(document.querySelector('.username-input').value);
  });

  let formContainer = document.createElement("div");
  formContainer.classList.add("form-container");
  formContainer.appendChild(UsernameInput());
  formContainer.appendChild(joinButton);

  screen.appendChild(formContainer);
  
  return screen;
}

function ChatWindow () {
  return document.createElement("div");
}

root.appendChild(JoinWindow());
