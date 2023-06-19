const GrammarHistory = (function () {
    let grammarHistory: string[] = [];

    const getHistory = function () {
        return grammarHistory;    // Or pull this from cookie/localStorage
    };

    const pushToHistory = function (history: string) {
        grammarHistory.push(history)
        // Also set this in cookie/localStorage
    };

    const getLength = function () {
        return grammarHistory.length;
    }

    return {
        getHistory: getHistory,
        pushToHistory: pushToHistory,
        getLength: getLength
    }

})();

export default GrammarHistory;