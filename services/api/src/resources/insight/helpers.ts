import sha1 from 'sha1';

export const convertBytesToHumanFileSize = (size) => {
  if (size < 1024) return size + ' B';

  let i = Math.floor(Math.log(size) / Math.log(1024));
  let num: number | string = (size / Math.pow(1024, i));
  let round = Math.round(num);

  num = round < 10 ? num.toFixed(2) : round < 100 ? num.toFixed(1) : round;
  return `${num} ${'KMGTPEZY'[i-1]}B`;
}

export const getEnvironmentName = (
  environmentData,
  projectData
) => {
  // we need to get the safename of the environment from when it was created
  const makeSafe = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')
  var environmentName = makeSafe(environmentData.name)
  var overlength = 58 - projectData.name.length;
  if ( environmentName.length > overlength ) {
    var hash = sha1(environmentName).substring(0,4)
    environmentName = environmentName.substring(0, overlength-5)
    environmentName = environmentName.concat('-' + hash)
  }

  return environmentName ? environmentName : ""
}