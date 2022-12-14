const ethers = require("ethers")

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://mainnet.aurora.dev"
  )
  const storagePosition = ethers.utils.hexlify(252)
  const block = 75575610
  const totalAmountOfStakedAurora = await provider.getStorageAt(
    "0xccc2b1aD21666A5847A804a73a41F904C4a4A0Ec",
    storagePosition,
    block
  )
  console.log(`Total $AURORA staked at block ${block}: ${ethers.utils.formatUnits(totalAmountOfStakedAurora, 18)}`)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })