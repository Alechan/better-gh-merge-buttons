(async () => {
    const response = chrome.runtime.sendMessage({greeting: "hello"});
    response.catch((err) => {
        console.log("better-gh-merge-buttons extension: error sending message to background.js: ", err);
    });
})();