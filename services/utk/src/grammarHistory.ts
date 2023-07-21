
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
        // for (var i in obj2) {
        //     if (!obj1.hasOwnProperty(i) || obj2[i] !== obj1[i]) {
        //         if (!Array.isArray(obj2[i]) || !(JSON.stringify(obj2[i]) == JSON.stringify(obj1[i]))) {
        //             ret[i] = obj2[i];
        //         }
        //     }
        // }
        //  let diff = getDiff(obj1, obj2);
        // grammarDiff.push(ret);
        // console.log(`ret: ${JSON.stringify(diff)}`);
        // const currentKnots = JSON.parse(currentGrammar).knots;
        //const newKnots = JSON.parse(nextGrammar).knots;

        console.log(`Current Knots: ${currentGrammar}`);
        console.log(`Next Knots:  ${nextGrammar}`)
        console.log(JSON.stringify(currentGrammar));
        const diff = rdiff.getDiff(currentGrammar, nextGrammar);
        console.log(`Diff: ${diff}`)
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