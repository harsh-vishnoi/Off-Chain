const Payment_Contract = artifacts.require("Payment_Contract");

module.exports = function(deployer) {
     deployer.deploy(Payment_Contract);
};
