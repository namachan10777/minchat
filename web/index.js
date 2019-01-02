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
    if (key === 'class') {
      if (typeof config.class === 'string') {
        node.classList.add(config.class);
      }
      else {
        for (i in config.class) {
          node.classList.add(config.class[i]);
        }
      }
    }
    if (key === 'text')
      node.textContent = config.text;
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
    for (i in children) {
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
  let userListDOM = document.getElementById('user-list');
  if (userListDOM) {
    let newUserListDOM = UserList(list);
    userListDOM.parentNode.replaceChild(newUserListDOM, userListDOM);
  }
}

function Message(name, content) {
  let nameElm = dom('div', {
    class: 'message-sender-name',
    text: name
  });
  let contentElm = dom('div', {
    text: content,
    class: 'message-content'
  });
  if (name === 'server-bot')
    nameElm.classList.add('server-bot-name');

  return dom('div', {
    class: 'message'
  }, [nameElm, contentElm]);
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
  let usernameInput = dom('input', {
    id: 'username-input',
    class: ['username-input', 'join-forms'],
    placeholder: "your name",
    disabled: userList === undefined,
    attr: {
      type: 'text',
    },
    listener: {
      input: (e) => {
        let msg = verifyUsername(e.target.value);
        if (msg === "good!") document.getElementById('join-button').disabled = false;
        document.getElementById('username-status').textContent = msg;
      },
      keydown: (e) => {
        if (e.code === 'Enter') {
          tryJoin(usernameInput.value);
        }
      }
    }
  });

  let usernameInputUnderline = dom('div', {
    class: 'username-input-underline'
  });

  let usernameStatus = dom('span', {
    id: 'username-status',
    class: 'username-status',
    text: "please input your name"
  });

  return dom('div', {}, [usernameInput, usernameInputUnderline, usernameStatus]);
}

function JoinWindow () {
  let joinButton = dom('button', {
    id: 'join-button',
    class: ['raised-button', 'join-button', 'join-forms'],
    disabled: true,
    listener: {
      click: () => {
        tryJoin(document.getElementById('username-input').value);
      }
    },
    text: "Join!"
  });

  let formContainer = dom('div', {
    class: 'form-container'
  }, [UsernameInput(), joinButton]);

  return dom('div', {
    class: 'join-screen'
  }, [formContainer]);
}

function MessageContainer() {
  return dom('div', {
    id: 'message-container',
    class: 'message-container'
  });
}

function ChatForm() {
  let chatForm = document.createElement('div');
  chatForm.classList.add('chat-form');

  let input = dom('textarea', {
    id: 'chat-input',
    class: 'chat-input',
    placeholder: "ask your question!",
    listener: {
      keydown: (e) => {
        if (e.ctrlKey === true && e.code === 'Enter') {
          postMessage();
        }
      }
    }
  });

  let submitButton = dom('button', {
    id: 'submit-button',
    class: ['raised-button', 'submit-button'],
    text: "Submit!",
    listener: {
      click: postMessage
    }
  });

  return dom('div', {
    class: 'chat-form'
  }, [input, submitButton]);
}

function ChatMainPane () {
  return dom('div', {
    class: 'chat-main-pane'
  }, [MessageContainer(), ChatForm()]);
}

function UserList(list) {
  let membersDOM = [];
  for (idx in list) {
    membersDOM.push(dom('div', {
      class: 'member-name',
      text: userList[idx]
    }));
  }
  return dom('div', {
    id: 'user-list',
    class: 'user-list',
  }, membersDOM);
}

function ChatSidePane () {
  let serverInfo = dom('div', {
    text: "Members",
    class: 'server-info'
  });
  return dom('div', {
    class: 'chat-side-pane'
  }, [serverInfo, UserList(userList)]);
}

function ChatWindow() {
  return dom('div', {
    class: 'chat-root'
  }, [ChatSidePane(), ChatMainPane()]);
}

root.appendChild(JoinWindow());
//root.appendChild(ChatWindow());
