export const isValidRoomId = (id: any): boolean => {
  // Allow alphanumeric, dashes, underscores. Max 50 chars.
  return typeof id === 'string' && /^[a-zA-Z0-9-_]{1,50}$/.test(id);
};

export const isValidSDP = (data: any): boolean => {
  // minimal check: must have type and sdp string
  return data && typeof data.type === 'string' && typeof data.sdp === 'string';
};

export const isValidCandidate = (data: any): boolean => {
  return data && typeof data.candidate === 'string';
};
