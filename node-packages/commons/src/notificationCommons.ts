import * as R from 'ramda';

// Note: we're using integer representations of the
// severity in order to be able to use numeric comparisons
// when determining which messages to send

export const notificationContentTypeToInt = R.cond([
    [R.equals('NONE'), R.always(0)],
    [R.equals('UNKNOWN'), R.always(10)],
    [R.equals('NEGLIGIBLE'), R.always(20)],
    [R.equals('LOW'), R.always(30)],
    [R.equals('MEDIUM'), R.always(40)],
    [R.equals('HIGH'), R.always(50)],
    [R.equals('CRITICAL'), R.always(60)],
  ]);

export const notificationIntToContentType = R.cond([
    [R.equals('0'), R.always('NONE')],
    [R.equals('10'), R.always('UNKNOWN')],
    [R.equals('20'), R.always('NEGLIGIBLE')],
    [R.equals('30'), R.always('LOW')],
    [R.equals('40'), R.always('MEDIUM')],
    [R.equals('50'), R.always('HIGH')],
    [R.equals('60'), R.always('CRITICAL')],
    [R.T, R.always('NONE')],
  ]);
