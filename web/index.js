//let serverURL = 'http://d-kitamura.sakura.ne.jp/lecture/ws-server';
let serverURL = 'ws://localhost:8080';
let socket = new WebSocket(serverURL);

let timelineNode = document.getElementById('timeline');
let msgboxNode = document.getElementById('msgbox');

let username = 'guest';

socket.addEventListener('open', e => {
  socket.send(JSON.stringify({
    type: 'request-current',
    times: 10
  }));
});

function appendTL(msg) {
  let elm = document.createElement('div');
  let username = document.createElement('div');
  let maincontent = document.createElement('div');

  username.textContent = msg.username;
  maincontent.textContent = msg.text;

  elm.appendChild(username);
  elm.appendChild(maincontent);

  timelineNode.appendChild(elm);
}

socket.addEventListener('message', e => {
  if (e.target.value.type === 'msgs') {
    for (let msg in e.target.value.msgs) {
      appendTL(msg);
    }
  }
});

let postButton    = document.getElementById('post-button');
let textArea      = document.getElementById('maintext');
let usernameInput = document.getElementById('username');

function postMsg() {
  socket.send({
    type: 'post',
    msg: {
      username: usernameInput.text,
      text: textArea.text
    }
  });
}

postButton.addEventListener('onclick', e => {
  postMsg();
});
