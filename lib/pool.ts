export async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Math.min(Math.max(limit, 1), items.length);
  if (workers === 0) return results;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await fn(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}
