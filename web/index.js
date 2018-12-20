//let serverURL = 'http://d-kitamura.sakura.ne.jp/lecture/ws-server';
let serverURL = 'ws://localhost:8080';
let socket = new WebSocket(serverURL);

let root = document.getElementById("root");

function UsernameInput () {
  let root = document.createElement("div");
  
  let usernameInput = document.createElement("input");
  usernameInput.setAttribute("type", "text");
  usernameInput.onChange = (e) => {
  };
  usernameInput.classList.add("username-input");

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

  screen.appendChild(UsernameInput());
  screen.appendChild(joinButton);
  
  return screen;
}

root.appendChild(JoinWindow());
