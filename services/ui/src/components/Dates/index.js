import moment from "moment";

export const getFromNowTime = (date) => {
    return moment(date).fromNow();
};

export const getCreatedDate = (date) => {
    return moment.utc(date).local().format('DD MM YYYY, HH:mm:ss');
};