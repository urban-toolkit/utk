
const rdiff = require('recursive-diff');

const grammarHistory = (function () {
    let grammarHistory: string[] = [];
    let grammarDiff: any[] = [];
    const getHistory = function () {
        return grammarHistory;    // Or pull this from cookie/localStorage
    };

    const pushToHistory = function (currentGrammar: string) {
        grammarHistory.push(currentGrammar)
        // Also set this in cookie/localStorage
    };
    const calculateAndPushDiff = function (currentGrammar: any, nextGrammar: any) {
        // let ret: any = {};
        

        console.log(`Current Knots: ${currentGrammar}`);
        console.log(`Next Knots:  ${nextGrammar}`)
        const parsed = JSON.parse(nextGrammar);
        const reparsed = JSON.parse(JSON.stringify(nextGrammar));
        console.log(`Parsed: ${parsed}`);
        console.log(`Reparsed: ${reparsed}`);
        console.log(JSON.stringify(currentGrammar.knots));
        const diff = rdiff.getDiff(currentGrammar.knots, nextGrammar.knots);
        console.log(`Diff: ${JSON.stringify(diff)}`)
        return diff;
    };


    const getLength = function () {
        return grammarHistory.length;
    }



    return {
        getHistory: getHistory,
        pushToHistory: pushToHistory,
        getLength: getLength,
        calculateAndPushDiff: calculateAndPushDiff
    }

})();

export default grammarHistory;