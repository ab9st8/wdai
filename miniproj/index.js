import { generateSlug } from "./slugGenerator.js";
import { onToggleSidebar } from "./lib.js";
import { Peer } from "https://esm.sh/peerjs@1.5.5?bundle-deps";

const slug = generateSlug();

let peer = null;

// see if we're running the server locally.
// if so, let's use it to broker our connections!
try {
  await fetch("http://localhost:9000/myapp")
    .then(
      async (response) =>
        (peer = (response.ok)
          ? (peer = new Peer(slug, {
              host: "localhost",
              port: 9000,
              path: "/myapp",
              debug: 3,
            }))
          : new Peer(slug, { debug: 3 })),
    )
    .catch((_) => (peer = new Peer(slug)));
} catch {}

window.peer = peer; // mostly for debugging purposes

let outboundConnection = null;
let inboundConnection = null;

// "state" we need to track
let copied = false;

// shared selectors and cached element references.
// i wanted to put this in a separate file but i'm afraid too much will break.
const SELECTORS = {
  main: "main",
  nav: "nav",
  userslug: "#userslug",
  messagesContainer: "#messages-container",
  peeridInput: "#peerid-input",
  connectionModal: "#connection-modal",
  messageInput: "#message-input",
  sendButton: "#send-button",
  connectingMessage: "#connecting-message",
  toggleSidebarButton: "#toggle-sidebar-button",
  toggleButtonWrapper: "#toggle-button-wrapper",
  dragHandle: "#drag-handle",
};

const $userslug = document.querySelector(SELECTORS.userslug);
const $messages = document.querySelector(SELECTORS.messagesContainer);
const $peeridInput = document.querySelector(SELECTORS.peeridInput);
const $connectionModal = document.querySelector(SELECTORS.connectionModal);
const $messageInput = document.querySelector(SELECTORS.messageInput);
const $sendButton = document.querySelector(SELECTORS.sendButton);
const $toggleSidebarButton = document.querySelector(
  SELECTORS.toggleSidebarButton,
);
const $toggleButtonWrapper = document.querySelector(
  SELECTORS.toggleButtonWrapper,
);

$userslug.textContent = peer.id;

// handle inbound connections
peer.on("connection", (conn) => {
  console.log("charlee: inbound connection from:", conn.peer);
  if (!inboundConnection) {
    inboundConnection = conn;
    console.log("charlee: accepted!");

    inboundConnection.on("data", (data) => {
      console.log("charlee: received:", data);
      $messages.innerHTML += `
          <div class="message received">
            <div class="message-sender">${conn.peer}:</div>
            <div class="message-text received">${data.replaceAll(
              "\n",
              "<br/>",
            )}</div>
          </div>
        `;
    });
  } else {
    console.error("charlee: rejected: inbound connection already exists");
  }
});

function onConnect() {
  const peerId = $peeridInput.value.trim();
  if (peerId.length === 0) {
    $peeridInput.placeholder = "peer id cannot be empty!";
    return;
  }

  $connectionModal.style.display = "none";
  const conn = peer.connect(peerId);

  console.log(`charlee: attempting connection to ${peerId}`);

  $messages.innerHTML += `
        <div class="message system">
          <span class="message-text system" id="connecting-message">connecting...</span>
        </div>
      `;

  const timeout = setTimeout(() => {
    if (!outboundConnection) {
      $messages.innerHTML += `
            <div class="message system">
              <span class="message-text system">could not connect in 5 seconds. the peer probably does not exist. try refreshing</span>
            </div>
          `;
    }
  }, 5000);

  // We only do this once we connect
  conn.on("open", () => {
    console.log("charlee: successfully connected to:", peerId);
    clearTimeout(timeout);
    outboundConnection = conn;

    const $connectingMsg = document.querySelector(SELECTORS.connectingMessage);
    if ($connectingMsg) $connectingMsg.innerText = `talking with ${peerId}!`;

    $messageInput.disabled = false;
    $messageInput.placeholder = "type your message here...";
    $sendButton.disabled = false;
  });

  conn.on("error", (e) => console.error(`charlee: PeerJS error: ${e}`));
}

function onSendMessage() {
  const message = $messageInput.value;
  $messageInput.value = "";

  $messageInput.focus();

  if (outboundConnection && outboundConnection.open) {
    console.log("charlee: sending message:", message);
    outboundConnection.send(message);
    $messages.innerHTML += `
          <div class="message sent">
            <div class="message-sender">${peer.id}:</div>
            <div class="message-text sent">${message.replaceAll(
              "\n",
              "<br/>",
            )}</div>
          </div>
        `;
  } else {
    console.error("charlee: no open connection to send message through.");
  }

  document.activeElement.blur();
  $messageInput.focus();
}

// set up the necessary handlers

window.onConnect = onConnect;
window.onSendMessage = onSendMessage;
window.onToggleSidebar = onToggleSidebar;

// set up event listeners.
// also wanted to clean this up but whatever.

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.activeElement.blur();
  }
});

$peeridInput.addEventListener("keydown", (e) => {
  if (e.metaKey && e.key === "Enter") {
    onConnect();
  }
});

$messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    onSendMessage();
  }
});

$userslug.addEventListener("click", () => {
  if (!copied) {
    copied = true;
    const slugText = $userslug.textContent;
    navigator.clipboard.writeText(slugText).then(() => {
      console.log("charlee: Copied user slug to clipboard:", slugText);
      $userslug.textContent = "copied";
      setTimeout(() => {
        $userslug.textContent = slugText;
        copied = false;
      }, 1000);
    });
  }
});

window.addEventListener("beforeunload", () => {
  peer.destroy();
});
