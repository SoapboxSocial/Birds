const EVENT_NAMES = {
  MEMBERS: "members",
  ROOM: "room",
  USER: "user",
  CLOSED: "closed",
};

const WEBKIT_MESSAGE_HANDLERS = {
  MEMBERS: "members",
  ROOM: "room",
  USER: "user",
};

function postMessage(key, payload) {
  window.webkit.messageHandlers[key].postMessage(payload);
}

const emitter = window.mitt();

console.log({ emitter });

// window.webkit = {
//   messageHandlers: {
//     user: {
//       postMessage: (payload) => {
//         console.log(
//           "Handling message handler 'user' with sequence",
//           payload.sequence
//         );

//         console.log({ emitter });

//         emitter.emit("user", {
//           sequence: payload.sequence,
//           data: {
//             display_name: "Jeff",
//             id: 10,
//             image: "fuck",
//             username: "jeff",
//           },
//         });
//       },
//     },
//   },
// };

/**
 * Get the current user of the Mini
 * @name getUser
 * @returns {Promise<User>}
 */
export function getUser() {
  return new Promise((resolve) => {
    const sequence = Date.now();

    postMessage(WEBKIT_MESSAGE_HANDLERS.USER, { sequence });

    const handler = (event) => {
      if (true) {
        console.log("Handling event 'getUser' with payload", event);
      }

      if (event?.sequence === sequence) {
        resolve(event.data);

        emitter.off(EVENT_NAMES.USER, handler);
      } else {
        console.log("didn't match");

        emitter.off(EVENT_NAMES.USER, handler);
      }
    };

    emitter.on(EVENT_NAMES.USER, handler);
  });
}
