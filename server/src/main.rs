extern crate ws;
#[macro_use] extern crate serde_json;
#[macro_use] extern crate serde_derive;

use std::rc::Rc;
use std::cell::RefCell;

const ADDR: &'static str = "127.0.0.1:8080";

type Users = Rc<RefCell<Vec<String>>>;

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Message {
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
    users: Users
}

impl ws::Handler for ChatHandler {
    fn on_open(&mut self, _: ws::Handshake) -> ws::Result<()> {
        Ok(())
    }

    fn on_message(&mut self, msg: ws::Message) -> ws::Result<()> {
        if let Ok(text_msg) = msg.clone().as_text() {
            if let Ok(msg) = serde_json::from_str::<Message>(text_msg) {
                return self.out.broadcast(json!({
                    "path": "/message",
                    "content": msg.msg.clone()
                }).to_string())
            }

            if let Ok(msg) = serde_json::from_str::<Join>(text_msg) {
                if self.users.borrow().contains(&msg.name) {
                    return self.out.send(json!({
                        "path": "/error",
                        "content": "duplicated name"
                    }).to_string())
                }
                else {
                    let join_msg = json!({
                        "path": "/message",
                        "content": format!("{} has joined!", msg.name)
                    }).to_string();
                    self.users.borrow_mut().push(msg.name.clone());
                    self.name = Some(msg.name);
                    return self.out.broadcast(join_msg)
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
                            "content": format!("Unavailable request {}", msg.req),
                        }).to_string())
                    },
                }
            }
        }
        self.out.send(json!({
            "path": "/error",
            "content": format!("Unable to parse messge {:?}", msg),
        }).to_string())
    }

    fn on_close(&mut self, _: ws::CloseCode, _: &str) -> () {
        ()
    }

    fn on_timeout(&mut self, tok: ws::util::Token) -> ws::Result<()> {
        Ok(())
    }
}

fn main() {
    let users = Users::new(RefCell::new(Vec::with_capacity(1_0000)));
    if let Err(err) = ws::listen(ADDR, |out| {
        ChatHandler {
            out: out,
            name: None,
            users: users.clone()
        }
    }) {
        panic!("Failed to create WebSocket due to {:?}", err);
    }
}
