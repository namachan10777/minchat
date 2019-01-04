extern crate ws;
#[macro_use] extern crate serde_json;
#[macro_use] extern crate serde_derive;

use std::rc::Rc;
use std::cell::RefCell;
use std::collections::HashSet;

const ADDR: &'static str = "127.0.0.1:8080";

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
}

struct Message {
    sender: String,
    content: String,
    id: usize,
}

impl ws::Handler for ChatHandler {
    fn on_open(&mut self, _: ws::Handshake) -> ws::Result<()> {
        Ok(())
    }

    fn on_message(&mut self, msg: ws::Message) -> ws::Result<()> {
        if let Ok(text_msg) = msg.clone().as_text() {
            if let Ok(msg) = serde_json::from_str::<MessagePacket>(text_msg) {
                let sender_name = &self.name.clone().unwrap_or("unknown".to_string());
                return self.out.broadcast(json!({
                    "path": "/message",
                    "content": msg.msg.clone(),
                    "name": sender_name
                }).to_string())
            }

            if let Ok(msg) = serde_json::from_str::<Join>(text_msg) {
                if let Some(_) = self.name {
                    return self.out.send(json!({
                        "path": "/error",
                        "code": "already-joined",
                    }).to_string())
                }
                if self.users.borrow().contains(&msg.name) {
                    return self.out.send(json!({
                        "path": "/error",
                        "code": "duplicated-name",
                    }).to_string())
                }
                else {
                    self.users.borrow_mut().insert(msg.name.clone());
                    self.name = Some(msg.name.clone());
                    self.out.send(json!({
                        "path": "/joined",
                    }).to_string())?;
                    let mut current_id = *self.current_id.borrow();
                    current_id += 1;
                    let current_id = self.current_id.replace(current_id);
                    self.messages.borrow_mut().push(Message {
                        id: current_id,
                        sender: "server-bot".to_string(),
                        content: format!("{} has joined!", msg.name),
                    });
                    self.out.broadcast(json!({
                        "path": "/message",
                        "content": format!("{} has joined!", msg.name),
                        "name": "server-bot"
                    }).to_string())?;
                    return self.out.broadcast(json!({
                        "path": "/userlist",
                        "content": self.users.borrow().clone()
                    }).to_string())
                }
            }

            if let Ok(msg) = serde_json::from_str::<Request>(text_msg) {
                match msg.req.as_ref() {
                    "user-list" => {
                        return self.out.send(json!({
                            "path": "/userlist",
                            "content": self.users.borrow().clone()
                        }).to_string())
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

    fn on_timeout(&mut self, _: ws::util::Token) -> ws::Result<()> {
        Ok(())
    }
}

fn main() {
    let users = Users::new(RefCell::new(HashSet::new()));
    let messages = Messages::new(RefCell::new(Vec::new()));
    if let Err(err) = ws::listen(ADDR, |out| {
        ChatHandler {
            out: out,
            name: None,
            users: users.clone(),
            messages: messages.clone(),
            current_id: Rc::new(RefCell::new(0))
        }
    }) {
        panic!("Failed to create WebSocket due to {:?}", err);
    }
}
