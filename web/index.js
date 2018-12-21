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
  document.querySelectorAll('.join-forms').forEach(elm => elm.disabled = false);
}

socket.onmessage = (e) => {
  let msg = JSON.parse(e.data);
  if (msg.path === '/userlist')
    updateUserList(msg.content);
}

function UsernameInput () {
  let root = document.createElement("div");
  
  let usernameInput = document.createElement("input");
  usernameInput.setAttribute("type", "text");
  usernameInput.onChange = (e) => {
  };
  usernameInput.classList.add("username-input");
  usernameInput.classList.add("join-forms");
  usernameInput.disabled = userList === undefined;

  let usernameInputUnderline = document.createElement("div");
  usernameInputUnderline.classList.add("username-input-underline");

  root.appendChild(usernameInput);
  root.appendChild(usernameInputUnderline);

  return root;
}

function JoinWindow () {
  let screen = document.createElement("div");
  screen.classList.add("join-screen");

  let joinButton = document.createElement("button");
  joinButton.textContent = "Join!";
  joinButton.classList.add("join-button");
  joinButton.classList.add("join-forms");
  joinButton.disabled = userList === undefined;

  screen.appendChild(UsernameInput());
  screen.appendChild(joinButton);
  
  return screen;
}

root.appendChild(JoinWindow());
