import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("toolchain smoke test", async () => {
  const { viem } = await network.create();

  it("deploys an OpenZeppelin ERC-20 on the local chain", async () => {
    const token = await viem.deployContract("Smoke");
    assert.equal(await token.read.symbol(), "SMK");
  });
});
