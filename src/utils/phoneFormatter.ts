export const formatPhoneNumber = (value: string): string => {
  // Strip all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  
  // Truncate to maximum 11 digits (e.g. 03337645673)
  const truncated = cleaned.slice(0, 11);

  if (truncated.length <= 4) {
    return truncated;
  }

  // Format as 0333-7645673
  return `${truncated.slice(0, 4)}-${truncated.slice(4)}`;
};
