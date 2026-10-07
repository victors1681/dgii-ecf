/**
 * Returns the current date and time in the America/Santo_Domingo time zone
 * (GMT-4), using a 24-hour clock.
 *
 * @returns The formatted date and time in `DD-MM-YYYY HH:mm:ss` format.
 */
export const getCurrentFormattedDateTime = () => {
  const timeZone = 'America/Santo_Domingo';
  const currentDate = new Date();

  const options = {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // 24 hours
  };

  const formatter = new Intl.DateTimeFormat('es-DO', options as any);
  const parts = formatter.formatToParts(currentDate);

  const mappedParts = parts.reduce((acc, part) => {
    acc[part.type] = part.value;

    return acc;
  }, {} as Record<string, string>);

  const formattedDate = `${mappedParts.day}-${mappedParts.month}-${mappedParts.year} ${mappedParts.hour}:${mappedParts.minute}:${mappedParts.second}`;

  return formattedDate;
};

/**
 * Returns the current date in the America/Santo_Domingo time zone (GMT-4).
 *
 * @returns The formatted date in `DD-MM-YYYY` format.
 */
export const getCurrentFormattedDate = () => {
  const timeZone = 'America/Santo_Domingo';
  const currentDate = new Date();

  const options = {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // No effect on the returned date because time parts are omitted.
  };

  const formatter = new Intl.DateTimeFormat('es-DO', options as any);
  const parts = formatter.formatToParts(currentDate);

  const mappedParts = parts.reduce((acc, part) => {
    acc[part.type] = part.value;

    return acc;
  }, {} as Record<string, string>);

  const formattedDate = `${mappedParts.day}-${mappedParts.month}-${mappedParts.year}`;

  return formattedDate;
};
