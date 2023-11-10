const betterGHButtonsCSSName = 'better-github-merge-buttons-extension.css';

// Listener for when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: 'OFF'
    });
});

const githubPRUrlRegex = /https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/;

// When the user clicks on the extension action
chrome.action.onClicked.addListener(async (tab) => {
    betterGHMergeUIListener(tab).catch((err) => {
            console.log("better-gh-merge-buttons extension: error in action.onClicked: ", err);
        }
    )
});

// When the content script (from this extension) sends a message
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        const tab = sender.tab;
        console.log("Message received from content.js: ", request, sender);
        let promise = betterGHMergeUIListener(tab);
        sendResponse(promise);
    }
);

async function betterGHMergeUIListener(tab) {
    let url = tab.url;

    if (githubPRUrlRegex.test(url)) {
        await applyCSS(tab);
        await subscribeToElementRender(tab);
    } else {
        return new Promise((resolve, reject) => {
            reject("better-gh-merge-buttons extension: not on a GitHub PR page");
        });
    }
}

async function subscribeToElementRender(tab) {
    await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: enableButtonForMergingOrSquashingOnRender
    });
}

function enableButtonForMergingOrSquashingOnRender() {
    const branchRegex = /[^:]+:(\w+)/;
    var branchElementSelector = ".commit-ref.base-ref a";
    var mergePrElementSelector = '#partial-pull-merging > div.merge-pr';

    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (!mutation.addedNodes) return;

            var branchElement = document.querySelector(branchElementSelector);
            var mergePrElement = document.querySelector(mergePrElementSelector);

            if (branchElement && mergePrElement) {
                observer.disconnect(); 

                var branchName = branchElement.text;
                let match = branchName.match(branchRegex);
                if (match) {
                    branchName = match[1];
                }

                mergePrElement.classList.remove('is-rebasing', 'is-merging', 'is-squashing');

                if (branchName === 'master') {
                    mergePrElement.classList.add('is-merging');
                } else if (branchName === 'develop') {
                    mergePrElement.classList.add('is-squashing');
                }
            }
        });
    });

    // Start observing the body for added nodes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

async function applyCSS(tab) {
    const currentState = await getBadgeState(tab);
    const nextState = toggleState(currentState);

    await updateTabText(tab, nextState);

    if (nextState === 'ON') {
        await insertCustomCSS(tab);

    } else if (nextState === 'OFF') {
        await removeCustomCSS(tab);
    }
}

async function getBadgeState(tab) {
    return await chrome.action.getBadgeText({tabId: tab.id});
}

function toggleState(currentState) {
    return currentState === 'ON' ? 'OFF' : 'ON';
}

async function updateTabText(tab, nextState) {
    await chrome.action.setBadgeText({
        tabId: tab.id,
        text: nextState
    });
}


async function insertCustomCSS(tab) {
    await chrome.scripting.insertCSS({
        files: [betterGHButtonsCSSName],
        target: {tabId: tab.id}
    });
}

async function removeCustomCSS(tab) {
    await chrome.scripting.removeCSS({
        files: [betterGHButtonsCSSName],
        target: {tabId: tab.id}
    });
}

