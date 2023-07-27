
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
        

        // console.log(`Current Knots: ${currentGrammar.components}`);
        // console.log(`Next Knots:  ${nextGrammar.components[0].knots}`)
        const nextGrammarParsed = JSON.parse(nextGrammar);
        const currentGrammarParsed = JSON.parse(currentGrammar);
        console.log(`Parsed: ${nextGrammarParsed.components[0].knots}`); // <- OK É ESSE AQUI
        console.log(`Reparsed: ${currentGrammarParsed.components[0].knots}`);
        const nextGrammarKnots = nextGrammarParsed.components[0].knots;
        const currentGrammarKnots = currentGrammarParsed.components[0].knots;


        const diff = rdiff.getDiff(nextGrammarKnots, currentGrammarKnots);
        grammarDiff.push(diff);
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