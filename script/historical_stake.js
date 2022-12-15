const ethers = require("ethers")

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://mainnet.aurora.dev"
  )
  // https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html
  // `totalAmountOfStakedAurora` is stored in slot 252 (C3-linearization)
  const storagePosition = ethers.utils.hexlify(252)
  const block = 75575610 // from contract deployment block 65575610 to "latest"
  const totalAmountOfStakedAurora = await provider.getStorageAt(
    "0xccc2b1aD21666A5847A804a73a41F904C4a4A0Ec",
    storagePosition,
    block
  )
  const totalAuroraShares = await provider.getStorageAt(
    "0xccc2b1aD21666A5847A804a73a41F904C4a4A0Ec",
    ethers.utils.hexlify(254),
    block
  )
  const totalStreamShares = await provider.getStorageAt(
    "0xccc2b1aD21666A5847A804a73a41F904C4a4A0Ec",
    ethers.utils.hexlify(255),
    block
  )
  console.log(
    `Total $AURORA staked at block ${block}: ${ethers.utils.formatUnits(
      totalAmountOfStakedAurora,
      18
    )}`
  )
  console.log(
    `Total shares at block ${block}: ${ethers.BigNumber.from(
      totalAuroraShares
    ).toString()}`
  )
  console.log(
    `Total stream shares at block ${block}: ${ethers.BigNumber.from(
      totalStreamShares
    ).toString()}`
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
