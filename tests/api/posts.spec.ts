import { test, expect } from '@playwright/test';

/**
 * DRILL 3 (target: 15 minutes).
 *
 * The `request` fixture is an APIRequestContext: real HTTP, no browser, no
 * page. Runs in a fraction of the time of the UI equivalent.
 *
 * Interview framing: "I push everything that is not a rendering concern down
 * to this layer. Coverage stays, runtime and flake drop."
 *
 * Note on the target: jsonplaceholder is read-only — a POST returns a created
 * body but persists nothing. That limit is itself a talking point, and the
 * seed-then-assert-in-UI pattern lives in tests/drills/seeded-state.spec.ts
 * instead, where we control the state.
 */
test.describe('posts API', () => {
  test('GET /posts returns a well-formed collection', async ({ request }) => {
    const res = await request.get('/posts');

    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/json');

    const posts = await res.json();
    expect(Array.isArray(posts)).toBe(true);
    expect(posts).toHaveLength(100);

    // Contract check on the shape, not just a smoke check on the status code.
    // Asserting the shape is what catches a backend rename before the UI does.
    expect(posts[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        userId: expect.any(Number),
        title: expect.any(String),
        body: expect.any(String),
      }),
    );
  });

  test('GET /posts/:id returns the requested record', async ({ request }) => {
    const res = await request.get('/posts/1');
    expect(res.ok()).toBeTruthy();

    const post = await res.json();
    expect(post.id).toBe(1);
    expect(post.title).toBeTruthy();
  });

  test('a missing record is a 404, not a 200 with an empty body', async ({ request }) => {
    const res = await request.get('/posts/999999');
    expect(res.status()).toBe(404);
  });

  test('POST /posts echoes the payload and assigns an id', async ({ request }) => {
    const payload = { title: 'flake triage', body: 'trace first, guess never', userId: 7 };

    const res = await request.post('/posts', { data: payload });

    expect(res.status()).toBe(201);
    const created = await res.json();
    expect(created).toMatchObject(payload);
    expect(created.id).toBeGreaterThan(0);
  });

  test('query parameters filter the collection', async ({ request }) => {
    const res = await request.get('/posts', { params: { userId: 3 } });
    const posts = await res.json();

    expect(posts.length).toBeGreaterThan(0);
    // Assert on every element, not just the first. A filter that works for
    // posts[0] and nothing else is a real bug class.
    for (const post of posts) expect(post.userId).toBe(3);
  });
});
