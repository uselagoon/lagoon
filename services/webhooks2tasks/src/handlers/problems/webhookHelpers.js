const generateProblemsWebhookEventName = ({
    source,
    severity,
    isSummaryData = false,
    isNew = true,
}) => {
    const prefix = 'problem';
    const eventType = isNew ? 'insert' :  'update';
    const dataType = isSummaryData ? 'summary' : 'item';
    return `${prefix}:${eventType}:${source}:${dataType}:${severity}`;
};

module.exports = {
    generateProblemsWebhookEventName
};