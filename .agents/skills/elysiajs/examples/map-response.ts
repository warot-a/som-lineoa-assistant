import { Elysia } from 'elysia'

const prettyJson = new Elysia()
	.mapResponse(({ responseValue }) => {
		if (responseValue instanceof Object) {
			return new Response(JSON.stringify(responseValue, null, 4))
		}
	})
	.as('scoped')

new Elysia()
	.use(prettyJson)
	.get('/', () => ({
		hello: 'world'
	}))
	.listen(3000)
