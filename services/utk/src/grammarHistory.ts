
//import { getDiff } from 'json-difference'

const grammarHistory = (function () {
    let grammarHistory: string[] = [];
    let grammarDiff: any[] = [];
    const getHistory = function () {
        return grammarHistory;    // Or pull this from cookie/localStorage
    };

    const pushToHistory = function (history: string) {
        grammarHistory.push(history)
        // Also set this in cookie/localStorage
    };
    const calculateAndPushDiff = function (obj1: any, obj2: any) {
        let ret: any = {};
        for (var i in obj2) {
            if (!obj1.hasOwnProperty(i) || obj2[i] !== obj1[i]) {
                if (!Array.isArray(obj2[i]) || !(JSON.stringify(obj2[i]) == JSON.stringify(obj1[i]))) {
                    ret[i] = obj2[i];
                }
            }
        }
        // let diff = getDiff(obj1, obj2);
        grammarDiff.push(ret);
        // console.log(`ret: ${JSON.stringify(diff)}`);
        return ret;
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