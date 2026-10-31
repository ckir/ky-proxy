import test from 'ava';
import ky, {type ProxyOptions} from '../source/index.js';

const fixture = 'https://example.com/target';

test('proxy as string option is passed to fetch', async t => {
	t.plan(2);

	const proxyUrl = 'http://proxy.example.com:8080';
	const customFetch: typeof fetch = async (request, init) => {
		t.is((init as any).proxy, proxyUrl);
		return new Response('ok');
	};

	const response = await ky(fixture, {proxy: proxyUrl, fetch: customFetch}).text();
	t.is(response, 'ok');
});

test('proxy as URL option is passed to fetch', async t => {
	t.plan(2);

	const proxyUrl = new URL('http://proxy.example.com:8080');
	const customFetch: typeof fetch = async (request, init) => {
		t.is((init as any).proxy, proxyUrl);
		return new Response('ok');
	};

	const response = await ky(fixture, {proxy: proxyUrl, fetch: customFetch}).text();
	t.is(response, 'ok');
});

test('proxy as ProxyOptions object is passed to fetch', async t => {
	t.plan(2);

	const proxyOptions: ProxyOptions = {
		url: 'http://proxy.example.com:8080',
		headers: {
			'Proxy-Authorization': 'Bearer test-token',
		},
	};

	const customFetch: typeof fetch = async (request, init) => {
		t.deepEqual((init as any).proxy, proxyOptions);
		return new Response('ok');
	};

	const response = await ky(fixture, {proxy: proxyOptions, fetch: customFetch}).text();
	t.is(response, 'ok');
});

test('proxy as false is passed to fetch', async t => {
	t.plan(2);

	const customFetch: typeof fetch = async (request, init) => {
		t.is((init as any).proxy, false);
		return new Response('ok');
	};

	const response = await ky(fixture, {proxy: false, fetch: customFetch}).text();
	t.is(response, 'ok');
});

test('proxy: null throws TypeError', async t => {
	t.plan(2);

	await t.throwsAsync(
		async () => {
			// @ts-expect-error - Testing invalid null input
			await ky(fixture, {proxy: null});
		},
		{
			instanceOf: TypeError,
			message: 'The `proxy` option must not be `null`. Use `undefined` to clear it.',
		},
	);

	t.throws(
		() => {
			// @ts-expect-error - Testing invalid null input
			ky.create({proxy: null});
		},
		{
			instanceOf: TypeError,
			message: 'The `proxy` option must not be `null`. Use `undefined` to clear it.',
		},
	);
});

test('dispatcher: null throws TypeError', async t => {
	t.plan(2);

	await t.throwsAsync(
		async () => {
			// @ts-expect-error - Testing invalid null input
			await ky(fixture, {dispatcher: null});
		},
		{
			instanceOf: TypeError,
			message: 'The `dispatcher` option must not be `null`. Use `undefined` to clear it.',
		},
	);

	t.throws(
		() => {
			// @ts-expect-error - Testing invalid null input
			ky.create({dispatcher: null});
		},
		{
			instanceOf: TypeError,
			message: 'The `dispatcher` option must not be `null`. Use `undefined` to clear it.',
		},
	);
});

test('invalid proxy values throw TypeError', async t => {
	const invalidValues = [123, true, {}, {foo: 'bar'}];

	for (const value of invalidValues) {
		// eslint-disable-next-line no-await-in-loop
		await t.throwsAsync(
			async () => {
				// @ts-expect-error - Testing invalid input
				await ky(fixture, {proxy: value});
			},
			{
				instanceOf: TypeError,
				message: 'The `proxy` option must be a string, URL, object with a `url` property, or `false`.',
			},
		);
	}
});

test('invalid proxy.url throws TypeError', async t => {
	await t.throwsAsync(
		async () => {
			// @ts-expect-error - Testing invalid input
			await ky(fixture, {proxy: {url: 123}});
		},
		{
			instanceOf: TypeError,
			message: 'The `proxy.url` option must be a string or URL.',
		},
	);
});

test('invalid proxy.headers throws TypeError', async t => {
	await t.throwsAsync(
		async () => {
			// @ts-expect-error - Testing invalid input
			await ky(fixture, {proxy: {url: 'http://proxy.example.com', headers: 'invalid'}});
		},
		{
			instanceOf: TypeError,
			message: 'The `proxy.headers` option must be an object.',
		},
	);
});

test('cannot specify both proxy and dispatcher', async t => {
	await t.throwsAsync(
		async () => {
			await ky(fixture, {
				proxy: 'http://proxy.example.com:8080',
				dispatcher: {name: 'mock-agent'},
			});
		},
		{
			instanceOf: TypeError,
			message: 'Cannot specify both `proxy` and `dispatcher` options.',
		},
	);
});

test.serial('proxy is not supported in browser environments', async t => {
	const fakeWindow = {document: {}};
	(globalThis as any).window = fakeWindow;
	(globalThis as any).document = fakeWindow.document;

	try {
		await t.throwsAsync(
			async () => {
				await ky(fixture, {proxy: 'http://proxy.example.com:8080'});
			},
			{
				instanceOf: TypeError,
				message: 'The `proxy` option is not supported in browser environments.',
			},
		);

		// The `proxy: false` option in browser should not throw
		const customFetch: typeof fetch = async () => new Response('ok');
		const result = await ky(fixture, {proxy: false, fetch: customFetch}).text();
		t.is(result, 'ok');
	} finally {
		delete (globalThis as any).window;
		delete (globalThis as any).document;
	}
});

test('proxy option inheritance with ky.create and ky.extend', async t => {
	t.plan(2);

	const customFetch: typeof fetch = async (request, init) => {
		t.is((init as any).proxy, 'http://child-proxy.com:8080');
		return new Response('ok');
	};

	const parent = ky.create({
		proxy: 'http://parent-proxy.com:8080',
		fetch: customFetch,
	});

	const child = parent.extend({
		proxy: 'http://child-proxy.com:8080',
	});

	const response = await child(fixture).text();
	t.is(response, 'ok');
});

test('clearing proxy option with undefined in ky.extend', async t => {
	t.plan(2);

	const customFetch: typeof fetch = async (request, init) => {
		t.is((init as any).proxy, undefined);
		return new Response('ok');
	};

	const parent = ky.create({
		proxy: 'http://parent-proxy.com:8080',
		fetch: customFetch,
	});

	const child = parent.extend({
		proxy: undefined,
	});

	const response = await child(fixture).text();
	t.is(response, 'ok');
});

test('dispatcher option is passed to fetch without @ts-expect-error', async t => {
	t.plan(2);

	const mockDispatcher = {name: 'custom-dispatcher'};
	const customFetch: typeof fetch = async (request, init) => {
		t.is((init as any).dispatcher, mockDispatcher);
		return new Response('ok');
	};

	// Notice: No @ts-expect-error needed!
	const response = await ky(fixture, {
		dispatcher: mockDispatcher,
		fetch: customFetch,
	}).text();

	t.is(response, 'ok');
});

test('beforeRetry hook can update proxy', async t => {
	t.plan(3);

	const proxies: any[] = [];
	let attempt = 0;

	const customFetch: typeof fetch = async (request, init) => {
		attempt++;
		proxies.push((init as any).proxy);
		if (attempt === 1) {
			return new Response('error', {status: 500});
		}

		return new Response('ok', {status: 200});
	};

	const response = await ky(fixture, {
		proxy: 'http://primary-proxy.com:8080',
		retry: {
			limit: 1,
			statusCodes: [500],
		},
		fetch: customFetch,
		hooks: {
			beforeRetry: [
				() => ({
					options: {
						proxy: 'http://backup-proxy.com:8080',
					},
				}),
			],
		},
	}).text();

	t.is(response, 'ok');
	t.is(proxies[0], 'http://primary-proxy.com:8080');
	t.is(proxies[1], 'http://backup-proxy.com:8080');
});

test('beforeRetry hook can update dispatcher', async t => {
	t.plan(3);

	const dispatchers: any[] = [];
	let attempt = 0;

	const agent1 = {name: 'agent1'};
	const agent2 = {name: 'agent2'};

	const customFetch: typeof fetch = async (request, init) => {
		attempt++;
		dispatchers.push((init as any).dispatcher);
		if (attempt === 1) {
			return new Response('error', {status: 500});
		}

		return new Response('ok', {status: 200});
	};

	const response = await ky(fixture, {
		dispatcher: agent1,
		retry: {
			limit: 1,
			statusCodes: [500],
		},
		fetch: customFetch,
		hooks: {
			beforeRetry: [
				() => ({
					options: {
						dispatcher: agent2,
					},
				}),
			],
		},
	}).text();

	t.is(response, 'ok');
	t.is(dispatchers[0], agent1);
	t.is(dispatchers[1], agent2);
});

test('beforeRetry hook throws when returning null proxy or dispatcher', async t => {
	await t.throwsAsync(
		async () => {
			await ky(fixture, {
				retry: 1,
				fetch: async () => new Response('error', {status: 500}),
				hooks: {
					beforeRetry: [
						// @ts-expect-error - Testing invalid null input
						() => ({options: {proxy: null}}),
					],
				},
			});
		},
		{
			instanceOf: TypeError,
			message: 'The `proxy` option must not be `null`. Use `undefined` to clear it.',
		},
	);

	await t.throwsAsync(
		async () => {
			await ky(fixture, {
				retry: 1,
				fetch: async () => new Response('error', {status: 500}),
				hooks: {
					beforeRetry: [
						// @ts-expect-error - Testing invalid null input
						() => ({options: {dispatcher: null}}),
					],
				},
			});
		},
		{
			instanceOf: TypeError,
			message: 'The `dispatcher` option must not be `null`. Use `undefined` to clear it.',
		},
	);
});

test('proxy in Node.js throws helpful error when undici is missing with global fetch', async t => {
	// Undici is not installed in the repo node_modules
	await t.throwsAsync(
		async () => {
			await ky('https://example.com/some-url', {
				proxy: 'http://proxy.example.com:8080',
				retry: 0,
			});
		},
		{
			instanceOf: Error,
			message: 'To use the `proxy` option in Node.js, please install `undici` or pass a custom `dispatcher`.',
		},
	);
});
