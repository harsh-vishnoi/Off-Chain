import { default as Web3 } from "web3";
import { default as contract } from "truffle-contract";
import $ from "jquery";
var ABI = require('ethereumjs-abi')
import PaymentContractArtifacts from "../../build/contracts/Payment_Contract.json";

var PaymentContract = contract(PaymentContractArtifacts);
var PaymentContract_Instance, CurAccount;
var Amount, Send = 0;
var Nonce = 0;

var Sender, Recipient;

window.App = {
    start: async function() {
      var self = this;
      PaymentContract.setProvider(web3.currentProvider);

      web3.eth.getAccounts(function(err, accs) {
          if(err != null){
              alert("There was an error fetching your accounts");
              return;
          }

          if(accs.length == 0){
              alert("Counldn't get any accounts! Make sure your Ethereum Client is configured correctly");
              return;
          }
          CurAccount = accs[0];

          ethereum.on('accountsChanged', function (accounts) {
            App.getAccount();
          })
      })
    },

    startContract : async function(){
        $("#nonce").val(Nonce);
        Sender = CurAccount;
        $("#err").empty();
        if($("#Amount_Escrow").val() == 0){
          console.log("Enter amount! Can't procces without it.");
          $("#err").append("Error! Pay some ethers")
          return;
        }

        console.log(Sender);
        console.log($("#Amount_Escrow").val());
        Amount = $("#Amount_Escrow").val();

        // console.log(Amount, Sender, $("#Duration").val());
        PaymentContract.new($("#Duration").val(), {from: Sender, value: $("#Amount_Escrow").val(), gas: 3000000}).then(instance => {
            PaymentContract_Instance = instance;
            console.log(instance);

            $("#add").append("Sender Add : ", Sender);
            $("#amount").append("Amount escrowed : ", Amount);
            $("#StartContract").hide();
            $("#SendEthers").show();
            $("#JoinContract").hide();
            $("#info").append("Contract has Been Initialised Address :" + instance.address);

            PaymentContract_Instance.joinEvent(function(error, eventObj) {
              if(!error) {
                console.log(eventObj);
              } else {
                console.error(error);
              }

              playerJoinedEvent.stopWatching();
            });

        });

    },

    sendEthers : async function() {
        $("#nonce").empty();
        var hash = "0x" + ABI.soliditySHA3(
          ["address", "uint256", "uint256", "address"],
          [Recipient, $("#SendMoney").val(), Nonce, PaymentContract_Instance.address]
        ).toString("hex");

        console.log(hash);
        web3.eth.sign(CurAccount, hash, function(err, res){
          if(err){
            console.log(err);
            return;
          }else{
            console.log(res);
            $("#sign").append(res);
          }
        });
        $("#nonce").append(Nonce);
        Nonce++;
    },

    joinContract : async function(){
      $("#amount").empty();
        if(Recipient == null){
          Recipient = CurAccount;
        }else{
          if(CurAccount != Recipient){
            console.log("Switch Account! Switch account to reciever");
            return;
          }
        }

        PaymentContract.at($("#ContractAddress").val()).then(instance => {
          PaymentContract_Instance = instance;
          return PaymentContract_Instance.joinContract({from: Recipient, gas: 3000000});
        }).then(tx => {
          console.log(tx);
          $("#amount").append("Amount recieved : ", Send);
          $("#add").append("Recipient Add : ", Recipient);
          $("#StartContract").hide();
          $("#JoinContract").hide();
          $("#EndContract").show();
          $("#Recover").show();
        })
    },

    getSender : async function() {
      PaymentContract_Instance.close($("#Value").val(), $("#Nonce").val(), $("#Signature").val(), {from: Recipient, gas:3000000}).then(tx => {
          console.log(tx);
      })
    },

    getAccount : async function(){
      const accounts = await ethereum.enable();
      CurAccount = accounts[0];
      console.log("Current Account ", CurAccount);
    }
};

window.addEventListener("load", function() {
  if (window.ethereum) {
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable();
  } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",
    );
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:8545"),
    );
  }
  // window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));

  App.start();
});
