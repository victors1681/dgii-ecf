export const getCurrentFormattedDateTime = () => {
  const timeZone = 'America/Santo_Domingo';

  const currentDate = new Date().toLocaleString('en-US', { timeZone });

  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // Use 24-hour format
  };

  const dateParts = new Intl.DateTimeFormat(
    'en-US',
    options as any
  ).formatToParts(new Date(currentDate));
  const formattedDate = `${dateParts[2].value}-${dateParts[0].value}-${dateParts[4].value} ${dateParts[6].value}:${dateParts[8].value}:${dateParts[10].value}`;

  return formattedDate;
};
