//let serverURL = 'http://d-kitamura.sakura.ne.jp/lecture/ws-server';
let serverURL = 'ws://localhost:8080';
let socket = new WebSocket(serverURL);

let root = document.getElementById('root');
socket.onopen = () => {
  socket.send(JSON.stringify({
    req: 'user-list'
  }));
}

function dom(tag, config, children) {
  let node = document.createElement(tag);
  for (key in config) {
    if (key === 'classes')
      node.classList.add(config.classes);
    if (key === 'id')
      node.setAttribute('id', config.id);
    if (key === 'listener') {
      for (listener in config.listener) {
        node.addEventListener(listener, config.listener[listener]);
      }
    }
    if (key === 'attr') {
      for (attr in config.attr) {
        node.setAttribute(attr, config.attr[attr]);
      }
    }
    else {
      node[key] = config[key];
    }
  }
  if (children) {
    for (let i = 0; i < children.length; ++i) {
      node.appendChild(children[i]);
    }
  }
  return node;
}

let userList = undefined;
function updateUserList(list) {
  userList = list;
  let usernameInput = document.getElementById('username-input');
  if (usernameInput) usernameInput.disabled = false;
}

function Message(name, content) {
  let root = document.createElement('div');
  root.classList.add('message');
  let nameElm = document.createElement('div');
  nameElm.classList.add('message-sender-name');
  nameElm.textContent = name;
  if (name === 'server-bot')
    nameElm.classList.add('server-bot-name');
  let contentElm = document.createElement('div');
  contentElm.classList.add('message-content');
  contentElm.textContent = content;
  root.appendChild(nameElm);
  root.appendChild(contentElm);

  return root;
}

socket.onmessage = (e) => {
  let msg = JSON.parse(e.data);
  if (msg.path === '/userlist') {
    updateUserList(msg.content);
  }
  else if (msg.path === '/joined') {
    // 遷移処理
    root.removeChild(root.firstChild);
    root.appendChild(ChatWindow());
  }
  else if (msg.path === '/error') {
    if (msg.code === 'duplicated-name')
      userList.push(msg.content);
  }
  else if (msg.path === '/message') {
    let container = document.getElementById('message-container');
    if (container) {
      let shouldScroll = container.scrollTop + container.clientHeight === container.scrollHeight;
      container.appendChild(Message(msg.name, msg.content));
      if (shouldScroll)
        container.scrollTop = container.scrollHeight;
    }
  }
}

function tryJoin(username) {
  socket.send(JSON.stringify({
    name: username
  }));
}

function verifyUsername(username) {
  if (userList === undefined) return "please wait for connecting server...";
  else if (userList.includes(username)) return "duplicated user name";
  else if (username.length < 5) return "username length must be longer than 4";
  else return "good!";
}

function postMessage() {
  let input = document.getElementById('chat-input');
  socket.send(JSON.stringify({
    msg: input.value
  }));
  input.value = "";
}

function UsernameInput () {
  let root = document.createElement('div');
  
  let usernameInput = document.createElement('input');
  usernameInput.setAttribute('type', 'text');
  usernameInput.addEventListener('input', (e) => {
    let msg = verifyUsername(e.target.value);
    if (msg === "good!") document.getElementById('join-button').disabled = false;
    document.getElementById('username-status').textContent = msg;
  });
  usernameInput.setAttribute('id', 'username-input');
  usernameInput.classList.add('username-input');
  usernameInput.classList.add('join-forms');
  usernameInput.placeholder = "your name";
  usernameInput.disabled = userList === undefined;
  usernameInput.addEventListener('keydown', (e) => {
    if (e.code === 'Enter') {
      tryJoin(usernameInput.value);
    }
  });

  let usernameInputUnderline = document.createElement('div');
  usernameInputUnderline.classList.add('username-input-underline');

  let usernameStatus = document.createElement('span');
  usernameStatus.setAttribute('id', 'username-status');
  usernameStatus.classList.add('username-status');
  usernameStatus.textContent = "please input your name";

  root.appendChild(usernameInput);
  root.appendChild(usernameInputUnderline);
  root.appendChild(usernameStatus);

  return root;
}

function JoinWindow () {
  let screen = document.createElement('div');
  screen.classList.add('join-screen');

  let joinButton = document.createElement('button');
  joinButton.textContent = "Join!";
  joinButton.setAttribute('id', 'join-button');
  joinButton.classList.add('raised-button');
  joinButton.classList.add('join-button');
  joinButton.classList.add('join-forms');
  joinButton.disabled = true;
  joinButton.addEventListener('click', () => {
    tryJoin(document.getElementById('username-input').value);
  });

  let formContainer = document.createElement('div');
  formContainer.classList.add('form-container');
  formContainer.appendChild(UsernameInput());
  formContainer.appendChild(joinButton);

  screen.appendChild(formContainer);
  
  return screen;
}

function MessageContainer() {
  let msgc = document.createElement('div');
  msgc.classList.add('message-container');
  msgc.setAttribute('id', 'message-container');
  return msgc;
}

function ChatForm() {
  let chatForm = document.createElement('div');
  chatForm.classList.add('chat-form');

  let input = document.createElement('textarea');
  //input.setAttribute('type', 'text');
  input.setAttribute('id', 'chat-input');
  input.classList.add('chat-input');
  input.placeholder = "ask your question!";
  input.addEventListener('keydown', (e) => {
    if (e.ctrlKey === true && e.code === 'Enter') {
      postMessage();
    }
  });

  let submitButton = document.createElement('button');
  submitButton.setAttribute('id', 'submit-buttoon');
  submitButton.classList.add('raised-button');
  submitButton.classList.add('submit-button');
  submitButton.textContent = "Submit!";
  submitButton.addEventListener('click', postMessage);

  chatForm.appendChild(input);
  chatForm.appendChild(submitButton);
  return chatForm;
}

function ChatMainPane () {
  let chatRoot = document.createElement('div');
  chatRoot.classList.add('chat-main-pane');
  chatRoot.appendChild(MessageContainer());
  chatRoot.appendChild(ChatForm());
  return chatRoot;
}

function ChatSidePane () {
  let side = document.createElement('div');
  side.classList.add('chat-side-pane');
  let serverInfo = document.createElement('div');
  serverInfo.textContent = "Members";
  serverInfo.classList.add('server-info');
  side.appendChild(serverInfo);
  return side;
}

function ChatWindow() {
  let chatRoot = document.createElement('div');
  chatRoot.classList.add('chat-root');
  chatRoot.appendChild(ChatSidePane());
  chatRoot.appendChild(ChatMainPane());
  return chatRoot;
}

root.appendChild(JoinWindow());
//root.appendChild(ChatWindow());
