import { network } from "hardhat";

async function main() {
    const { ethers } = await network.connect();

    const EventTicketing = await ethers.getContractFactory(
        "EventTicketing"
    );

    const eventTicketing = await EventTicketing.deploy();

    await eventTicketing.waitForDeployment();

    console.log(
        "EventTicketing deployed to:",
        await eventTicketing.getAddress()
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});