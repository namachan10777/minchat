extern crate ws;
extern crate serde_json;
#[macro_use] extern crate serde_derive;

use std::rc::Rc;
use std::cell::RefCell;

const ADDR: &'static str = "127.0.0.1:8080";

type Users = Rc<RefCell<Vec<String>>>;

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Message {
    name: String,
    msg: String
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Join {
    name: String
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Request {
    name: String,
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
                
            }

            if let Ok(msg) = serde_json::from_str::<Join>(text_msg) {
            }

            if let Ok(msg) = serde_json::from_str::<Request>(text_msg) {
            }
        }
        Ok(())
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
