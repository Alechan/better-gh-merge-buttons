// The function to run
enableButtonForMergingOrSquashingOnRender();

function findBranchElement() {
    return document.querySelector(".commit-ref.base-ref a");
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

            const branchElement = findBranchElement();
            const mergePrElement = findMergePRElement();

            let mergeTypeBoxHasBeenLoaded = branchElement && mergePrElement;
            if (mergeTypeBoxHasBeenLoaded) {
                // TODO: use the variable that we are defining? find a less ouroboros'ish alternative
                observer.disconnect();

                setDefaultMergeType(branchElement);
            }
        });
    });

    // Start observing the body for added nodes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function setDefaultMergeType(branchElement) {
    let branchName = extractBranchName(branchElement);

    if (branchName === 'master') {
        // Click the "activate merge button" button
        const mergeMethodButton = findUniqueMergeTypeSelectionButton("merge");
        mergeMethodButton.click();
    } else if (branchName === 'develop') {
        // Click the "activate squash button" button
        const squashMethodButton = findUniqueMergeTypeSelectionButton("squash");
        squashMethodButton.click();
    }
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
