// @ts-check

import { APIWrapper, API_EVENT_TYPE } from "./api.js";
import {
  addMessage,
  animateGift,
  isPossiblyAnimatingGift,
  isAnimatingGiftUI,
} from "./dom_updates.js";

const api = new APIWrapper();

let queue = [];

/**
 * If the same message is not in the queue, it will be added to the queue.
 * @param {object} event - The message object.
 */
function handlePushQueue(event) {
  if (queue.indexOf(event) === -1) {
    queue.push(event);
  }
}

/**
 * Sorts messages by latest
 */
function sortMessages() {
  queue.sort(function (x, y) {
    return x.timestamp - y.timestamp;
  });
}

/**
 * Sorts messages by latest and deletes outdated messages
 */
function sortAndClearOutdated() {
  sortMessages();
  queue = queue.filter((item) => !isMessageOutdated(item));
}

/**
 * Finds the non animated object and returns it
 * @returns {object | boolean} Returns the latest non animated object or false.
 */
function findNotAnimatedAndPop() {
  const index = queue.findIndex(
    (obj) => obj.type !== API_EVENT_TYPE.ANIMATED_GIFT
  );

  if (index > -1) {
    const findedObject = queue[index];
    queue = [...queue.slice(0, index), ...queue.slice(index + 1)];
    return findedObject;
  }

  return false;
}

setInterval(() => {
  if (queue.length > 0) {
    sortAndClearOutdated();

    const message = queue.shift(); //get latest message
    if (message.type === API_EVENT_TYPE.ANIMATED_GIFT) {
      if (!isAnimatingGiftUI()) {
        animateGift(message);
        addMessage(message);
      } else {
        const finded = findNotAnimatedAndPop();
        finded && addMessage(finded);
        queue.push(message); //Since there is another animation on the screen, we add it to the queue again
      }
    } else {
      addMessage(message); //if message is non animated, show it
    }
  }
}, 500);

/**
 * Checks if the message has expired
 * @returns {boolean} Returns true or false
 */
const isMessageOutdated = (event) => {
  const diff = (Date.now() - new Date(event.timestamp).getTime()) / 1000;
  return diff > 20;
};

api.setEventHandler((events) => {
  events.forEach((event) => {
    handlePushQueue(event);
  });
});
