const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args))
const { createClient } = require("@urql/core")
const ethers = require("ethers")

const APIURL =
  "https://api.thegraph.com/subgraphs/name/paouvrard/aurora-plus-staking"

const client = createClient({
  url: APIURL,
  fetch,
})

async function main() {
  const searchAccounts = ["0x...", "0x..."]
  const auroraDecimals = 18
  const eventsQuery = `
    query {
      unstakeds (
        first: 1000,
        orderBy: blockTimestamp,
        orderDirection: desc,
        where: { user_in: ${JSON.stringify(
          searchAccounts.map((a) => a.toLowerCase())
        )} }
      ) {
        user
        amount
        blockTimestamp
        transactionHash
      }
      stakeds (
        first: 1000,
        orderBy: blockTimestamp,
        orderDirection: desc,
        where: { user_in: ${JSON.stringify(
          searchAccounts.map((a) => a.toLowerCase())
        )} }
      ) {
        user
        amount
        blockTimestamp
        transactionHash
      }
    }
  `
  const { data, error } = await client.query(eventsQuery).toPromise()
  if (error) {
    console.error(error)
    return
  }
  const { unstakeds, stakeds } = data || {}
  const stakeWithoutPartialUnstake = stakeds.filter(
    (s) => !unstakeds.find((e) => e.transactionHash === s.transactionHash)
  )
  const allEvents = [...stakeWithoutPartialUnstake, ...unstakeds].sort(
    (a, b) => b.blockTimestamp - a.blockTimestamp
  )
  searchAccounts.forEach((account) => {
    const accountEvents = allEvents.filter(
      (e) => e.user === account.toLowerCase()
    )
    const prettyAccountEvents = accountEvents.map((e) => ({
      type: e.__typename,
      amount: ethers.utils.formatUnits(e.amount, auroraDecimals),
      date: new Date(e.blockTimestamp * 1000).toDateString(),
      tx: e.transactionHash,
    }))
    console.log(`${account}: ${JSON.stringify(prettyAccountEvents, 2, 2)}`)
  })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
