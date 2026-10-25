import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { deployAll, expectRevert, inr, DAY } from "../support/helpers.js";

describe("MockINRToken (demo token)", async () => {
  const conn = await network.create();
  async function fixture() {
    return deployAll(conn);
  }
  const load = () => conn.networkHelpers.loadFixture(fixture);

  it("has 6 decimals and a clearly labelled demo name", async () => {
    const c = await load();
    assert.equal(await c.token.read.decimals(), 6);
    assert.match(await c.token.read.name(), /Demo/);
  });

  it("faucet gives test tokens once per cooldown", async () => {
    const c = await load();
    await c.token.write.faucet({ account: c.stranger.account });
    assert.equal(await c.bal(c.stranger), inr(5_000_000));
    await expectRevert(c.token.write.faucet({ account: c.stranger.account }), "FaucetCooldown");
    await c.networkHelpers.time.increase(Number(DAY) + 1);
    await c.token.write.faucet({ account: c.stranger.account });
    assert.equal(await c.bal(c.stranger), inr(10_000_000));
  });

  it("only the owner can mint", async () => {
    const c = await load();
    await expectRevert(c.token.write.mint([c.stranger.account.address, 1n], { account: c.stranger.account }), "OwnableUnauthorizedAccount");
  });
});
