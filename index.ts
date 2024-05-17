import neynarClient from './utils/neynarClient'

const tipsFile = Bun.file('./tips_data.json')
const allowanceFile = Bun.file('./allowance_data.json')

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    try {
      if (!process.env.SIGNER_UUID) {
        throw new Error('Make sure you set SIGNER_UUID in your .env file')
      }

      const body = await req.text()
      const hookData = JSON.parse(body)
      const username = hookData?.data?.author?.username

      if (!username) {
        throw new Error("Wrong request, username wasn't provided")
      }

      const tipsParsed = await tipsFile.json()
      const tips = tipsParsed[username]

      if (tips === undefined) {
        throw new Error('User tips not found')
      }

      const allowanceParsed = await allowanceFile.json()
      const allowance = allowanceParsed[username]

      if (allowance === undefined) {
        throw new Error('Allowance not found')
      }

      const reply = await neynarClient.publishCast(
        process.env.SIGNER_UUID,
        `${username} Tips received: ${tips} NEGED \n Allowance: ${allowance} NEGED`,
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
