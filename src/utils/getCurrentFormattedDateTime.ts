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
    hour12: true,
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
    hour12: true,
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
