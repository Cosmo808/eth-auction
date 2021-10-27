const SimpleAuction = artifacts.require("SimpleAuction");

const biddingTime = 500;
const beneficiary = '0x59111832f2B4E708b2D44b289Ba5563EE8CC31cD';

module.exports = function (deployer) {
  deployer.deploy(SimpleAuction, biddingTime, beneficiary);
};
