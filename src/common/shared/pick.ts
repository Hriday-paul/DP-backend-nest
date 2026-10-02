const pick = <T extends Record<string, unknown>, K extends keyof T>(
  query: T,
  fields: K[],
): Partial<T> => {
  const finalQuery: Partial<T> = {};
  if (!query || !fields) return finalQuery;
  for (const key of fields) {
    // ✅ Borrow from Object.prototype directly — works even on null-prototype objects
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      finalQuery[key] = query[key];
    }
  }
  return finalQuery;
};

export default pick;