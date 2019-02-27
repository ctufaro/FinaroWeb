const SwayToken = artifacts.require("SwayToken");

contract('SwayToken', (accounts) => {
  it('should put 100000000 SwayToken in the first account', async () => {
    const swayTokenInstance = await SwayToken.deployed();
    const balance = await swayTokenInstance.balanceOf.call(accounts[0]);

    assert.equal(balance.valueOf(), 100000000, "100000000 wasn't in the first account");
  });
  it('should call a function that depends on a conversion', async () => {
    const swayTokenInstance = await SwayToken.deployed();
    const swayTokenBalance = (await swayTokenInstance.balanceOf.call(accounts[0])).toNumber();
    const swayTokenEthBalance = (await swayTokenInstance.balanceOfInEth.call(accounts[0], 2)).toNumber();

    assert.equal(swayTokenEthBalance, 2 * swayTokenBalance, 'Library function returned unexpected function, linkage may be broken');
  });
  it('should send coin correctly', async () => {
    const swayTokenInstance = await SwayToken.deployed();

    // Setup 2 accounts.
    const accountOne = accounts[0];
    const accountTwo = accounts[1];

    // Get initial balances of first and second account.
    const accountOneStartingBalance = (await swayTokenInstance.balanceOf.call(accountOne)).toNumber();
    const accountTwoStartingBalance = (await swayTokenInstance.balanceOf.call(accountTwo)).toNumber();

    // Make transaction from first account to second.
    const amount = 10;
    await swayTokenInstance.transfer(accountTwo, amount, { from: accountOne });

    // Get balances of first and second account after the transactions.
    const accountOneEndingBalance = (await swayTokenInstance.balanceOf.call(accountOne)).toNumber();
    const accountTwoEndingBalance = (await swayTokenInstance.balanceOf.call(accountTwo)).toNumber();

    assert.equal(accountOneEndingBalance, accountOneStartingBalance - amount, "Amount wasn't correctly taken from the sender");
    assert.equal(accountTwoEndingBalance, accountTwoStartingBalance + amount, "Amount wasn't correctly sent to the receiver");
  });
});
