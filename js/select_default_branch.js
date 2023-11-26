// The function to run
enableButtonForMergingOrSquashingOnRender();

function findBaseBranchName() {
    let branchElement = document.querySelector(".commit-ref.base-ref a");
    if (!!branchElement) {
        return extractBranchName(branchElement);
    }
    return null;
}

function findHeadBranchName() {
    let branchElement = document.querySelector(".commit-ref.head-ref a");
    if (!!branchElement) {
        return extractBranchName(branchElement);
    }
    return null;
}

function findMergePRElement() {
    return document.querySelector('#partial-pull-merging > div.merge-pr');
}

function enableButtonForMergingOrSquashingOnRender() {
    // Subscribes to the body for added nodes to check if the "Merge box" has been loaded
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            let mutationHasAddedNodes = mutation.addedNodes;
            if (!mutationHasAddedNodes) return;

            const baseBranchName = findBaseBranchName();
            const headBranchName = findHeadBranchName();
            const mergePrElement = findMergePRElement();

            let mergeTypeBoxHasBeenLoaded = baseBranchName && mergePrElement;
            if (mergeTypeBoxHasBeenLoaded) {
                // TODO: use the variable `observer` that we are defining? find a less ouroboros'ish alternative
                observer.disconnect();

                setDefaultMergeType(baseBranchName, headBranchName);
            }
        });
    });

    // Start observing the body for added nodes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function setDefaultMergeType(baseBranchName, headBranchName) {
    // Base branch: destination
    // Head branch: source

    let masterBase = baseBranchName === 'master';
    let isBackPort = checkIfIsBackPort(baseBranchName, headBranchName);
    let developBase = baseBranchName === 'develop';

    let shouldMerge = masterBase || isBackPort;
    let shouldSquash = developBase || !isBackPort;

    if (shouldMerge) {
        // Click the "activate merge button" button
        const mergeMethodButton = findUniqueMergeTypeSelectionButton("merge");
        mergeMethodButton.click();
        return
    }

    if (shouldSquash) {
        // Click the "activate squash button" button
        const squashMethodButton = findUniqueMergeTypeSelectionButton("squash");
        squashMethodButton.click();
    }
}

function checkIfIsBackPort(baseBranchName, headBranchName) {
    // Base branch: destination
    // Head branch: source
    const regex = /^backport\/.+/;
    const headIsBackport = regex.test(headBranchName)
    const baseIsDevelop = baseBranchName === 'develop';
    console.log(baseBranchName, headBranchName, headIsBackport, baseIsDevelop);

    return headIsBackport && baseIsDevelop;
}



function extractBranchName(branchElement) {
    let branchName = branchElement.text;
    const forkBranchRegex = /[^:]+:(\w+)/;
    let match = branchName.match(forkBranchRegex);
    if (match) {
        // If it's a forked branch, extract the branch name
        branchName = match[1];
    }
    return branchName;
}

// Find the button that selects (activates) the squash merge type. It doesn't apply it, it just selects it for the user
// to be able to click on it.
function findUniqueMergeTypeSelectionButton(buttonName) {
    let potentialButtons = document.querySelectorAll(`div.merge-message button[value="${buttonName}"]`);
    // TODO: throw an error if there are no buttons
    // TODO: throw an error if there are more than one button
    return potentialButtons[0];
}
