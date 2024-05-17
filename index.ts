import neynarClient from './utils/neynarClient'

const file = Bun.file('./allowance_data.json')

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    try {
      const allowances = await file.json()
      const body = await req.text()
      const hookData = JSON.parse(body)

      if (!process.env.SIGNER_UUID) {
        throw new Error('Make sure you set SIGNER_UUID in your .env file')
      }

      const username = hookData?.data?.author?.username

      if (!username) {
        throw new Error("Wrong request, username wasn't provided")
      }

      const tips = allowances[username]

      if (!tips) {
        throw new Error('User allowance not found or tips are zero')
      }

      const reply = await neynarClient.publishCast(
        process.env.SIGNER_UUID,
        `${username} Tips received: ${tips}`,
        {
          embeds: [],
          replyTo: hookData.data.hash,
        }
      )

      return new Response(`Replied to the cast with hash: ${reply.hash}`)
    } catch (e) {
      const errorMessage = String(
        e instanceof Object && 'message' in e ? e.message : e
      )
      return new Response(errorMessage, { status: 500 })
    }
  },
})

console.log(`Listening on localhost:${server.port}`)
