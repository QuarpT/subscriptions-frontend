/*
This collects the result from each branch of Parallel state.

This step is necessary because AWS Step functions currently do not support ResultPath in top-level Parallel state:
https://forums.aws.amazon.com/thread.jspa?threadID=244326&tstart=0

TODO: Remove this once AWS implements fully Amazon State Language
 */

exports.handler = (event, context, callback) => {
    var jsonResult = {
        credentials: event[0],
        criteriaSatisfied: (event.map((branchResult) => branchResult.deletionCriterionSatisfied).indexOf(false) < 0)
    };

    callback(null, jsonResult);
};

