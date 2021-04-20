import moment from "moment";

export const getFromNowTime = (date) => {
    return moment.utc(date).fromNow();
};

export const getCreatedDate = (date) => {
    return moment.utc(date).format('DD MM YYYY, HH:mm:ssZ');
};