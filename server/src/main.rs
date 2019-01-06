extern crate ws;
#[macro_use] extern crate serde_json;
#[macro_use] extern crate serde_derive;

use std::fs;
use std::rc::Rc;
use std::cell::RefCell;
use std::collections::HashSet;

const ADDR: &'static str = "127.0.0.1:8080";
const PING: ws::util::Token = ws::util::Token(2);
const PING_TIME: u64 = 1_000;

type Users = Rc<RefCell<HashSet<String>>>;
type Messages = Rc<RefCell<Vec<Message>>>;

#[derive(Serialize, Deserialize, Debug, Clone)]
struct MessagePacket {
    msg: String
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Join {
    name: String
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Request {
    req: String
}

struct ChatHandler {
    out: ws::Sender,
    name: Option<String>,
    users: Users,
    messages: Messages,
    current_id: Rc<RefCell<usize>>,
    log: Rc<fs::File>,
}

struct Message {
    sender: String,
    content: String,
    id: usize,
}

impl ChatHandler {
    fn handle_join(&mut self, joiner: String) -> ws::Result<()> {
        if let Some(_) = self.name {
            return self.out.send(json!({
                "path": "/error",
                "code": "already-joined",
            }).to_string())
        }
        else if self.users.borrow().contains(&joiner) {
            return self.out.send(json!({
                "path": "/error",
                "code": "duplicated-name",
            }).to_string())
        }
        else {
            self.users.borrow_mut().insert(joiner.clone());
            self.name = Some(joiner.clone());
            self.out.send(json!({
                "path": "/joined",
            }).to_string())?;
            let mut current_id = *self.current_id.borrow();
            current_id += 1;
            let current_id = self.current_id.replace(current_id);
            self.messages.borrow_mut().push(Message {
                id: current_id,
                sender: "server-bot".to_string(),
                content: format!("{} has joined!", joiner),
            });
            self.out.broadcast(json!({
                "path": "/message",
                "content": format!("{} has joined!", joiner),
                "name": "server-bot"
            }).to_string())?;
            return self.out.broadcast(json!({
                "path": "/userlist",
                "content": self.users.borrow().clone()
            }).to_string())
       }
    }

    fn handle_post(&mut self, content: String) -> ws::Result<()> {
        let sender = self.name.clone().unwrap_or("unknown".to_string());
        return self.out.broadcast(json!({
            "path": "/message",
            "content": content,
            "name": sender
        }).to_string())
    }

    fn handle_req_userlist(&mut self) -> ws::Result<()> {
        return self.out.send(json!({
            "path": "/userlist",
            "content": self.users.borrow().clone()
        }).to_string())
    }
}

impl ws::Handler for ChatHandler {
    fn on_open(&mut self, _: ws::Handshake) -> ws::Result<()> {
        self.out.timeout(PING_TIME, PING).unwrap();
        Ok(())
    }

    fn on_message(&mut self, msg: ws::Message) -> ws::Result<()> {
        if let Ok(text_msg) = msg.clone().as_text() {
            if let Ok(msg) = serde_json::from_str::<MessagePacket>(text_msg) {
                return self.handle_post(msg.msg)
            }
            if let Ok(msg) = serde_json::from_str::<Join>(text_msg) {
                return self.handle_join(msg.name)
            }
            if let Ok(msg) = serde_json::from_str::<Request>(text_msg) {
                match msg.req.as_ref() {
                    "user-list" => {
                        return self.handle_req_userlist()
                    },
                    _ => {
                        return self.out.send(json!({
                            "path": "/error",
                            "code": "unavailable-request"
                        }).to_string())
                    },
                }
            }
        }
        self.out.send(json!({
            "path": "/error",
            "code": "parse-failed"
        }).to_string())
    }

    fn on_close(&mut self, _: ws::CloseCode, _: &str) -> () {
        if let Some(name) = self.name.clone() {
            self.users.borrow_mut().remove(&name);
            self.out.broadcast(json!({
                "path": "/message",
                "content": format!("{} has leaved!", &name),
                "name": "server-bot"
            }).to_string()).unwrap();
            self.out.send(json!({
                "path": "/userlist",
                "content": self.users.borrow().clone()
            }).to_string()).unwrap();
        }
    }

    fn on_timeout(&mut self, tok: ws::util::Token) -> ws::Result<()> {
        match tok {
            PING => {
                self.out.ping(Vec::new()).unwrap();
                self.out.timeout(PING_TIME, PING)
            },
            _ => unreachable!()            
        }
    }
}

fn main() {
    let users = Users::new(RefCell::new(HashSet::new()));
    let messages = Messages::new(RefCell::new(Vec::new()));
    let log = Rc::new(fs::OpenOptions::new().write(true).create(true).open("msg_log.json").unwrap());
    if let Err(err) = ws::listen(ADDR, |out| {
        ChatHandler {
            out: out,
            name: None,
            users: users.clone(),
            messages: messages.clone(),
            current_id: Rc::new(RefCell::new(0)),
            log: log.clone(),
        }
    }) {
        panic!("Failed to create WebSocket due to {:?}", err);
    }
}
