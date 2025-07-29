// Helper functions for UserRepository

export function buildUpdateExpression(updates: Record<string, unknown>): string {
  const expressions = Object.keys(updates).map((key) => `#${key} = :${key}`);
  return `SET ${expressions.join(', ')}`;
}

export function buildExpressionAttributeNames(
  updates: Record<string, unknown>
): Record<string, string> {
  const names: Record<string, string> = {};
  Object.keys(updates).forEach((key) => {
    names[`#${key}`] = key;
  });
  return names;
}

export function buildExpressionAttributeValues(
  updates: Record<string, unknown>
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  Object.entries(updates).forEach(([key, value]) => {
    values[`:${key}`] = value;
  });
  return values;
}

export function mapDynamoItemToUser(item: Record<string, unknown>): unknown {
  const {
    _PK,
    _SK,
    _GSI1PK,
    _GSI1SK,
    _GSI2PK,
    _GSI2SK,
    _GSI3PK,
    _GSI3SK,
    _GSI4PK,
    _GSI4SK,
    ...user
  } = item;
  return user;
}