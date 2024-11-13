// Check if we're on the right page and the required element is present
function findQuestionAndOptions() {
    const questionDiv = document.querySelector('.cs-question-choice-description');
    if (!questionDiv) return;

    const questionText = questionDiv.querySelector('p')?.innerText;
    const questionTypeElement = document.querySelector('.ant-divider-inner-text');
    const questionType = questionTypeElement ? questionTypeElement.innerText : '';

    if (!questionText || !questionType) return;

    const options = Array.from(document.querySelectorAll('label.answer-item.ant-radio-wrapper'))
        .map(label => label.innerText);

    // Send question details to background script
    chrome.runtime.sendMessage({
        type: "QUESTION_DETAILS",
        payload: {
            question: questionText,
            type: questionType.includes("Single choice") ? "single" : "multiple",
            options
        }
    });
}

// Listen for a new question to be loaded
function observeQuestionChanges() {
    const observer = new MutationObserver(() => {
        findQuestionAndOptions();
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Initialize content script
observeQuestionChanges();

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "ANSWER") {
        const answer = message.answer;
        const questionType = document.querySelector('.ant-divider-inner-text')?.innerText;

        const isSingleChoice = questionType && questionType.includes("Single choice");
        const labels = Array.from(document.querySelectorAll('label.answer-item.ant-radio-wrapper'));

        labels.forEach(label => {
            const input = label.querySelector('input');
            if (input) {
                if ((isSingleChoice && answer.includes(label.innerText)) || 
                    (!isSingleChoice && answer.split(", ").includes(label.innerText))) {
                    input.checked = true;
                } else {
                    input.checked = false;
                }
            }
        });
    }
});

function monitorForNewQuestions() {
    const observer = new MutationObserver(() => {
        const allUnchecked = Array.from(document.querySelectorAll('input[type="radio"], input[type="checkbox"]'))
            .every(input => !input.checked);
        if (allUnchecked) {
            findQuestionAndOptions();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Start monitoring on script load
monitorForNewQuestions();
