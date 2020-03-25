import moment from 'moment';

const convertDateToMYSQLDateTimeFormat = (date: string) => {
  const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
  return moment(new Date(date).toISOString())
    .format(DATE_FORMAT)
    .toString();
};

export default convertDateToMYSQLDateTimeFormat;