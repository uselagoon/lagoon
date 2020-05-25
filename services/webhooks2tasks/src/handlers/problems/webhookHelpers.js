const generateProblemsWebhookEventName = ({
    source,
    severity,
    isSummaryData = false
}) => {
    const prefix = 'problem';
    const eventType = 'insert';
    const dataType = isSummaryData ? 'summary' : 'item';
    let ret = `${prefix}:${eventType}:${source}:${dataType}:${severity}`;
    console.log(ret);
    return ret;
};

module.exports = {
    generateProblemsWebhookEventName
};